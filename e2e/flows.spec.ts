import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('karma.lang', 'en'));
});

async function enterLocalTestMode(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('karma.demo.active', '1');
    localStorage.setItem('karma.demo.v1', JSON.stringify({
      profile: {
        id: 'demo-user', name: 'Demo', language: 'en', tradition: 'hindu_gita', greeting: 'jsk',
        goals: [], timezone: 'Asia/Kolkata', city: 'Ahmedabad', reminder_time: null,
        consent_at: new Date().toISOString(), onboarding_done: true, keep_words: true, theme: 'light',
      },
      entries: [], actions: [], feedback: [], reflections: [], pratikraman: [],
    }));
  });
}

test('1. visitor sees the two ghadas and the real sign-in options', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Your Punya. Your Paap. Your path forward.')).toBeVisible();
  await expect(page.getByRole('img', { name: /Punya ghada/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Paap ghada/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  await expect(page.getByText(/demo/i)).toHaveCount(0);
  await page.getByRole('link', { name: /Create account with email/ }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
});

test('2. user says their day and each act gets its own points with a dharma principle', async ({ page }) => {
  await enterLocalTestMode(page);
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Tell me about your day' }).fill('I donated food and helped a friend, but I lied to my boss.');
  await page.getByRole('button', { name: 'Analyse' }).click();
  // a popup first says what was found: Punya versus things to reflect upon, with the words still hidden
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByTestId('dlg-punya')).toContainText(/\+\d+/);
  await expect(dialog.getByTestId('dlg-growth')).toContainText('−');
  await expect(dialog.getByTestId('dlg-masked').first()).toBeVisible();
  await dialog.getByRole('button', { name: 'See my ghadas' }).click();
  await expect(dialog).toHaveCount(0);
  // acts are masked by default; points are visible
  await expect(page.getByTestId('masked-act').first()).toBeVisible();
  await expect(page.getByText('Gave in charity')).toHaveCount(0);
  await expect(page.getByLabel('+26 points').first()).toBeVisible();
  // a deliberate tap reveals the act and the dharma principle behind its points
  await page.getByRole('button', { name: 'Show' }).first().click();
  await expect(page.getByTestId('act-text').first()).toBeVisible();
  await expect(page.getByTestId('basis').first()).toBeVisible();
  await page.getByRole('button', { name: 'I disagree' }).first().click();
  await page.getByRole('textbox', { name: /Tell us what you think/ }).fill('The lie was small');
  await page.getByRole('button', { name: 'Send feedback' }).click();
  await expect(page.getByText('Thank you. Your note is saved.')).toBeVisible();
});

test('3. user opens history, signs out, and can delete all data', async ({ page }) => {
  await enterLocalTestMode(page);
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'History' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'History' })).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('button', { name: /Delete my account and all data/ }).click();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText('Your Punya. Your Paap. Your path forward.')).toBeVisible();
});
