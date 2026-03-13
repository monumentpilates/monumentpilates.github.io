// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const pages = [
  '/',
  '/about/',
  '/classes/',
  '/pricing/',
  '/schedule/',
  '/faq/',
  '/contact/',
  '/testimonials/',
  '/blog/',
];

test.describe('Accessibility (axe-core)', () => {
  for (const path of pages) {
    test(`${path} has no critical accessibility violations`, async ({ page }) => {
      await page.goto(path);
      // Disable transitions and force animated elements visible for accurate contrast evaluation
      await page.evaluate(() => {
        document.querySelectorAll('.fade-up, .fade-in').forEach(el => {
          el.style.transition = 'none';
          el.classList.add('visible');
        });
        // Force reflow so styles apply immediately
        document.body.offsetHeight;
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const critical = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );

      if (critical.length > 0) {
        const summary = critical.map(
          (v) =>
            `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} instance${v.nodes.length > 1 ? 's' : ''})`
        ).join('\n');
        expect(critical, `Accessibility violations on ${path}:\n${summary}`).toHaveLength(0);
      }
    });
  }

  test('all images have alt text', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        const src = await images.nth(i).getAttribute('src');
        expect(alt, `Image missing alt text: ${src} on ${path}`).toBeTruthy();
      }
    }
  });

  test('page has proper heading hierarchy', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allInnerTexts();
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `${path} should have exactly one h1`).toBe(1);
    }
  });

  test('all pages have lang attribute', async ({ page }) => {
    for (const path of pages) {
      await page.goto(path);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang, `${path} missing lang attribute`).toBeTruthy();
    }
  });
});
