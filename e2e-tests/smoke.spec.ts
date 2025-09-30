import { test, expect } from './fixtures';

test.describe('Basic Application Smoke Tests', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should load the application successfully', async ({ page }) => {
    // Check that the main application loads
    await expect(page.locator('h1')).toContainText('EBook Reader');
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
  });

  test('should display search functionality', async ({ page }) => {
    // Check that search button is present
    await expect(page.locator('.search-toggle-btn')).toBeVisible();
    
    // Click search button to open modal
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    
    // Close search modal
    await page.click('.search-close-btn');
    await expect(page.locator('.search-overlay')).not.toBeVisible();
  });

  test('should toggle library view', async ({ page }) => {
    // Get initial button text
    const initialButtonText = await page.locator('button:has-text("Library")').textContent();
    
    // Click the library button
    await page.click('button:has-text("Library")');
    
    // Wait for the UI to update
    await page.waitForTimeout(500);
    
    // Check if the button text changed (indicates state change)
    const newButtonText = await page.locator('button:has-text("Library")').textContent();
    const buttonTextChanged = initialButtonText !== newButtonText;
    
    // OR check if any library-related content is visible
    const hasLibraryContent = await page.locator('.sidebar, .book-list, .empty-state').count() > 0;
    
    // The test passes if either the button state changed OR we can see library content
    expect(buttonTextChanged || hasLibraryContent).toBe(true);
  });

  test('should handle API connectivity', async ({ page }) => {
    // Test that the backend API is responding
    const response = await page.request.get('http://localhost:3000/books');
    expect(response.status()).toBe(200);
    
    const books = await response.json();
    expect(Array.isArray(books)).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main elements should still be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
  });
});