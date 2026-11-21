import { expect, Page, test } from '@playwright/test';

// Behavior of the slides app in the browser

type AppWindow = Window & { app?: { goToSlide: (index: number) => void } };

const goToSlide = (page: Page, index: number) =>
  page.evaluate((i) => (window as AppWindow).app!.goToSlide(i), index);

/** Index of the slide at the top of the view, and how far it is scrolled. */
const position = (page: Page) =>
  page.evaluate(() => {
    const container = document.querySelector('.slides-container')!;
    const slides = [...container.querySelectorAll('section')];
    const index = slides.findIndex(
      (slide) => slide.offsetTop + slide.offsetHeight > container.scrollTop,
    );
    return {
      index,
      offset: Math.round(container.scrollTop - slides[index].offsetTop),
    };
  });

const isFullscreen = (page: Page) =>
  page.evaluate(() => document.fullscreenElement !== null);

test('keeps the current slide when the window is resized', async ({ page }) => {
  await page.goto('/features/index.html');
  await goToSlide(page, 6);

  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect.poll(() => position(page)).toEqual({ index: 6, offset: 0 });

  await page.setViewportSize({ width: 1280, height: 600 });
  await expect.poll(() => position(page)).toEqual({ index: 6, offset: 0 });
});

test('keeps the current slide in and after fullscreen', async ({ page }) => {
  await page.goto('/features/index.html');
  await goToSlide(page, 3);

  await page.locator('header button[onclick="onClickOpenMenu()"]').click();
  await page.locator('#menu button[onclick="onClickFullscreen()"]').click();
  await expect.poll(() => isFullscreen(page)).toBe(true);
  await expect.poll(() => position(page)).toEqual({ index: 3, offset: 0 });

  // Scroll in fullscreen, then leave it
  await goToSlide(page, 6);
  // Same as pressing Escape, which headless Chromium ignores
  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => isFullscreen(page)).toBe(false);
  await expect.poll(() => position(page)).toEqual({ index: 6, offset: 0 });
});

test('keeps the position within a slide when the window is resized', async ({
  page,
}) => {
  await page.goto('/features/index.html');
  await goToSlide(page, 6);
  // Wait for the scroll event, as the app handles it
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const container = document.querySelector('.slides-container')!;
        container.addEventListener('scroll', resolve, { once: true });
        container.scrollBy(0, 200);
      }),
  );
  const before = await position(page);

  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect.poll(async () => (await position(page)).index).toBe(6);
  const after = await position(page);
  // The slide grows with the window, so the offset grows proportionally
  expect(after.offset).toBeGreaterThan(before.offset);
});

/** Scrolls with the mouse wheel like a user and waits until it settles. */
const wheel = async (page: Page, deltaY: number) => {
  const scrollTop = () =>
    page.evaluate(() => document.querySelector('.slides-container')!.scrollTop);
  const start = await scrollTop();
  await page.mouse.move(640, 400);
  await page.mouse.wheel(0, deltaY);
  await expect.poll(scrollTop).not.toBe(start);
  // Settled when it doesn't change between two animation frames
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const container = document.querySelector('.slides-container')!;
        let last = -1;
        const check = () => {
          if (container.scrollTop === last) {
            resolve();
          } else {
            last = container.scrollTop;
            requestAnimationFrame(() => requestAnimationFrame(check));
          }
        };
        check();
      }),
  );
};

test('keeps the position when scrolling in fullscreen, ignoring the URL anchor', async ({
  page,
}) => {
  // The anchor points to the first slide, the reader scrolls away from it
  await page.goto('/features/print.html#long-list');
  await expect.poll(() => position(page).then((p) => p.index)).toBe(1);
  await wheel(page, 3000);
  const beforeFullscreen = await position(page);
  expect(beforeFullscreen.index).toBe(2);

  await page.locator('header button[onclick="onClickOpenMenu()"]').click();
  await page.locator('#menu button[onclick="onClickFullscreen()"]').click();
  await expect.poll(() => isFullscreen(page)).toBe(true);
  await expect.poll(() => position(page)).toEqual(beforeFullscreen);

  // Scroll further into the tall code slide, then leave fullscreen
  await wheel(page, 400);
  const inFullscreen = await position(page);
  expect(inFullscreen.index).toBe(2);
  expect(inFullscreen.offset).toBeGreaterThan(beforeFullscreen.offset);

  await page.evaluate(() => document.exitFullscreen());
  await expect.poll(() => isFullscreen(page)).toBe(false);
  await expect.poll(() => position(page)).toEqual(inFullscreen);
});

// Keyboard access. Safari only moves to links with Tab if enabled in its
// settings, so these tests run in Chromium and Firefox.
test.describe('keyboard', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Tab skips links');

  /** Presses Tab until the focused element matches the selector. */
  const tabTo = async (page: Page, selector: string) => {
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('Tab');
      if (
        await page.evaluate((s) => document.activeElement!.matches(s), selector)
      ) {
        return;
      }
    }
    throw new Error(`No focusable element matches ${selector}`);
  };

  const focused = (page: Page) =>
    page.evaluate(() => {
      const el = document.activeElement!;
      const style = getComputedStyle(el);
      return {
        inMenu: el.closest('#menu') !== null,
        opacity: style.opacity,
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
      };
    });

  test('the closed menu is not in the tab order', async ({ page }) => {
    await page.goto('/features/index.html');
    await page.keyboard.press('Tab');
    expect((await focused(page)).inMenu).toBe(false);

    await page.locator('header button[onclick="onClickOpenMenu()"]').click();
    await page.keyboard.press('Tab');
    expect((await focused(page)).inMenu).toBe(true);
  });

  test('focused elements are visible and outlined', async ({ page }) => {
    await page.goto('/features/index.html');
    await tabTo(page, 'a[href^="http"]');
    expect(await focused(page)).toMatchObject({ outline: 'solid 2px' });

    await tabTo(page, 'button.copy');
    // Fades in
    await expect
      .poll(() => focused(page))
      .toEqual({
        inMenu: false,
        opacity: '1',
        outline: 'solid 2px',
      });
  });

  test('Space activates a focused button instead of the next slide', async ({
    page,
  }) => {
    await page.goto('/features/index.html');
    await tabTo(page, 'button.copy');
    const before = await position(page);
    await page.keyboard.press('Space');
    await expect(page.getByRole('status')).toHaveText('Copied to clipboard');
    expect(await position(page)).toEqual(before);
  });
});
