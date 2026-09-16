import { expect, test } from '@playwright/test';

test('loads the FamilieTools web application', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Welcome to SvelteKit/i })).toBeVisible();
});
