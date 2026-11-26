import { test, expect } from '@playwright/test';

const pageCards = '#gallery .page-card';

test.beforeEach(async ({ page }) => {
  // Keep tests independent of the network (Google Fonts).
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) =>
    route.abort()
  );
  await page.goto('/');
});

test('loads without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.reload();
  await expect(page.locator('h1')).toContainText('Handwrite it');
  expect(errors).toEqual([]);
});

test('generates, reorders and removes pages', async ({ page }) => {
  const generate = page.getByTestId('generate');
  await generate.click();
  await expect(page.locator(pageCards)).toHaveCount(1);
  await page.locator('#paper-text').fill('Second page text');
  await generate.click();
  await expect(page.locator(pageCards)).toHaveCount(2);
  await expect(page.locator('#page-count')).toHaveText('2');

  const firstSrc = await page
    .locator(`${pageCards} img`)
    .first()
    .getAttribute('src');
  await page.getByLabel('Move page 1 later').click();
  await expect(page.locator(`${pageCards} img`).nth(1)).toHaveAttribute(
    'src',
    firstSrc
  );

  await page.getByLabel('Remove page 1').click();
  await expect(page.locator(pageCards)).toHaveCount(1);

  await page.locator('#clear-pages').click();
  await expect(page.locator(pageCards)).toHaveCount(0);
  await expect(page.locator('#download-pdf')).toBeDisabled();
});

test('splits long text into multiple pages without losing it', async ({
  page
}) => {
  const words = Array.from({ length: 500 }, (_, i) => `word${i}`).join(' ');
  await page.locator('#paper-text').evaluate((el, text) => {
    el.textContent = text;
  }, words);
  await page.getByTestId('generate').click();

  await expect
    .poll(() => page.locator(pageCards).count(), { timeout: 30_000 })
    .toBeGreaterThan(1);
  await expect(page.locator('#paper-text')).toHaveText(words);
});

test('style controls update the preview', async ({ page }) => {
  const paper = page.locator('#paper');

  await page.locator('#toggle-margin').uncheck({ force: true });
  await expect(paper).not.toHaveClass(/has-margin/);
  await page.locator('#toggle-lines').uncheck({ force: true });
  await expect(paper).not.toHaveClass(/has-lines/);

  await page.getByRole('radio', { name: 'Red' }).click();
  await expect(paper).toHaveCSS('color', 'rgb(186, 56, 7)');

  await page.locator('#font-size').fill('14');
  await expect(page.locator('output[for="font-size"]')).toHaveText('14pt');

  await page.locator('#reset-settings').click();
  await expect(paper).toHaveClass(/has-margin/);
  await expect(page.locator('output[for="font-size"]')).toHaveText('10pt');
});

test('pasted text is inserted as plain text', async ({ page }) => {
  const html = await page.locator('#paper-text').evaluate((el) => {
    el.innerHTML = '';
    el.focus();
    const data = new DataTransfer();
    data.setData('text/plain', '<b>bold?</b>\nnext line');
    el.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: data,
        bubbles: true,
        cancelable: true
      })
    );
    return el.innerHTML;
  });
  expect(html).toContain('&lt;b&gt;');
  expect(html).not.toContain('<b>');
});

test('downloads pages as a PDF', async ({ page }) => {
  await page.getByTestId('generate').click();
  await expect(page.locator(pageCards)).toHaveCount(1);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#download-pdf').click()
  ]);
  expect(download.suggestedFilename()).toBe('TheAll_Text.pdf');
});

test('draws a diagram and adds it to the page', async ({ page }) => {
  await page.locator('#open-drawpad').click();
  const canvas = page.locator('#drawpad-canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 120, { steps: 10 });
  await page.mouse.up();

  await page.locator('#drawpad-insert').click();
  await expect(page.locator('#drawpad')).not.toBeVisible();
  await expect(page.locator('#paper-text img')).toHaveCount(1);
});

test('remembers the dark theme', async ({ page }) => {
  await page.locator('#theme-toggle').click();
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
});
