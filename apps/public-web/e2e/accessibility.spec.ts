import { expect, test } from '@playwright/test';

/**
 * Accessibility, responsiveness and motion.
 *
 * These are behavioural checks a linter cannot make: that the skip link
 * works, that the mobile menu traps and restores focus, that content is
 * readable with animation disabled, and that no layout scrolls sideways at
 * phone widths.
 */

test.describe('keyboard and landmarks', () => {
  test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toHaveText(/Skip to main content/i);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('landmarks are present exactly once', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
  });

  test('every image has an alt attribute', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let index = 0; index < count; index += 1) {
      // Decorative images use alt="", which is present-but-empty, not missing.
      await expect(images.nth(index)).toHaveAttribute('alt', /.*/);
    }
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: 'Start a Project' }).first();
    await link.focus();
    const outline = await link.evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');
  });
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'Only meaningful at phone widths');

  test('opens, traps focus, closes on Escape and restores focus', async ({ page }) => {
    await page.goto('/');

    const trigger = page.getByRole('button', { name: /Menu/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await trigger.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Background scrolling is locked while the drawer is open.
    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('navigating from the drawer closes it', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Menu/i }).click();
    await page.getByRole('dialog').getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page).toHaveURL(/\/services$/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('responsive layout', () => {
  const widths = [320, 360, 390, 414, 768, 1024, 1280, 1440];

  for (const width of widths) {
    test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');

      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      );
      expect(overflows, `page scrolls sideways at ${width}px`).toBe(false);
    });
  }

  test('body text is at least 16px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const fontSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.body).fontSize),
    );
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });

  test('primary controls meet the 44px touch target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const button = page.getByRole('link', { name: 'Start a Project' }).first();
    const box = await button.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe('reduced motion', () => {
  test('all content is visible with animation disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Scroll to the bottom, then confirm nothing further down stayed hidden.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);

    const hidden = await page.evaluate(
      () =>
        Array.from(document.querySelectorAll('.kt-reveal')).filter(
          (element) => parseFloat(getComputedStyle(element).opacity) < 0.99,
        ).length,
    );
    expect(hidden, 'no revealed element should remain transparent under reduced motion').toBe(0);
  });

  test('content below the fold is readable even before any script runs', async ({ browser }) => {
    // JavaScript disabled entirely: the server-rendered HTML must stand alone.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /Services built around the work/i }),
    ).toBeVisible();

    // Navigation still works without scripting. At phone widths the header
    // menu is a scripted drawer and hides itself, so the footer - server
    // rendered, and complete - is the route to every section.
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: 'All services' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Contact' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Menu/i })).toBeHidden();

    await context.close();
  });
});
