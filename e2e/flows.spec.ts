import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('karma.lang', 'en'));
});

test('1. visitor tries the demo and lands on Home with two ghadas', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('See your karma. Grow every day.')).toBeVisible();
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Jai Shri Krishna/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Punya ghada/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Paap ghada/ })).toBeVisible();
  await expect(page.getByTestId('tithi')).toContainText(/Sud|Vad/);
});

test('2. user talks about their day and sees scored actions', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Talk' }).click();
  await page.getByRole('textbox', { name: 'Tell me about your day' }).fill('I donated to charity and helped a friend, but I lied to my boss.');
  await page.getByRole('button', { name: 'Analyse' }).click();
  await expect(page.getByText('Gave in charity').first()).toBeVisible();
  await expect(page.getByText('Was untruthful').first()).toBeVisible();
  await page.getByRole('button', { name: 'I disagree' }).first().click();
  await page.getByRole('textbox', { name: /Tell us what you think/ }).fill('The lie was small');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Thank you. Your note is saved.')).toBeVisible();
});

test('3. user reflects in Pratikraman, then deletes all data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Try the demo' }).click();
  await page.getByRole('link', { name: 'Pratikraman' }).click();
  await page.getByRole('textbox', { name: 'Your reflection' }).first().fill('I was tired and spoke sharply.');
  await page.getByRole('textbox', { name: 'Your commitment' }).first().fill('Pause before replying');
  await page.getByRole('button', { name: 'Save reflection' }).first().click();
  await expect(page.getByText('Reflected').first()).toBeVisible();
  await page.getByRole('button', { name: 'Kshama' }).click();
  await expect(page.getByRole('heading', { name: 'Peace to you' })).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('button', { name: /Delete my account and all data/ }).click();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText('See your karma. Grow every day.')).toBeVisible();
});
