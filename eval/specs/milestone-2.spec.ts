import { expect, test, type Page } from '@playwright/test';

const square = (page: Page, name: string) => page.locator(`[data-square="${name}"]`);
const move = async (page: Page, from: string, to: string) => {
  await square(page, from).click();
  await expect(square(page, to)).toHaveClass(/legal-square/);
  await square(page, to).click();
};

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Kids Chess Club' })).toBeVisible();
});

test('offers a legal Help Me suggestion and highlights both squares', async ({ page }) => {
  await page.getByRole('button', { name: 'Help me choose a move' }).click();
  await expect(page.getByText('Coach idea:')).toBeVisible();
  await expect(page.locator('.suggested-from')).toHaveCount(1);
  await expect(page.locator('.suggested-to')).toHaveCount(1);
  await expect(page.locator('.suggested-from')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.suggested-to')).toHaveClass(/legal-square/);
});

test('coach explains a capture and celebrates it', async ({ page }) => {
  await move(page, 'e2', 'e4');
  await move(page, 'd7', 'd5');
  await move(page, 'e4', 'd5');
  await expect(page.getByLabel('Chess coach')).toContainText(/capture|took/i);
  await expect(page.locator('.celebration')).toBeVisible();
});

test('voice coaching is opt-in and has a clear accessible toggle', async ({ page }) => {
  const voice = page.getByRole('button', { name: 'Turn coach voice on' });
  await expect(voice).toBeVisible();
  await voice.click();
  await expect(page.getByRole('button', { name: 'Turn coach voice off' })).toContainText('Voice on');
});
