import { test, expect } from '@playwright/test';
import { setupAuthenticatedUser, uploadTestBook } from './fixtures';

test.describe('Recent Books Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated user
    await setupAuthenticatedUser(page);
  });

  test('should display recent books section in sidebar', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.recent-section');

    // Check that recent section exists
    const recentSection = page.locator('.recent-section');
    await expect(recentSection).toBeVisible();

    // Check header
    const header = recentSection.locator('h3');
    await expect(header).toContainText('Recently Opened');
  });

  test('should show empty state when no books have been opened', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.recent-section');

    // Check for empty state
    const emptyState = page.locator('.empty-recent');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No recent books yet');
  });

  test('should add book to recent list after opening it', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload a test book
    const bookTitle = await uploadTestBook(page, 'test-book.pdf');

    // Open the book from library
    await page.locator('.book-item').filter({ hasText: bookTitle }).click();
    await page.waitForTimeout(1000); // Wait for book to load

    // Reload page to see recent books
    await page.reload();
    await page.waitForSelector('.recent-section');

    // Check that book appears in recent section
    const recentBook = page.locator('.recent-book-item').filter({ hasText: bookTitle });
    await expect(recentBook).toBeVisible();
  });

  test('should show progress bar for books with reading progress', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload and open a test book
    const bookTitle = await uploadTestBook(page, 'test-book.pdf');
    await page.locator('.book-item').filter({ hasText: bookTitle }).click();
    await page.waitForTimeout(1000);

    // Navigate to page 5 to create progress
    await page.locator('input[type="number"]').fill('5');
    await page.locator('input[type="number"]').press('Enter');
    await page.waitForTimeout(500);

    // Reload to see recent books with progress
    await page.reload();
    await page.waitForSelector('.recent-section');

    // Check for progress bar
    const recentBook = page.locator('.recent-book-item').filter({ hasText: bookTitle });
    const progressBar = recentBook.locator('.progress-bar');
    await expect(progressBar).toBeVisible();

    // Check progress text
    const progressText = recentBook.locator('.progress-text');
    await expect(progressText).toBeVisible();
    await expect(progressText).toContainText('%');
  });

  test('should continue reading from last page when clicking continue button', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload and open a test book
    const bookTitle = await uploadTestBook(page, 'test-book.pdf');
    await page.locator('.book-item').filter({ hasText: bookTitle }).click();
    await page.waitForTimeout(1000);

    // Navigate to page 10
    const targetPage = 10;
    await page.locator('input[type="number"]').fill(targetPage.toString());
    await page.locator('input[type="number"]').press('Enter');
    await page.waitForTimeout(500);

    // Close the book
    await page.locator('.btn-secondary').filter({ hasText: 'Hide Panel' }).click();

    // Click continue button in recent books
    await page.waitForSelector('.recent-section');
    const continueBtn = page.locator('.btn-continue').first();
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // Verify PDF viewer opened to correct page
    const pageInput = page.locator('input[type="number"]');
    await expect(pageInput).toHaveValue(targetPage.toString());
  });

  test('should show time ago for recently opened books', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload and open a test book
    const bookTitle = await uploadTestBook(page, 'test-book.pdf');
    await page.locator('.book-item').filter({ hasText: bookTitle }).click();
    await page.waitForTimeout(1000);

    // Reload to see recent books
    await page.reload();
    await page.waitForSelector('.recent-section');

    // Check for time indicator
    const recentBook = page.locator('.recent-book-item').filter({ hasText: bookTitle });
    const timeAgo = recentBook.locator('.last-opened');
    await expect(timeAgo).toBeVisible();

    // Should show "Just now" or similar for recently opened books
    const timeText = await timeAgo.textContent();
    expect(timeText).toMatch(/(Just now|ago)/);
  });

  test('should collapse and expand recent books section', async ({ page }) => {
    await page.goto('http://localhost:4200');
    await page.waitForSelector('.recent-section');

    // Click collapse button
    const collapseBtn = page.locator('.collapse-btn');
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Check that container is hidden
    const container = page.locator('.recent-books-container');
    await expect(container).not.toBeVisible();

    // Click expand button
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Check that container is visible again
    await expect(container).toBeVisible();
  });

  test('should limit recent books to specified number', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload and open multiple books
    for (let i = 1; i <= 7; i++) {
      await uploadTestBook(page, `book-${i}.pdf`);
      await page.locator('.book-item').last().click();
      await page.waitForTimeout(500);
      await page.goBack();
      await page.waitForTimeout(300);
    }

    // Reload to see recent books
    await page.reload();
    await page.waitForSelector('.recent-section');

    // Count recent book items (should be limited to 5 by default)
    const recentBookItems = page.locator('.recent-book-item');
    const count = await recentBookItems.count();
    expect(count).toBeLessThanOrEqual(5);
  });

  test('should highlight currently reading book in recent list', async ({ page }) => {
    await page.goto('http://localhost:4200');

    // Upload and open a test book
    const bookTitle = await uploadTestBook(page, 'test-book.pdf');
    await page.locator('.book-item').filter({ hasText: bookTitle }).click();
    await page.waitForTimeout(1000);

    // Reload to see recent books
    await page.reload();
    await page.waitForSelector('.recent-section');

    // Check that current book has active class
    const recentBook = page.locator('.recent-book-item').filter({ hasText: bookTitle });
    await expect(recentBook).toHaveClass(/active/);
  });
});
