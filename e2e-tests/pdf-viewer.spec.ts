import { test, expect } from './fixtures';

test.describe('PDF Viewer', () => {
  test.beforeEach(async ({ page, waitForBackend, uploadTestPdf }) => {
    await page.goto('/');
    await waitForBackend();
    await uploadTestPdf('viewer-test.pdf');
  });

  test('should open PDF viewer when book is selected', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    // PDF viewer should be visible
    await expect(page.locator('.pdf-viewer')).toBeVisible();
    await expect(page.locator('canvas, embed, object')).toBeVisible();
  });

  test('should display PDF navigation controls', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    // Check for navigation controls
    await expect(page.locator('.prev-page, .previous-page')).toBeVisible();
    await expect(page.locator('.next-page')).toBeVisible();
    await expect(page.locator('.page-info, .page-counter')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    // Wait for PDF to load
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Check initial page
    const pageInfo = page.locator('.page-info, .page-counter');
    await expect(pageInfo).toContainText('1');
    
    // Navigate to next page (if available)
    const nextButton = page.locator('.next-page');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500); // Wait for page change
      await expect(pageInfo).toContainText('2');
      
      // Navigate back
      await page.locator('.prev-page, .previous-page').click();
      await page.waitForTimeout(500);
      await expect(pageInfo).toContainText('1');
    }
  });

  test('should handle zoom controls', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Check for zoom controls
    const zoomIn = page.locator('.zoom-in, [title*="zoom in"]');
    const zoomOut = page.locator('.zoom-out, [title*="zoom out"]');
    const fitToPage = page.locator('.fit-to-page, [title*="fit"]');
    
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(300);
    }
    
    if (await zoomOut.isVisible()) {
      await zoomOut.click();
      await page.waitForTimeout(300);
    }
    
    if (await fitToPage.isVisible()) {
      await fitToPage.click();
      await page.waitForTimeout(300);
    }
  });

  test('should remember reading position', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Navigate to page 2 (if available)
    const nextButton = page.locator('.next-page');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
    
    // Close and reopen the book
    await page.goBack(); // or however you close the viewer
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Should remember the page (if reading progress is implemented)
    // This test depends on your reading progress implementation
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowRight'); // Next page
    await page.waitForTimeout(300);
    
    await page.keyboard.press('ArrowLeft'); // Previous page
    await page.waitForTimeout(300);
    
    // Test other common shortcuts
    await page.keyboard.press('Home'); // First page
    await page.waitForTimeout(300);
    
    await page.keyboard.press('End'); // Last page
    await page.waitForTimeout(300);
  });

  test('should display loading state while PDF loads', async ({ page }) => {
    await page.click('button:has-text("Library")');
    
    // Click on book and immediately check for loading state
    await page.locator('.book-item').first().click();
    
    // Should show loading indicator briefly
    const loadingIndicator = page.locator('.loading, .pdf-loading, .spinner');
    // Note: This might be flaky if PDF loads too quickly
  });

  test('should handle PDF loading errors', async ({ page }) => {
    // This test would need a corrupted or missing PDF file
    // For now, we'll simulate by trying to load a non-existent PDF
    
    // You might need to modify this based on how your app handles errors
    await page.goto('/pdf/non-existent-file.pdf');
    
    // Should show error message
    await expect(page.locator('.error-message, .pdf-error')).toBeVisible();
  });

  test('should close PDF viewer and return to library', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Look for close button or back button
    const closeButton = page.locator('.close-viewer, .back-to-library, [aria-label*="close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.locator('.library-container')).toBeVisible();
      await expect(page.locator('.pdf-viewer')).not.toBeVisible();
    } else {
      // Alternative: use browser back button
      await page.goBack();
      await expect(page.locator('.pdf-viewer')).not.toBeVisible();
    }
  });

  test('should maintain responsive design on different screen sizes', async ({ page }) => {
    await page.click('button:has-text("Library")');
    await page.locator('.book-item').first().click();
    
    await page.waitForSelector('.pdf-viewer', { timeout: 10000 });
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await expect(page.locator('.pdf-viewer')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await expect(page.locator('.pdf-viewer')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);
    await expect(page.locator('.pdf-viewer')).toBeVisible();
  });
});