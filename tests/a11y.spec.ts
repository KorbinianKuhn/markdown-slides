import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { decks } from './decks';

// Accessibility of the generated slides: the WCAG 2.2 level A and AA rules
// that axe-core can check automatically, in light, dark and mobile mode.
// Manual checks are still needed, e.g. for meaningful alt texts.
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const check = async (page: Page, include?: string) => {
  // Diagrams and formulas are rendered (and labeled) in the browser
  await page.waitForFunction(() =>
    [...document.querySelectorAll('pre.mermaid')].every((node) =>
      node.querySelector('svg'),
    ),
  );
  await page.evaluate(async () => {
    const w = window as Window & {
      MathJax?: { startup?: { promise?: Promise<void> } };
    };
    await w.MathJax?.startup?.promise;
  });

  let builder = new AxeBuilder({ page }).withTags(tags);
  if (include) {
    builder = builder.include(include);
  }
  const { violations } = await builder.analyze();
  // Readable failures: rule, description and the elements with details
  // (e.g. colors and contrast ratio)
  return violations.map((violation) => ({
    rule: violation.id,
    help: violation.help,
    nodes: violation.nodes.map((node) => ({
      target: node.target.join(' '),
      data: node.any[0]?.data,
    })),
  }));
};

for (const deck of decks) {
  for (const path of deck.pages) {
    test(`${deck.name}/${path}`, async ({ page }) => {
      await page.goto(`/${deck.name}/${path}`);
      expect(await check(page)).toEqual([]);
    });
  }
}

test('menu', async ({ page }) => {
  await page.goto('/features/index.html');
  await page.locator('header button[aria-haspopup="dialog"]').click();
  await expect(page.locator('#menu')).toBeVisible();
  expect(await check(page, '#menu')).toEqual([]);
});
