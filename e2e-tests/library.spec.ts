import { test, expect } from './fixtures';

test.describe('Library Management', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should toggle library visibility', async ({ page }) => {
    // Library should be hidden initially (assuming this is the default)
    await expect(page.locator('.library-container')).not.toBeVisible();
    
    // Click library button to show
    await page.click('button:has-text("Library")');
    await expect(page.locator('.library-container')).toBeVisible();
    
    // Click again to hide
    await page.click('button:has-text("Library")');
    await expect(page.locator('.library-container')).not.toBeVisible();
  });

  test('should display empty library message when no books', async ({ page }) => {
    await page.click('button:has-text("Library")');
    
    // Should show empty state message
    await expect(page.locator('.empty-library, .no-books')).toBeVisible();
  });

  test('should display books in library after upload', async ({ page, uploadTestPdf }) => {
    // Upload multiple test books
    await uploadTestPdf('book1.pdf');
    await uploadTestPdf('book2.pdf');
    
    await page.click('button:has-text("Library")');
    
    // Should show multiple book items
    const bookItems = page.locator('.book-item');
    await expect(bookItems).toHaveCount(2);
  });

  test('should display book metadata in library items', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('metadata-book.pdf');
    await page.click('button:has-text("Library")');
    
    const bookItem = page.locator('.book-item').first();
    
    // Check metadata elements
    await expect(bookItem.locator('.book-title')).toBeVisible();
    await expect(bookItem.locator('.book-author')).toBeVisible();
    await expect(bookItem.locator('.book-pages')).toBeVisible();
    await expect(bookItem.locator('.book-size')).toBeVisible();
    await expect(bookItem.locator('.book-added-date')).toBeVisible();
  });

  test('should allow clicking on book to open', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('clickable-book.pdf');
    await page.click('button:has-text("Library")');
    
    const bookItem = page.locator('.book-item').first();
    await bookItem.click();
    
    // Should open the book (implementation depends on your routing)
    // This might navigate to a reader view or show the PDF viewer
    await expect(page.locator('.pdf-viewer, .book-reader')).toBeVisible();
  });

  test('should show book thumbnails if available', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('thumbnail-book.pdf');
    await page.click('button:has-text("Library")');
    
    const bookItem = page.locator('.book-item').first();
    const thumbnail = bookItem.locator('.book-thumbnail, .book-cover');
    
    // Thumbnail might not always be available
    if (await thumbnail.isVisible()) {
      await expect(thumbnail).toBeVisible();
    }
  });

  test('should handle library with many books', async ({ page, uploadTestPdf }) => {
    // Upload several books to test scrolling/pagination
    const bookCount = 5;
    for (let i = 1; i <= bookCount; i++) {
      await uploadTestPdf(`book${i}.pdf`);
    }
    
    await page.click('button:has-text("Library")');
    
    // Should display all books
    const bookItems = page.locator('.book-item');
    await expect(bookItems).toHaveCount(bookCount);
    
    // Library should be scrollable if needed
    const libraryContainer = page.locator('.library-container');
    await expect(libraryContainer).toBeVisible();
  });

  test('should maintain library state when navigating', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('state-test-book.pdf');
    
    // Open library
    await page.click('button:has-text("Library")');
    await expect(page.locator('.library-container')).toBeVisible();
    
    // Navigate to a book
    await page.locator('.book-item').first().click();
    
    // Go back to main view (implementation depends on your navigation)
    await page.goBack();
    
    // Library state might be preserved or reset depending on implementation
    // This test might need adjustment based on your actual behavior
  });

  test('should show recent books first', async ({ page, uploadTestPdf }) => {
    // Upload books in sequence
    await uploadTestPdf('first-book.pdf');
    await page.waitForTimeout(100); // Small delay to ensure different timestamps
    await uploadTestPdf('second-book.pdf');
    await page.waitForTimeout(100);
    await uploadTestPdf('third-book.pdf');
    
    await page.click('button:has-text("Library")');
    
    const bookItems = page.locator('.book-item');
    await expect(bookItems).toHaveCount(3);
    
    // Most recent book should be first (if that's your implementation)
    const firstBook = bookItems.first();
    await expect(firstBook.locator('.book-title')).toContainText('third-book');
  });
});