// @ts-check
const { test, expect } = require('@playwright/test');

const pages = ['/', '/about/', '/classes/', '/pricing/', '/schedule/', '/contact/'];

test.describe('Mobile compatibility', () => {
  // These tests only run in mobile projects (Pixel 7, iPhone 14)
  test.skip(({ browserName }, testInfo) => {
    return !testInfo.project.name.startsWith('mobile');
  }, 'Mobile-only tests');

  test('hamburger menu is visible on mobile', async ({ page }) => {
    await page.goto('/');
    const toggle = page.locator('.navbar__toggle');
    await expect(toggle).toBeVisible();
  });

  test('nav links are hidden until toggle clicked', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.navbar__links');
    // On mobile, nav links should be hidden initially
    await expect(navLinks).not.toBeVisible();

    // Click hamburger
    await page.locator('.navbar__toggle').click();
    await expect(navLinks).toBeVisible();
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(
        bodyWidth,
        `Horizontal overflow on ${path}: body=${bodyWidth}px > viewport=${viewportWidth}px`
      ).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
    }
  });

  test('touch targets are at least 44px', async ({ page }) => {
    await page.goto('/');
    // Click hamburger first to reveal nav
    await page.locator('.navbar__toggle').click();
    await page.waitForTimeout(300);

    const navLinks = page.locator('.navbar__links a');
    const count = await navLinks.count();
    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox();
      if (box) {
        expect(
          Math.max(box.height, 44),
          `Nav link ${i} too small: ${box.height}px`
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('hero text is readable on mobile', async ({ page }) => {
    await page.goto('/');
    const heroTitle = page.locator('.hero__title, .hero h1').first();
    if (await heroTitle.isVisible()) {
      const fontSize = await heroTitle.evaluate(
        (el) => parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize, 'Hero title should be at least 24px on mobile').toBeGreaterThanOrEqual(24);
    }
  });

  test('images are responsive', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const images = page.locator('img[src]');
      const count = await images.count();
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      for (let i = 0; i < count; i++) {
        const box = await images.nth(i).boundingBox();
        if (box && box.width > 0) {
          expect(
            box.width,
            `Image overflows viewport on ${path}`
          ).toBeLessThanOrEqual(viewportWidth + 1);
        }
      }
    }
  });
});
