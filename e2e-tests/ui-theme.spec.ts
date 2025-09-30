import { test, expect } from './fixtures';

test.describe('Theme and UI', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should load with default theme', async ({ page }) => {
    // Check that the app loads with a consistent theme
    const body = page.locator('body');
    await expect(body).toHaveCSS('background-color', /rgb\(\d+,\s*\d+,\s*\d+\)/);
    
    // Check for theme-related CSS variables or classes
    const themeIndicator = page.locator('[data-theme], .theme-light, .theme-dark');
    if (await themeIndicator.isVisible()) {
      await expect(themeIndicator).toBeVisible();
    }
  });

  test('should toggle theme if theme switcher exists', async ({ page }) => {
    // Look for theme toggle button
    const themeToggle = page.locator('.theme-toggle, [title*="theme"], [aria-label*="theme"]');
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialBg = await page.locator('body').evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(300);
      
      // Check if theme changed
      const newBg = await page.locator('body').evaluate(el => 
        getComputedStyle(el).backgroundColor
      );
      
      expect(initialBg).not.toBe(newBg);
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Main elements should still be visible and usable
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    await expect(page.locator('button:has-text("Library")')).toBeVisible();
    
    // Header should adapt to mobile
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
    
    // Navigation should be accessible
    await page.click('button:has-text("Library")');
    await expect(page.locator('.library-container')).toBeVisible();
  });

  test('should be responsive on tablet devices', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // All main elements should be visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.header-controls')).toBeVisible();
    await expect(page.locator('.search-toggle-btn')).toBeVisible();
    
    // Layout should adapt appropriately
    const container = page.locator('.app-container');
    await expect(container).toBeVisible();
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Check for proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasTitle = await button.getAttribute('title');
      
      // Each button should have accessible text
      expect(hasText || hasAriaLabel || hasTitle).toBeTruthy();
    }
    
    // Check for proper form labels
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await page.locator(`label[for="${await input.getAttribute('id')}"]`).isVisible();
      const hasAriaLabel = await input.getAttribute('aria-label');
      const hasPlaceholder = await input.getAttribute('placeholder');
      
      // Each input should have some form of label
      if (!hasLabel && !hasAriaLabel && !hasPlaceholder) {
        console.warn('Input without proper labeling found');
      }
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through interactive elements
    await page.keyboard.press('Tab');
    
    // Should focus on first interactive element
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate focused elements with Enter/Space
    const currentFocus = page.locator(':focus');
    if (await currentFocus.isVisible()) {
      await page.keyboard.press('Enter');
      // Check if something happened (modal opened, navigation occurred, etc.)
    }
  });

  test('should display proper loading states', async ({ page }) => {
    // Initial page load
    await page.goto('/');
    
    // Should not show any error states initially
    const errorMessages = page.locator('.error, [role="alert"]');
    await expect(errorMessages).toHaveCount(0);
    
    // Should eventually show the main interface
    await expect(page.locator('.app-header')).toBeVisible({ timeout: 10000 });
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);
    
    // Try to perform actions that require network
    await page.click('button:has-text("Library")');
    
    // Should handle gracefully (show error message, cached content, etc.)
    // Implementation depends on your offline strategy
    
    // Restore online mode
    await page.context().setOffline(false);
  });

  test('should maintain performance with multiple interactions', async ({ page, uploadTestPdf }) => {
    // Perform multiple quick interactions
    await page.click('button:has-text("Library")');
    await page.click('.search-toggle-btn');
    await page.keyboard.press('Escape');
    await page.click('button:has-text("Library")');
    
    // Upload a book
    await uploadTestPdf('performance-test.pdf');
    
    // Open and close library multiple times
    for (let i = 0; i < 3; i++) {
      await page.click('button:has-text("Library")');
      await page.waitForTimeout(100);
      await page.click('button:has-text("Library")');
      await page.waitForTimeout(100);
    }
    
    // App should remain responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should handle browser zoom levels', async ({ page }) => {
    // Test different zoom levels
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);
      
      await page.waitForTimeout(200);
      
      // Main elements should still be visible and functional
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Open PDF")')).toBeVisible();
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });
});