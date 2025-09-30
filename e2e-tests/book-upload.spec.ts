import { test, expect } from './fixtures';

test.describe('Book Upload and Management', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should display the main application interface', async ({ page }) => {
    // Check main UI elements
    await expect(page.locator('h1')).toContainText('EBook Reader');
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
    await expect(page.locator('.search-toggle-btn')).toBeVisible();
  });

  test('should upload a PDF successfully', async ({ page, uploadTestPdf }) => {
    // Upload a test PDF
    await uploadTestPdf('test-book.pdf');
    
    // Check if book appears in the library
    await page.click('button:has-text("Library")');
    await expect(page.locator('.book-item').first()).toBeVisible();
    
    // Verify book details are displayed
    const bookTitle = page.locator('.book-title').first();
    await expect(bookTitle).toBeVisible();
    await expect(page.locator('.book-author').first()).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Try to upload an invalid file
    const fileInput = page.locator('input[type="file"]');
    
    // Create a fake non-PDF file
    const testFilePath = './e2e-tests/fixtures/invalid.txt';
    await page.evaluate(() => {
      const dt = new DataTransfer();
      const file = new File(['Invalid content'], 'invalid.txt', { type: 'text/plain' });
      dt.items.add(file);
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.files = dt.files;
    });
    
    // Should show error message or reject invalid file
    // (Implementation depends on your file validation logic)
  });

  test('should display book metadata correctly', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('metadata-test.pdf');
    
    await page.click('button:has-text("Library")');
    const bookItem = page.locator('.book-item').first();
    
    // Check that basic book information is displayed
    await expect(bookItem.locator('.book-title')).toBeVisible();
    await expect(bookItem.locator('.book-author')).toBeVisible();
    
    // Check that some metadata is present (flexible test)
    const hasMetadata = await bookItem.locator('.book-meta').isVisible();
    const hasPages = await bookItem.textContent();
    
    // At minimum, should show book title, author, and some metadata
    expect(hasMetadata || (hasPages && hasPages.includes('pages'))).toBe(true);
  });
});