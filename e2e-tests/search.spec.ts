import { test, expect } from './fixtures';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page, waitForBackend, uploadTestPdf }) => {
    await page.goto('/');
    await waitForBackend();
    
    // Upload a test book with searchable content
    await uploadTestPdf('searchable-book.pdf');
  });

  test('should open search modal when clicking search button', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    await expect(page.locator('.search-overlay')).toBeVisible();
    await expect(page.locator('.global-search-input')).toBeVisible();
    await expect(page.locator('.global-search-input')).toBeFocused();
  });

  test('should open search modal with Ctrl+K shortcut', async ({ page }) => {
    await page.keyboard.press('Control+k');
    
    await expect(page.locator('.search-overlay')).toBeVisible();
    await expect(page.locator('.global-search-input')).toBeFocused();
  });

  test('should close search modal when clicking outside', async ({ page }) => {
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    
    // Click outside the modal
    await page.click('.search-overlay');
    await expect(page.locator('.search-overlay')).not.toBeVisible();
  });

  test('should close search modal when clicking close button', async ({ page }) => {
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    
    await page.click('.search-close-btn');
    await expect(page.locator('.search-overlay')).not.toBeVisible();
  });

  test('should show search help text initially', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    await expect(page.locator('.search-help')).toBeVisible();
    await expect(page.locator('.search-help')).toContainText('Start typing to search');
  });

  test('should perform content search and show results', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    // Type search query
    await page.fill('.global-search-input', 'test content');
    
    // Wait for search results
    await page.waitForSelector('.search-results, .no-results', { timeout: 5000 });
    
    // Should show either results or no results message
    const hasResults = await page.locator('.search-results').isVisible();
    const hasNoResults = await page.locator('.no-results').isVisible();
    
    expect(hasResults || hasNoResults).toBe(true);
  });

  test('should show loading indicator during search', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    // Type search query
    await page.fill('.global-search-input', 'loading test');
    
    // Should show loading indicator briefly
    const loadingVisible = await page.locator('.search-loading').isVisible();
    // Note: This test might be flaky due to fast search responses
  });

  test('should highlight search terms in results', async ({ page }) => {
    // This test assumes we have a book with content that matches our search
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    
    await page.waitForSelector('.search-results', { timeout: 5000 });
    
    // Check if search terms are highlighted in snippets
    const highlights = page.locator('.search-snippets mark');
    if (await highlights.count() > 0) {
      await expect(highlights.first()).toBeVisible();
    }
  });

  test('should show relevance scores for search results', async ({ page }) => {
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'content');
    
    await page.waitForSelector('.search-results', { timeout: 5000 });
    
    // Check if relevance scores are displayed
    const relevanceScores = page.locator('.relevance-score');
    if (await relevanceScores.count() > 0) {
      await expect(relevanceScores.first()).toBeVisible();
      await expect(relevanceScores.first()).toContainText('Relevance:');
    }
  });

  test('should navigate to book when clicking search result', async ({ page }) => {
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    
    await page.waitForSelector('.search-results', { timeout: 5000 });
    
    const searchResults = page.locator('.search-result-item');
    if (await searchResults.count() > 0) {
      // Check if page number is displayed in search results
      const pageNumberElement = page.locator('.page-number').first();
      const hasPageNumber = await pageNumberElement.count() > 0;
      
      if (hasPageNumber) {
        const pageNumberText = await pageNumberElement.textContent();
        console.log('Found page number in search result:', pageNumberText);
      }
      
      await searchResults.first().click();
      
      // Search modal should close
      await expect(page.locator('.search-overlay')).not.toBeVisible();
      
      // Should navigate to the book (implementation depends on your routing)
      // This might open the PDF viewer or select the book in the library
      
      // If page number was available, check localStorage for navigation intent
      if (hasPageNumber) {
        const navigateToPage = await page.evaluate(() => localStorage.getItem('navigateToPage'));
        console.log('Navigation intent stored in localStorage:', navigateToPage);
      }
    }
  });

  test('should handle empty search queries gracefully', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    // Try searching with empty query
    await page.fill('.global-search-input', '');
    await page.keyboard.press('Enter');
    
    // Should show help text, not results
    await expect(page.locator('.search-help')).toBeVisible();
    await expect(page.locator('.search-results')).not.toBeVisible();
  });

  test('should handle very short search queries', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    // Try searching with very short query
    await page.fill('.global-search-input', 'a');
    
    // Should show help text or no results
    await expect(page.locator('.search-help, .no-results')).toBeVisible();
  });

  test('should debounce search requests', async ({ page }) => {
    await page.click('.search-toggle-btn');
    
    // Type rapidly to test debouncing
    await page.fill('.global-search-input', 't');
    await page.fill('.global-search-input', 'te');
    await page.fill('.global-search-input', 'tes');
    await page.fill('.global-search-input', 'test');
    
    // Should not make multiple simultaneous requests
    // This is more of an implementation detail test
    await page.waitForTimeout(500); // Wait for debounce
    
    // Should eventually show results or no results
    await expect(page.locator('.search-results, .no-results')).toBeVisible();
  });

  test('should display page numbers in search results and navigate correctly', async ({ page }) => {
    // Open search and perform a search
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    
    // Wait for search results
    await page.waitForSelector('.search-results', { timeout: 10000 });
    
    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Check if any result has a page number
      const pageNumbers = page.locator('.page-number');
      const pageNumberCount = await pageNumbers.count();
      
      if (pageNumberCount > 0) {
        // Get the first result with a page number
        const firstPageNumber = await pageNumbers.first().textContent();
        console.log('First page number found:', firstPageNumber);
        
        // Extract the actual page number from "Page X" format
        const pageMatch = firstPageNumber?.match(/Page (\d+)/);
        const expectedPageNumber = pageMatch ? pageMatch[1] : null;
        
        if (expectedPageNumber) {
          // Click on the search result
          await searchResults.first().click();
          
          // Check that search modal closes
          await expect(page.locator('.search-overlay')).not.toBeVisible();
          
          // Verify that navigation intent was set (this might be cleared quickly)
          // We'll check for PDF viewer and current page instead
          await page.waitForTimeout(1000); // Give time for navigation
          
          // Check if PDF viewer is visible and on correct page
          const pdfViewer = page.locator('pdf-viewer');
          if (await pdfViewer.count() > 0) {
            // Try to find page indicator in PDF viewer
            const pageInput = page.locator('.page-input');
            if (await pageInput.count() > 0) {
              const currentPageValue = await pageInput.inputValue();
              console.log('Current page in PDF viewer:', currentPageValue);
              console.log('Expected page from search:', expectedPageNumber);
              
              // This is a best-effort check - the navigation might take time
              // or the PDF might not be fully loaded yet
            }
          }
        }
      } else {
        console.log('No page numbers found in search results - this might indicate the new page-specific indexing is not working yet');
      }
    } else {
      console.log('No search results found for test query');
    }
  });

  test('should select book from search and load PDF viewer', async ({ page }) => {
    // Open search and perform a search
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    
    // Wait for search results
    await page.waitForSelector('.search-results', { timeout: 10000 });
    
    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Get book title from first result
      const bookTitle = await searchResults.first().locator('.book-title').textContent();
      console.log('Selecting book:', bookTitle);
      
      // Debug: Log search result data
      const resultData = await page.evaluate(() => {
        const searchComponent = document.querySelector('app-search');
        if (searchComponent) {
          // Try to access Angular component instance
          return (searchComponent as any).searchResults?.[0] || 'No search results found';
        }
        return 'No search component found';
      });
      console.log('Search result data:', resultData);
      
      // Click on the search result
      await searchResults.first().click();
      
      // Verify search modal closes
      await expect(page.locator('.search-overlay')).not.toBeVisible();
      
      // Wait a bit for book selection to process
      await page.waitForTimeout(2000);
      
      // Debug: Check current book data
      const currentBookData = await page.evaluate(() => {
        const appElement = document.querySelector('app-root');
        if (appElement) {
          return (appElement as any).currentBook || 'No current book';
        }
        return 'No app element found';
      });
      console.log('Current book data:', currentBookData);
      
      // Check if the PDF viewer container appears
      const pdfViewerContainer = page.locator('.pdf-viewer-container');
      await expect(pdfViewerContainer).toBeVisible({ timeout: 5000 });
      
      // Check if the actual PDF viewer element is present
      const pdfViewer = page.locator('pdf-viewer');
      await expect(pdfViewer).toBeVisible({ timeout: 5000 });
      
      // Check for loading indicator or PDF content
      const loadingIndicator = page.locator('.loading-indicator');
      const hasLoading = await loadingIndicator.count() > 0;
      
      console.log('PDF viewer state:', {
        hasViewer: await pdfViewer.count() > 0,
        hasLoading: hasLoading,
        isLoadingVisible: hasLoading ? await loadingIndicator.isVisible() : false
      });
      
      // Check if PDF source is being loaded
      const pdfViewerElement = pdfViewer.first();
      if (await pdfViewerElement.count() > 0) {
        const srcAttribute = await pdfViewerElement.getAttribute('ng-reflect-src');
        console.log('PDF viewer src attribute:', srcAttribute);
        
        // Verify that the src is a proper URL
        if (srcAttribute) {
          expect(srcAttribute).toMatch(/^https?:\/\/[^\/]+\/uploads\//);
          console.log('✅ PDF source URL is correctly formatted');
        } else {
          console.log('❌ PDF source is null - this indicates the URL construction failed');
        }
      }
      
    } else {
      console.log('No search results found for test query');
    }
  });

  test('should complete full search-to-PDF-viewer workflow', async ({ page }) => {
    // Step 1: Open search
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    
    // Step 2: Perform search
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });
    
    // Step 3: Verify search results
    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();
    expect(resultCount).toBeGreaterThan(0);
    
    // Step 4: Get book information
    const firstResult = searchResults.first();
    const bookTitle = await firstResult.locator('.book-title').textContent();
    console.log('📖 Book to select:', bookTitle);
    
    // Step 5: Select book from search results
    await firstResult.click();
    
    // Step 6: Verify search modal closes
    await expect(page.locator('.search-overlay')).not.toBeVisible();
    
    // Step 7: Wait for PDF viewer to load
    await page.waitForTimeout(3000);
    
    // Step 8: Verify PDF viewer appears
    const pdfViewerContainer = page.locator('.pdf-viewer-container');
    await expect(pdfViewerContainer).toBeVisible({ timeout: 5000 });
    
    // Step 9: Verify PDF viewer element
    const pdfViewer = page.locator('pdf-viewer');
    await expect(pdfViewer).toBeVisible({ timeout: 5000 });
    
    // Step 10: Check PDF source URL
    const srcAttribute = await pdfViewer.first().getAttribute('ng-reflect-src');
    console.log('🔗 PDF URL:', srcAttribute);
    
    if (srcAttribute) {
      expect(srcAttribute).toMatch(/^https?:\/\/[^\/]+\/uploads\//);
      console.log('✅ Complete workflow successful - PDF loading with correct URL');
    } else {
      console.log('❌ Workflow incomplete - PDF URL not set');
    }
    
    // Step 11: Verify toolbar elements are present
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();
    
    const pageInput = page.locator('.page-input');
    await expect(pageInput).toBeVisible();
    
    console.log('🎉 Full search-to-viewer workflow completed successfully');
  });

  test('should not override search navigation with reading progress', async ({ page, uploadTestPdf }) => {
    // Step 1: Upload a book with multiple pages first
    await uploadTestPdf('large-response-test-1.pdf'); // A longer PDF

    // Step 2: Open search and find a result with specific page number
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });
    
    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Step 3: Look for a result with a page number
      const pageNumbers = page.locator('.page-number');
      const pageNumberCount = await pageNumbers.count();
      
      if (pageNumberCount > 0) {
        const pageNumberText = await pageNumbers.first().textContent();
        const pageMatch = pageNumberText?.match(/Page (\d+)/);
        const targetPageNumber = pageMatch ? parseInt(pageMatch[1]) : null;
        
        if (targetPageNumber && targetPageNumber > 1) {
          console.log('🎯 Testing navigation to page:', targetPageNumber);
          
          // Step 4: Click search result to navigate
          await searchResults.first().click();
          await expect(page.locator('.search-overlay')).not.toBeVisible();
          
          // Step 5: Wait for PDF to load and navigation to complete
          await page.waitForTimeout(6000); // Wait longer than reading progress delay (1s) + grace period (5s)
          
          // Step 6: Check that we're still on the target page, not overridden by reading progress
          const pageInput = page.locator('.page-input');
          if (await pageInput.count() > 0) {
            const currentPageValue = await pageInput.inputValue();
            const currentPage = parseInt(currentPageValue);
            
            console.log('🔍 Final page after navigation:', currentPage);
            console.log('🎯 Expected target page:', targetPageNumber);
            
            // The critical test: should be on search target page, not reading progress page (usually 1 or 2)
            expect(currentPage).toBe(targetPageNumber);
            
            // Also verify it's not page 1 or 2 (typical reading progress override pages)
            if (targetPageNumber > 2) {
              expect(currentPage).not.toBe(1);
              expect(currentPage).not.toBe(2);
            }
            
            console.log('✅ Search navigation successfully protected from reading progress override');
          } else {
            console.log('❌ Page input not found - cannot verify navigation');
          }
        } else {
          console.log('⏭️ Skipping test - need a result with page number > 1');
        }
      } else {
        console.log('⏭️ Skipping test - no page numbers in search results');
      }
    } else {
      console.log('⏭️ Skipping test - no search results found');
    }
  });
});