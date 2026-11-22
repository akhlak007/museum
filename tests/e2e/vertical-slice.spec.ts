import { expect, test, type Page } from '@playwright/test';

test('demo user can complete Room 711 and reconcile the Room 710 inventory in the same patrol', async ({ page }) => {
  test.setTimeout(420_000);
  await page.setViewportSize({ width: 960, height: 600 });
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
  await expect(page.locator('.large-map .map-player')).toHaveAttribute('data-room', '711');
  await page.getByRole('button', { name: 'Floor overview' }).click();
  await expect(page.getByRole('button', { name: /711 · STATE ROOM/ })).toBeVisible();
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

  const moveUntil = patrolMovement(page);
  await moveUntil('s', 'y', 58.5, true);
  await moveUntil('d', 'x', 135, true);
  await moveUntil('w', 'y', 52, false);
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'Saint John the Baptist' })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  for (const name of ['Verify on scene', 'Classify visitor violation', 'Dispatch Guard G-12', 'Log safe response', 'Resolve and submit report', 'Continue patrol']) {
    await page.getByRole('button', { name }).click({ timeout: 60_000 });
  }
  await page.keyboard.press('Tab');
  await page.getByRole('button', { name: 'Open Room 710 inventory case' }).click();
  const register = page.getByRole('button', { name: 'Review movement register' });
  await expect(register).toBeDisabled();
  await page.keyboard.press('m');
  await expect(page.locator('.large-map .map-incident')).toContainText('Inventory discrepancy');
  await page.getByRole('button', { name: 'Close panel' }).click();

  await moveUntil('a', 'x', 118, false);
  await expect(page.getByText('Inspect La Belle Ferronnière', { exact: true })).toBeVisible();
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'La Belle Ferronnière' })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await register.click();
  const evidence = await page.locator('.incident-card p').textContent();
  const clerical = evidence?.includes('duplicate location entry');
  const duplicate = page.getByRole('button', { name: 'Duplicate register entry' });
  const conservation = page.getByRole('button', { name: 'Unrecorded conservation return' });
  await (clerical ? conservation : duplicate).click();
  await expect(page.getByRole('status')).toContainText('conflicts with the evidence');
  await page.screenshot({ path: 'output/screenshots/inventory-evidence.png' });
  await (clerical ? duplicate : conservation).click();
  await page.getByRole('button', { name: 'Reconcile inventory register' }).click();
  await page.getByRole('button', { name: 'Log evidence and response' }).click();
  await page.getByRole('button', { name: 'Resolve and submit report' }).click();
  await expect(page.getByRole('heading', { name: 'Mission Report — Inventory Discrepancy' })).toBeVisible();
  await expect(page.getByText('850 points')).toBeVisible();
  await page.screenshot({ path: 'output/screenshots/inventory-report.png' });
  await page.getByRole('button', { name: 'Continue patrol' }).click();
  await page.keyboard.press('Tab');
  await expect(page.getByText('Room 710 · Inventory discrepancy · resolved')).toBeVisible();
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

function patrolMovement(page: Page) {
  return async function moveUntil(key: string, axis: 'x' | 'y', threshold: number, increasing: boolean) {
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(({key, axis, threshold, increasing}) => {
        const marker = document.querySelector<SVGGElement>('.minimap .map-player');
        const translation = marker?.transform.baseVal.getItem(0).matrix;
        if (!translation) return false;
        const value = axis === 'x' ? translation.e : translation.f;
        const reached = increasing ? value >= threshold : value <= threshold;
        // Release on the observed frame so a slow browser cannot overshoot the doorway
        // while the test runner processes the result.
        if (reached) window.dispatchEvent(new KeyboardEvent('keyup', { key }));
        return reached;
      }, {key, axis, threshold, increasing}, {timeout: 60000});
    } catch (error) {
      const pose = await page.locator('.minimap .map-player').getAttribute('transform');
      throw new Error(`${key} did not reach ${axis}=${threshold}. Last player pose: ${pose}`, { cause: error });
    } finally {
      await page.keyboard.up(key);
    }
  };
}

