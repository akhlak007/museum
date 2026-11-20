import { expect, test } from '@playwright/test';

test('demo user can complete the Room 711 security mission', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Louvre Guardian' })).toBeVisible();
  await expect(page.getByText('Development demo mode')).toBeVisible();
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await expect(page.getByText('Operation Quiet Gallery')).toBeVisible();
  await page.getByRole('button', { name: 'Begin patrol' }).click();
  await expect(page.getByText('ROOM 711', { exact: true })).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('heading', { name: 'Security Dashboard' })).toBeVisible();
  await page.getByRole('button', { name: 'Take offline' }).nth(1).click();
  await expect(page.getByText('offline · simulated')).toBeVisible();
  await page.getByRole('button', { name: 'Restore online' }).click();
  await page.getByRole('button', { name: 'Take offline' }).first().click();
  await expect(page.getByText('offline · simulated').first()).toBeVisible();
  await page.getByRole('button', { name: 'Restore online' }).click();
  await expect(page.getByText('online · simulated').first()).toBeVisible();
  await page.getByRole('button', { name: 'View feed' }).click();
  await expect(page.getByLabel('Live simulated camera feed')).toBeVisible();
  await page.screenshot({ path: 'output/screenshots/camera-feed.png' });
  await page.getByRole('button', { name: 'Close camera feed' }).click();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await page.screenshot({ path: 'output/screenshots/room-711-gameplay.png' });

  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'Full Museum Security Map' })).toBeVisible();
  await expect(page.getByText('711 · SALLE DES ÉTATS')).toBeVisible();
  await page.screenshot({ path: 'output/screenshots/full-security-map.png' });
  await page.getByRole('button', { name: 'Close panel' }).click();

  await expect(page.getByText('SECURITY INCIDENT')).toBeVisible({ timeout: 12_000 });
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await expect(page.getByRole('button', { name: 'Verify on scene' })).toBeEnabled({ timeout: 12_000 });
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  await page.getByRole('button', { name: 'Verify on scene' }).click();
  await page.getByRole('button', { name: 'Classify visitor violation' }).click();
  await page.getByRole('button', { name: 'Dispatch Guard G-12' }).click();
  await expect(page.getByRole('button', { name: 'Log safe response' })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Log safe response' }).click();
  await page.getByRole('button', { name: 'Resolve and submit report' }).click();
  await expect(page.getByRole('heading', { name: 'Mission Report — Operation Quiet Gallery' })).toBeVisible();
  await expect(page.getByText('1,000 points')).toBeVisible();
  await page.screenshot({ path: 'output/screenshots/mission-report.png' });
  await page.getByRole('button', { name: 'Continue patrol' }).click();
});

test('demo user can inspect the Mona Lisa presentation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await page.getByRole('button', { name: 'Begin patrol' }).click();
  await page.keyboard.down('w');
  await expect(page.getByText('Inspect Mona Lisa')).toBeVisible({ timeout: 30_000 });
  await page.keyboard.up('w');
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Artifact Inspection' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Official Louvre collection record' })).toBeVisible();
  await page.screenshot({ path: 'output/screenshots/artifact-inspection.png' });
});
