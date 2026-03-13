// @ts-check
const { test, expect } = require('@playwright/test');

const pages = [
  { path: '/', title: 'Monument Pilates' },
  { path: '/about/', title: 'About' },
  { path: '/classes/', title: 'Classes' },
  { path: '/pricing/', title: 'Pricing' },
  { path: '/schedule/', title: 'Schedule' },
  { path: '/faq/', title: 'FAQ' },
  { path: '/contact/', title: 'Contact' },
  { path: '/testimonials/', title: 'Testimonials' },
  { path: '/blog/', title: 'Blog' },
  { path: '/report/', title: 'Report' },
];

test.describe('Page loading & navigation', () => {
  for (const page of pages) {
    test(`${page.path} loads successfully`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      expect(response?.status()).toBe(200);
      await expect(p).toHaveTitle(new RegExp(page.title, 'i'));
    });
  }

  test('navbar links are functional', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.navbar__links a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Check all nav links resolve to 200
    for (let i = 0; i < count; i++) {
      const href = await navLinks.nth(i).getAttribute('href');
      if (href && href.startsWith('/')) {
        const response = await page.goto(href);
        expect(response?.status()).toBe(200);
      }
    }
  });

  test('no broken internal links', async ({ page }) => {
    for (const pg of pages) {
      await page.goto(pg.path);
      const links = page.locator('a[href^="/"]');
      const count = await links.count();
      for (let i = 0; i < count; i++) {
        const href = await links.nth(i).getAttribute('href');
        if (href) {
          const response = await page.goto(href);
          expect(response?.status(), `Broken link: ${href} on ${pg.path}`).toBe(200);
        }
      }
    }
  });

  test('no broken images', async ({ page }) => {
    for (const pg of pages) {
      await page.goto(pg.path);
      const images = page.locator('img[src]');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const natural = await img.evaluate(
          (el) => /** @type {HTMLImageElement} */ (el).naturalWidth
        );
        expect(natural, `Broken image: ${src} on ${pg.path}`).toBeGreaterThan(0);
      }
    }
  });

  test('CSS and JS load correctly', async ({ page }) => {
    const failures = [];
    page.on('response', (response) => {
      const url = response.url();
      if ((url.endsWith('.css') || url.endsWith('.js')) && response.status() >= 400) {
        failures.push(`${response.status()} ${url}`);
      }
    });
    await page.goto('/');
    expect(failures).toEqual([]);
  });
});