test('the Denon patrol crosses the doorway, completes a second-gallery report and returns', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await page.getByRole('button', { name: 'Begin patrol' }).click();
  const room = page.locator('.minimap-heading');
  const moveUntil = patrolMovement(page);

  await expect(room).toContainText('711');
  await moveUntil('w', 'y', 25, false);
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', {name:'Artifact Inspection'})).toBeVisible();
  await page.getByRole('button', {name:'Close panel'}).click();
  await moveUntil('s', 'y', 58.5, true);
  await moveUntil('d', 'x', 118, true);
  await moveUntil('w', 'y', 52, false);
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'La Belle Ferronnière' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'La Belle Ferronnière by Leonardo da Vinci' })).toHaveJSProperty('complete', true);
  await page.getByRole('button', { name: 'Close panel' }).click();
  await moveUntil('d', 'x', 135, true);
  await expect(room).toContainText('710');
  await moveUntil('w', 'y', 52, false);
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', {name:'Saint John the Baptist'})).toBeVisible();
  await page.getByRole('button', {name:'Close panel'}).click();
  await expect(page.locator('.minimap .map-incident')).toBeVisible();
  await page.keyboard.press('m');
  await expect(page.locator('.large-map .map-player')).toHaveAttribute('data-room', '710');
  await expect(page.locator('.large-map .map-incident')).toBeVisible();
  await page.getByRole('button', {name:'Close panel'}).click();
  for (const name of ['Verify on scene','Classify visitor violation','Dispatch Guard G-12','Log safe response','Resolve and submit report','Continue patrol']) {
    await page.getByRole('button', {name}).click({timeout:60000});
  }
  await expect(page.locator('.minimap .map-guard')).toHaveAttribute('data-room', '710');
  await moveUntil('s', 'y', 58.5, true);
  await moveUntil('a', 'x', 85, false);
  await expect(room).toContainText('711');
  await page.keyboard.press('m');
  await expect(page.locator('.large-map .map-player')).toHaveAttribute('data-room', '711');
  await page.keyboard.press('m');
  await page.keyboard.press('Tab');
  await expect(page.getByText(/Room 710 · Grande Galerie perimeter alert · resolved/)).toBeVisible();
});

test('the Square Room and Daru stairs connect Level 1 to an inspectable Level 0 landing', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await page.getByRole('button', { name: 'Start priority shift' }).click();
  const moveUntil = patrolMovement(page);
  const room = page.locator('.minimap-heading');
  const inspect = async (title: string) => {
    await expect(page.getByText(`Inspect ${title}`, { exact: true })).toBeVisible();
    await page.keyboard.press('e');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await page.getByRole('button', { name: 'Close panel' }).click();
  };

  await moveUntil('s', 'y', 58.5, true);
  await page.keyboard.down('Shift');
  await moveUntil('d', 'x', 193, true);
  await page.keyboard.up('Shift');
  await expect(room).toContainText('708');
  await moveUntil('w', 'y', 42, false);
  await inspect('Saint Francis Receiving the Stigmata');
  await moveUntil('s', 'y', 58.5, true);
  await moveUntil('d', 'x', 212, true);
  await expect(room).toContainText('703');
  await inspect('Winged Victory of Samothrace');
  await moveUntil('d', 'x', 252, true);
  await expect(room).toContainText('LEVEL 0');
  await inspect('Roman Marble Candelabrum');
  await expect(page.getByText('3 / 3 route checks')).toBeVisible();
  await page.keyboard.press('m');
  const livePlayer = page.locator('.large-map .map-player');
  await expect(livePlayer).toHaveAttribute('data-room', 'daru-lower');
  await moveUntil('a', 'x', 221, false);
  await expect(room).toContainText('LEVEL 1');
  await expect(livePlayer).toHaveAttribute('data-room', '703');
});

