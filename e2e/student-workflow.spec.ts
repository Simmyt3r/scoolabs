import { test, expect } from '@playwright/test';

test('all four science subjects contain three working experiments', async ({ page }) => {
  await page.goto('/');
  for (const subject of ['Chemistry','Physics','Biology','Agriculture']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: subject }).click();
    await expect(page.locator('.experiment-pill')).toHaveCount(3);
    for (const button of await page.locator('.experiment-pill').all()) {
      await expect(button).toBeEnabled();
      await button.click();
      await expect(page.locator('.lab-grid')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Record these results' })).toBeVisible();
    }
  }
});

test('notebook survives page restart in the browser-only preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Student profile' }).click();
  const profile = page.getByRole('dialog', { name: 'Student profile' });
  await profile.getByPlaceholder('Your name').fill('Pilot Learner');
  await profile.getByPlaceholder('SS2A').fill('SS2A');
  await profile.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('button', { name: 'Record these results' }).click();
  const notebook = page.getByRole('dialog', { name: 'Save your experiment' });
  await notebook.getByPlaceholder('What did you discover?').fill('The burette reading affects pH.');
  await notebook.getByRole('button', { name: 'Save to notebook' }).click();
  await expect(page.getByText('Observation saved to your offline notebook.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /My notebook/ }).click();
  await expect(page.locator('.records-table')).toContainText('Pilot Learner');
  await expect(page.locator('.records-table')).toContainText('The burette reading affects pH.');
  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /My notebook/ }).click();
  await expect(page.locator('.records-table')).toContainText('Pilot Learner');
});

test('teacher panel gives clear desktop-only feedback in web preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Teacher workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Teacher workspace' })).toBeVisible();
  await expect(page.getByText(/requires the installed Scoolabs desktop application/)).toBeVisible();
});
