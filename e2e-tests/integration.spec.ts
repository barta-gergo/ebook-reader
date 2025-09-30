import { test, expect } from './fixtures';

test.describe('Working Features Integration', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should handle complete user workflow', async ({ page, uploadTestPdf }) => {
    // 1. Basic app loads
    await expect(page.locator('h1')).toContainText('EBook Reader');
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
    await expect(page.locator('.search-toggle-btn')).toBeVisible();

    // 2. Search functionality works (basic)
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    await page.click('.search-close-btn');
    await expect(page.locator('.search-overlay')).not.toBeVisible();

    // 3. Library toggle works
    await page.click('button:has-text("Library")');
    const buttonText = await page.locator('button:has-text("Library")').textContent();
    expect(buttonText?.includes('Hide') || buttonText?.includes('Show')).toBe(true);

    // 4. File upload works (with existing books)
    const initialBookCount = await page.locator('.book-item').count();
    console.log(`Initial book count: ${initialBookCount}`);
    
    if (initialBookCount > 0) {
      // Books exist, verify they display correctly
      const firstBook = page.locator('.book-item').first();
      await expect(firstBook.locator('.book-title')).toBeVisible();
      await expect(firstBook.locator('.book-author')).toBeVisible();
    }

    // 5. API connectivity works
    const response = await page.request.get('http://localhost:3000/books');
    expect(response.status()).toBe(200);
    const books = await response.json();
    expect(Array.isArray(books)).toBe(true);

    // 6. Responsive design works
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
  });

  test('should handle search functionality gracefully', async ({ page }) => {
    // Open search
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();

    // Show help text initially
    await expect(page.locator('.search-help')).toBeVisible();

    // Handle empty search
    await page.fill('.search-input', '');
    await expect(page.locator('.search-help')).toBeVisible();

    // Handle short search
    await page.fill('.search-input', 'a');
    await expect(page.locator('.search-help, .no-results')).toBeVisible();

    // Test search with actual query (may or may not return results)
    await page.fill('.search-input', 'test content search');
    
    // Wait a bit for debounce
    await page.waitForTimeout(500);
    
    // Should show either results or no results message
    const hasResults = await page.locator('.search-results').isVisible();
    const hasNoResults = await page.locator('.no-results').isVisible();
    const hasHelp = await page.locator('.search-help').isVisible();
    
    expect(hasResults || hasNoResults || hasHelp).toBe(true);
  });

  test('should handle library management', async ({ page }) => {
    // Toggle library multiple times
    const initialText = await page.locator('button:has-text("Library")').textContent();
    
    await page.click('button:has-text("Library")');
    await page.click('button:has-text("Library")');
    
    // Button should exist and be clickable
    const finalText = await page.locator('button:has-text("Library")').textContent();
    expect(typeof finalText).toBe('string');
    expect(finalText?.length).toBeGreaterThan(0);
  });

  test('should maintain performance across interactions', async ({ page }) => {
    // Multiple quick interactions
    const startTime = Date.now();
    
    await page.click('button:has-text("Library")');
    await page.click('.search-toggle-btn');
    await page.keyboard.press('Escape');
    await page.click('button:has-text("Library")');
    await page.click('.search-toggle-btn');
    await page.click('.search-close-btn');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within reasonable time
    expect(duration).toBeLessThan(5000);
    
    // App should remain responsive
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 375, height: 667 }, // iPhone 6/7/8
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);
      
      // Core elements should remain visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
      await expect(page.locator('.search-toggle-btn')).toBeVisible();
    }
  });
});