test('priority shift supports artwork inspection and a moving field encounter', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await page.getByRole('button', { name: 'Start priority shift' }).click();
  await page.keyboard.down('s');
  try {
    await expect(page.getByText('Inspect The Wedding Feast at Cana')).toBeVisible({ timeout: 30_000 });
  } finally {
    await page.keyboard.up('s');
  }
  await page.keyboard.press('e');
  await expect(page.getByRole('heading', { name: 'The Wedding Feast at Cana' })).toBeVisible();
  await page.getByRole('button', { name: 'Close panel' }).click();
  await expect(page.getByRole('timer')).toContainText('Time to verify', { timeout: 30_000 });
  const marker = page.locator('.minimap .map-incident circle');
  const initialX = await marker.getAttribute('cx');
  await expect(marker).not.toHaveAttribute('cx', initialX!);

  await page.evaluate(() => {
    const keys = new Set<string>();
    const drive = (key: string, pressed: boolean) => {
      if (keys.has(key) === pressed) return;
      if (pressed) keys.add(key);
      else keys.delete(key);
      window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', { key }));
    };
    const follow = () => {
      const player = document.querySelector<SVGGElement>('.minimap .map-player');
      const visitor = document.querySelector<SVGCircleElement>('.minimap .map-incident circle');
      const progress = document.querySelector<HTMLProgressElement>('progress[aria-label="Visitor contact"]');
      if (!player || !visitor || !progress) {
        for (const key of keys) drive(key, false);
        return;
      }
      const pose = player.transform.baseVal.getItem(0).matrix;
      const dx = visitor.cx.baseVal.value - pose.e;
      const dy = visitor.cy.baseVal.value - pose.f;
      drive('a', dx < -2);
      drive('d', dx > 2);
      drive('w', dy < -2);
      drive('s', dy > 2);
      drive('f', true);
      requestAnimationFrame(follow);
    };
    follow();
  });
  await expect(page.getByText('Guard G-12 en route…')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('button', { name: 'Log safe response' })).toBeEnabled({ timeout: 45_000 });
});

test('both lateral key pairs follow the rotated camera and update both maps', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Enter development shift' }).click();
  await page.getByRole('button', { name: 'Begin patrol' }).click();
  const marker = page.locator('.minimap .map-player');
  const liveMarker = page.locator('.large-map .map-player');
  const minimapFloor = page.locator('.minimap svg');
  const bounds = await minimapFloor.getAttribute('viewBox');
  await expect(marker).toHaveAttribute('data-room', '711');
  const canvas = page.locator('.game-canvas canvas');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.3 + 393, box.y + box.height * 0.5, { steps: 6 });
  await page.mouse.up();
  await page.keyboard.press('m');

  const readPose = () => marker.evaluate((element: SVGGElement) => {
    const transforms = element.transform.baseVal;
    return { y: transforms.getItem(0).matrix.f, heading: transforms.getItem(1).angle };
  });
  for (const [key, direction] of [['a', -1], ['d', 1], ['ArrowLeft', -1], ['ArrowRight', 1]] as const) {
    const start = await readPose();
    await page.keyboard.down(key);
    try {
      await expect.poll(async () => direction * ((await readPose()).y - start.y)).toBeGreaterThan(2);
      await expect.poll(async () => Math.abs((await readPose()).heading)).toBeCloseTo(direction === -1 ? 0 : 180, -1);
    } finally {
      await page.keyboard.up(key);
    }
    await expect.poll(async () => page.evaluate(() => {
      const mini = document.querySelector('.minimap .map-player');
      const full = document.querySelector('.large-map .map-player');
      return mini?.getAttribute('transform') === full?.getAttribute('transform');
    })).toBe(true);
    await expect(liveMarker).toHaveAttribute('data-room', '711');
    await expect(minimapFloor).toHaveAttribute('viewBox', bounds!);
  }
});
