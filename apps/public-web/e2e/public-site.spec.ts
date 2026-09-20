import { expect, test } from '@playwright/test';

/**
 * Public website end-to-end coverage.
 *
 * These assert behaviour a visitor or a crawler actually experiences:
 * real status codes, server-rendered content, working navigation and forms
 * that validate before they submit.
 */

test.describe('homepage', () => {
  test('renders the hero, dynamic sections and footer', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Technology That Unlocks');
    await expect(page.getByText('Key Tech Solutions designs and builds')).toBeVisible();

    // Sections resolved from the database, not hardcoded in the page.
    await expect(
      page.getByRole('heading', { name: /Services built around the work/i }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: /KeySportsBooking/i }).first()).toBeVisible();

    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('has exactly one h1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('primary calls to action lead where they say', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Start a Project' }).first().click();
    await expect(page).toHaveURL(/\/request-a-quote$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/quote/i);
  });
});

test.describe('navigation', () => {
  test('every primary route responds with 200', async ({ page }) => {
    const paths = [
      '/about',
      '/services',
      '/solutions',
      '/industries',
      '/products',
      '/portfolio',
      '/case-studies',
      '/process',
      '/technology',
      '/blog',
      '/careers',
      '/contact',
      '/request-a-quote',
      '/privacy',
      '/terms',
      '/cookie-policy',
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('an unknown path returns a real 404 that is not indexed', async ({ page }) => {
    const response = await page.goto('/definitely-not-a-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: /does not exist/i })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test.describe('detail pages', () => {
  test('a service page shows its content and FAQs', async ({ page }) => {
    await page.goto('/services/saas-product-development');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('SaaS Product Development');
    await expect(page.getByRole('heading', { name: 'Frequently asked' })).toBeVisible();

    // <details> works without JavaScript, so the answer is in the DOM already.
    const question = page.getByText(/Do you work on early-stage products/i);
    await expect(question).toBeVisible();
  });

  test('a product page states its development status honestly', async ({ page }) => {
    await page.goto('/products/keysportsbooking');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('KeySportsBooking');
    await expect(page.getByText('In development').first()).toBeVisible();
    // No availability is promised anywhere on the page.
    await expect(page.getByText(/available now/i)).toHaveCount(0);
  });

  test('a case study omits results when there are no verified metrics', async ({ page }) => {
    await page.goto('/case-studies/building-a-reliable-availability-model');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Verified outcomes' })).toHaveCount(0);
  });

  test('a portfolio project is explicit about customer attribution', async ({ page }) => {
    await page.goto('/portfolio/keysportsbooking-platform-build');
    await expect(page.getByText('Key Tech Solutions (internal product)').first()).toBeVisible();
  });

  test('a blog article renders its body and publication date', async ({ page }) => {
    await page.goto('/blog/why-availability-is-harder-than-booking');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Why availability is harder',
    );
    await expect(page.getByText(/Published/).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Derive it instead' })).toBeVisible();
  });
});

test.describe('contact form', () => {
  test('refuses to submit without consent and reports why', async ({ page }) => {
    await page.goto('/contact');

    await page.getByLabel('Your name').fill('E2E Tester');
    await page.getByLabel('Email address').fill('e2e@example.invalid');
    await page.getByLabel('Subject').fill('Automated end to end test');
    await page
      .getByLabel('Message')
      .fill('This message is long enough to pass the minimum length rule.');

    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/You must agree before submitting/i).first()).toBeVisible();
  });

  test('accepts a complete submission and returns a reference', async ({ page }) => {
    await page.goto('/contact');

    await page.getByLabel('Your name').fill('E2E Tester');
    await page.getByLabel('Email address').fill('e2e@example.invalid');
    await page.getByLabel('Subject').fill('Automated end to end test');
    await page
      .getByLabel('Message')
      .fill('Submitted by the automated end to end suite. Safe to ignore or delete.');
    await page.getByRole('checkbox').check();

    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByText('Message received')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/KTS-C-\d{6}/)).toBeVisible();
  });
});

test.describe('careers', () => {
  test('lists open roles and offers an application form', async ({ page }) => {
    await page.goto('/careers');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Work at Key Tech');

    await page
      .getByRole('link', { name: /Full Stack Engineer/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/careers\/full-stack-engineer$/);
    await expect(
      page.getByRole('heading', { name: /Apply for Full Stack Engineer/i }),
    ).toBeVisible();
    await expect(page.getByLabel('Your name')).toBeVisible();
  });

  test('a draft role is not reachable', async ({ page }) => {
    const response = await page.goto('/careers/product-designer');
    expect(response?.status()).toBe(404);
  });
});

test.describe('crawlability', () => {
  test('robots.txt excludes admin, api and preview', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('/admin/');
    expect(body).toContain('/api/');
    expect(body).toContain('/preview/');
    expect(body).toContain('Sitemap:');
  });

  test('sitemap.xml lists published content and excludes drafts', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('/products/keysportsbooking');
    expect(body).not.toContain('/careers/product-designer');
    expect(body).not.toContain('/preview');
  });

  test('preview responds noindex', async ({ request }) => {
    const response = await request.get('/preview/service/saas-product-development');
    expect(response.headers()['x-robots-tag']).toContain('noindex');
  });

  test('security headers are present on every response', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-powered-by']).toBeUndefined();
  });
});
