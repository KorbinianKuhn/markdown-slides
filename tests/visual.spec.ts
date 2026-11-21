import { expect, Page, test } from '@playwright/test';
import { decks } from './decks';

// Font rendering differs between operating systems, so the baseline images
// are made in the Playwright Docker image. Use `npm run test:docker` locally.
test.skip(
  process.platform !== 'linux',
  'Screenshot tests run on Linux only, use `npm run test:docker`',
);

// MathJax is loaded asynchronously by the slides
type MathJaxWindow = Window & {
  MathJax?: { startup?: { promise?: Promise<void> } };
};

const waitUntilRendered = async (page: Page) => {
  await page.waitForFunction(() => {
    const w = window as MathJaxWindow;
    const mathReady = w.MathJax?.startup?.promise !== undefined;
    const mermaidReady = [...document.querySelectorAll('pre.mermaid')].every(
      (node) => node.querySelector('svg'),
    );
    const imagesReady = [...document.images].every((img) => img.complete);
    return mathReady && mermaidReady && imagesReady;
  });
  await page.evaluate(async () => {
    await (window as MathJaxWindow).MathJax?.startup?.promise;
    await document.fonts.ready;
  });
};

for (const deck of decks) {
  for (const path of deck.pages) {
    test(`${deck.name}/${path}`, async ({ page }, testInfo) => {
      if (testInfo.project.metadata.media === 'print') {
        await page.emulateMedia({ media: 'print' });
      }
      // Slides must work offline, e.g. MathJax must not load its font from a CDN
      const external: string[] = [];
      await page.route(
        (url) => url.hostname !== 'localhost',
        (route) => {
          external.push(route.request().url());
          return route.abort();
        },
      );
      await page.goto(`/${deck.name}/${path}`);
      await waitUntilRendered(page);

      const slides = page.locator('section.slide');
      const count = await slides.count();
      expect(count).toBeGreaterThan(0);

      // Slides live in a scroll container, and screenshots only include its
      // visible part. Keep its height (slides are at least as tall as it), but
      // let it overflow, so the page scrolls and long slides are captured fully.
      await page.evaluate(() => {
        const container =
          document.querySelector<HTMLElement>('.slides-container')!;
        container.style.height = `${container.clientHeight}px`;
        container.style.bottom = 'auto';
        container.style.overflow = 'visible';
      });

      const name = path.replace('.html', '');
      for (let i = 0; i < count; i++) {
        // Show only this slide, so its position (and sub-pixel rendering)
        // doesn't depend on the height of the slides before it.
        await page.evaluate((index) => {
          document
            .querySelectorAll<HTMLElement>('section.slide')
            .forEach((slide, j) => {
              slide.style.display = j === index ? '' : 'none';
            });
        }, i);
        await expect
          .soft(slides.nth(i))
          .toHaveScreenshot(
            `${deck.name}-${name}-${String(i).padStart(2, '0')}.png`,
          );
      }
      expect(external).toEqual([]);
    });
  }
}
