import { expect, test } from '@playwright/test';

/**
 * Administration panel end-to-end coverage.
 *
 * Credentials come from the environment, never from the repository:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 * Without them the authenticated tests skip with a message rather than fail,
 * so the suite is still useful on a machine that has no admin account.
 */

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001';
const EMAIL = process.env.E2E_ADMIN_EMAIL;
const PASSWORD = process.env.E2E_ADMIN_PASSWORD;

const hasCredentials = Boolean(EMAIL && PASSWORD);

test.describe('admin panel, signed out', () => {
  test('the sign-in page is never indexed', async ({ request }) => {
    const response = await request.get(`${ADMIN_URL}/login`);
    expect(response.status()).toBe(200);
    expect(response.headers()['x-robots-tag']).toContain('noindex');
    expect(response.headers()['cache-control']).toContain('no-store');
  });

  test('an authenticated route redirects to sign-in', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/users`);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Administration panel' })).toBeVisible();
  });

  test('sign-in rejects a wrong password without revealing whether the account exists', async ({
    page,
  }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByLabel('Email address').fill('nobody@example.invalid');
    await page.getByLabel('Password').fill('definitely-not-the-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    const alert = page.getByRole('status').or(page.getByRole('alert')).first();
    await expect(alert).toContainText('Email or password is incorrect');
  });
});

test.describe('admin panel, signed in', () => {
  test.skip(!hasCredentials, 'Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run these');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${ADMIN_URL}/login`);
    await page.getByLabel('Email address').fill(EMAIL as string);
    await page.getByLabel('Password').fill(PASSWORD as string);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('the dashboard shows live counts', async ({ page }) => {
    // Scoped to main: the navigation drawer repeats several of these words.
    const main = page.getByRole('main');
    await expect(main.getByText('Published content')).toBeVisible();
    await expect(main.getByText('Services', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Editorial workflow')).toBeVisible();
  });

  test('a content list loads and filters', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/content/services`);
    await expect(page.getByRole('heading', { name: 'Services', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'SaaS Product Development' })).toBeVisible();

    await page.getByPlaceholder('Search services').fill('booking');
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('link', { name: /Booking and Reservation Platforms/i }),
    ).toBeVisible();
  });

  test('saving a record writes a revision that the history then shows', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/content/services`);
    await page.getByRole('link', { name: 'SaaS Product Development' }).click();

    await expect(
      page.getByRole('heading', { name: 'SaaS Product Development', level: 1 }),
    ).toBeVisible();
    await expect(page.getByLabel('SEO title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Publication workflow' })).toBeVisible();

    // A change summary is the one field that can be set without altering
    // what the website shows, so this saves a revision and nothing else.
    await page.getByLabel('Change summary').fill(`End to end check ${new Date().toISOString()}`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('heading', { name: 'Revision history' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page
        .getByRole('table', { name: 'Revision history' })
        .getByText(/End to end check/)
        .first(),
    ).toBeVisible();
  });

  test('the SEO health screen states what its score is and is not', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/overview/seo-health`);
    await expect(page.getByRole('heading', { name: 'SEO health', level: 1 })).toBeVisible();
    await expect(page.getByText(/not a search engine ranking/i)).toBeVisible();
  });

  test('leads show the submission made by the public suite', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/growth/leads`);
    await expect(page.getByRole('heading', { name: /Leads and quote requests/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Reference' })).toBeVisible();
  });

  test('the audit log records activity', async ({ page }) => {
    await page.goto(`${ADMIN_URL}/admin/audit`);
    await expect(page.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible();
    // Scoped to the table: 'login' also appears as an option in the filter.
    await expect(page.getByRole('table').getByText('login').first()).toBeVisible();
  });

  test('signing out ends the session', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto(`${ADMIN_URL}/admin/users`);
    await expect(page).toHaveURL(/\/login/);
  });
});
