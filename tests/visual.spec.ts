import { expect, Page, test } from '@playwright/test';
import { decks } from './decks';

// Font rendering differs between operating systems, so the baseline images
// are made in the Playwright Docker image. Use `npm run test:docker` locally.
test.skip(
  process.platform !== 'linux',
  'Screenshot tests run on Linux only, use `npm run test:docker`'
);

const waitUntilRendered = async (page: Page) => {
  await page.waitForFunction(() => {
    const w = window as any;
    const mathReady = w.MathJax?.startup?.promise !== undefined;
    const mermaidReady = [...document.querySelectorAll('pre.mermaid')].every(
      (node) => node.querySelector('svg')
    );
    const imagesReady = [...document.images].every((img) => img.complete);
    return mathReady && mermaidReady && imagesReady;
  });
  await page.evaluate(async () => {
    await (window as any).MathJax.startup.promise;
    await document.fonts.ready;
  });
};

for (const deck of decks) {
  for (const path of deck.pages) {
    test(`${deck.name}/${path}`, async ({ page }, testInfo) => {
      if (testInfo.project.metadata.media === 'print') {
        await page.emulateMedia({ media: 'print' });
      }
      await page.goto(`/${deck.name}/${path}`);
      await waitUntilRendered(page);

      const slides = page.locator('section.slide');
      const count = await slides.count();
      expect(count).toBeGreaterThan(0);

      const name = path.replace('.html', '');
      for (let i = 0; i < count; i++) {
        await expect
          .soft(slides.nth(i))
          .toHaveScreenshot(`${deck.name}-${name}-${String(i).padStart(2, '0')}.png`);
      }
    });
  }
}
