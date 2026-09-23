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

test('renders an 8×8 board in the standard starting position', async ({ page }) => {
  const board = page.getByLabel('Chess board');
  await expect(board).toBeVisible();
  await expect(board.locator('button[data-square]')).toHaveCount(64);
  await expect(page.getByLabel('White king on e1')).toBeVisible();
  await expect(page.getByLabel('Black king on e8')).toBeVisible();
  await expect(page.getByLabel('White pawn on a2')).toBeVisible();
  await expect(page.getByLabel('Black pawn on h7')).toBeVisible();
  await expect(page.getByText('White’s turn', { exact: true })).toBeVisible();
});

test('selects pieces, highlights legal moves, moves, and alternates turns', async ({ page }) => {
  await square(page, 'e2').click();
  await expect(square(page, 'e2')).toHaveAttribute('aria-pressed', 'true');
  await expect(square(page, 'e3')).toHaveClass(/legal-square/);
  await expect(square(page, 'e4')).toHaveClass(/legal-square/);
  await expect(square(page, 'e5')).not.toHaveClass(/legal-square/);
  await square(page, 'e4').click();
  await expect(page.getByLabel('White pawn on e4')).toBeVisible();
  await expect(page.getByLabel('Empty square e2')).toBeVisible();
  await expect(page.getByText('Black’s turn', { exact: true })).toBeVisible();
});

test('rejects an illegal target without changing the board', async ({ page }) => {
  await square(page, 'e2').click();
  await square(page, 'e5').click();
  await expect(page.getByLabel('White pawn on e2')).toBeVisible();
  await expect(page.getByLabel('Empty square e5')).toBeVisible();
  await expect(page.getByText('White’s turn', { exact: true })).toBeVisible();
});

test('supports a capture through real clicks', async ({ page }) => {
  await move(page, 'e2', 'e4');
  await move(page, 'd7', 'd5');
  await square(page, 'e4').click();
  await expect(square(page, 'd5')).toHaveClass(/capture-square/);
  await square(page, 'd5').click();
  await expect(page.getByLabel('White pawn on d5')).toBeVisible();
});

test('restart returns the board and turn to the initial state', async ({ page }) => {
  await move(page, 'e2', 'e4');
  await page.locator('header button').click();
  await expect(page.getByLabel('White pawn on e2')).toBeVisible();
  await expect(page.getByLabel('Empty square e4')).toBeVisible();
  await expect(page.getByText('White’s turn', { exact: true })).toBeVisible();
});

test('restart control keeps an accessible name at every viewport', async ({ page }) => {
  await expect(page.locator('header button')).toHaveAccessibleName(/New game/i);
});

test('plays Fool’s Mate from start to checkmate entirely through the UI', async ({ page }) => {
  await move(page, 'f2', 'f3');
  await move(page, 'e7', 'e5');
  await move(page, 'g2', 'g4');
  await move(page, 'd8', 'h4');
  await expect(page.getByRole('alertdialog')).toContainText('Checkmate — Black wins!');
  await expect(page.getByRole('button', { name: 'Play again' })).toBeVisible();
});

test('offers promotion choices and honors an underpromotion', async ({ page }) => {
  await move(page, 'a2', 'a4'); await move(page, 'h7', 'h6');
  await move(page, 'a4', 'a5'); await move(page, 'h6', 'h5');
  await move(page, 'a5', 'a6'); await move(page, 'h5', 'h4');
  await move(page, 'a6', 'b7'); await move(page, 'h4', 'h3');
  await square(page, 'b7').click();
  await square(page, 'a8').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Your pawn reached the end!');
  await dialog.getByRole('button', { name: /knight/i }).click();
  await expect(page.getByLabel('White knight on a8')).toBeVisible();
});
