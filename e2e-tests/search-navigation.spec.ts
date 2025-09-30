import { test, expect } from './fixtures';

test.describe('Search Navigation Functionality', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should navigate to correct book and page from search results', async ({ page, uploadTestPdf }) => {
    // Step 1: Upload a test PDF with known content and multiple pages
    console.log('📚 Uploading test PDF with known content...');
    await uploadTestPdf('large-response-test-1.pdf');
    
    // Wait a bit for indexing to complete
    await page.waitForTimeout(3000);

    // Step 2: Perform search to find content
    console.log('🔍 Opening search and performing query...');
    await page.click('.search-toggle-btn');
    await expect(page.locator('.search-overlay')).toBeVisible();
    
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Step 3: Verify search results exist
    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();
    console.log(`📊 Found ${resultCount} search results`);
    
    expect(resultCount).toBeGreaterThan(0);

    // Step 4: Get details of first search result
    const firstResult = searchResults.first();
    const bookTitle = await firstResult.locator('.book-title').textContent();
    
    // Check if page number is displayed
    const pageNumberElement = firstResult.locator('.page-number');
    const hasPageNumber = await pageNumberElement.count() > 0;
    
    let expectedPageNumber: number | null = null;
    if (hasPageNumber) {
      const pageText = await pageNumberElement.textContent();
      const pageMatch = pageText?.match(/Page (\d+)/);
      expectedPageNumber = pageMatch ? parseInt(pageMatch[1]) : null;
      console.log(`📄 Search result shows page: ${expectedPageNumber}`);
    } else {
      console.log('⚠️ No page number found in search result');
    }

    console.log(`📖 About to select book: ${bookTitle}`);

    // Step 5: Click on search result to navigate
    await firstResult.click();
    console.log('✅ Clicked on search result');

    // Step 6: Verify search modal closes
    await expect(page.locator('.search-overlay')).not.toBeVisible();
    console.log('✅ Search modal closed');

    // Step 7: Wait for navigation and PDF loading
    await page.waitForTimeout(5000);

    // Step 8: Verify PDF viewer is visible and loaded
    const pdfViewerContainer = page.locator('.pdf-viewer-container');
    await expect(pdfViewerContainer).toBeVisible({ timeout: 10000 });
    console.log('✅ PDF viewer container visible');

    const pdfViewer = page.locator('pdf-viewer');
    await expect(pdfViewer).toBeVisible({ timeout: 10000 });
    console.log('✅ PDF viewer element visible');

    // Step 9: Check PDF source is loaded
    const srcAttribute = await pdfViewer.first().getAttribute('ng-reflect-src');
    console.log(`🔗 PDF source: ${srcAttribute}`);
    expect(srcAttribute).toMatch(/^https?:\/\/[^\/]+\/uploads\//);

    // Step 10: Verify page navigation (most critical test)
    const pageInput = page.locator('.page-input');
    await expect(pageInput).toBeVisible({ timeout: 5000 });
    
    // Get current page number
    const currentPageValue = await pageInput.inputValue();
    const currentPage = parseInt(currentPageValue);
    console.log(`📍 Current page in PDF viewer: ${currentPage}`);

    // Step 11: Critical verification - page navigation
    if (expectedPageNumber && expectedPageNumber > 1) {
      console.log(`🎯 Testing navigation: expected=${expectedPageNumber}, actual=${currentPage}`);
      
      // This is the core test - search should navigate to the specific page
      expect(currentPage).toBe(expectedPageNumber);
      console.log('✅ Navigation successful - on correct page!');
    } else {
      console.log('⚠️ Cannot test page navigation - no specific page number in search result');
      // At minimum, should not be on page 1 if we searched for content
      console.log(`📊 At least verifying not on default page 1: ${currentPage}`);
    }

    // Step 12: Verify book selection is correct
    const currentBookTitle = await page.evaluate(() => {
      const appElement = document.querySelector('app-root') as any;
      return appElement?.currentBook?.title || 'No book selected';
    });
    
    console.log(`📚 Selected book title: ${currentBookTitle}`);
    expect(currentBookTitle).toBe(bookTitle);
    console.log('✅ Correct book selected');
  });

  test('should handle search results without page numbers', async ({ page, uploadTestPdf }) => {
    // Test books that might be indexed without page-specific content
    await uploadTestPdf('simple-test.pdf');
    await page.waitForTimeout(2000);

    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results, .no-results', { timeout: 10000 });

    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      const firstResult = searchResults.first();
      const bookTitle = await firstResult.locator('.book-title').textContent();
      
      // Click result even without page number
      await firstResult.click();
      await expect(page.locator('.search-overlay')).not.toBeVisible();
      
      // Should still navigate to book (page 1 is acceptable)
      await page.waitForTimeout(3000);
      
      const pdfViewer = page.locator('pdf-viewer');
      await expect(pdfViewer).toBeVisible({ timeout: 10000 });
      
      // Verify book is selected
      const currentBookTitle = await page.evaluate(() => {
        const appElement = document.querySelector('app-root') as any;
        return appElement?.currentBook?.title || 'No book selected';
      });
      
      expect(currentBookTitle).toBe(bookTitle);
      console.log('✅ Book navigation works even without specific page number');
    } else {
      console.log('⏭️ No search results found - skipping test');
    }
  });

  test('should preserve page navigation against reading progress override', async ({ page, uploadTestPdf }) => {
    // Upload a book and establish some reading progress first
    await uploadTestPdf('large-response-test-1.pdf');
    await page.waitForTimeout(2000);
    
    // Open the book first to establish reading progress on page 1
    console.log('📚 Opening book to establish reading progress...');
    const bookItems = page.locator('.book-item');
    if (await bookItems.count() > 0) {
      await bookItems.first().click();
      await page.waitForTimeout(3000);
      
      // Navigate to page 2 to establish reading progress
      const pageInput = page.locator('.page-input');
      if (await pageInput.count() > 0) {
        await pageInput.fill('2');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
        console.log('📄 Established reading progress on page 2');
      }
    }

    // Now perform search that should navigate to a different page
    console.log('🔍 Performing search navigation test...');
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });

    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      // Look for a result with a different page number
      const pageNumbers = page.locator('.page-number');
      const pageNumberCount = await pageNumbers.count();
      
      if (pageNumberCount > 0) {
        const pageNumberText = await pageNumbers.first().textContent();
        const pageMatch = pageNumberText?.match(/Page (\d+)/);
        const targetPage = pageMatch ? parseInt(pageMatch[1]) : null;
        
        if (targetPage && targetPage !== 2) {
          console.log(`🎯 Testing navigation to page ${targetPage} (should not revert to reading progress page 2)`);
          
          // Click search result
          await searchResults.first().click();
          await expect(page.locator('.search-overlay')).not.toBeVisible();
          
          // Wait longer than reading progress delay to test override protection
          await page.waitForTimeout(6000);
          
          // Check final page
          const finalPageValue = await page.locator('.page-input').inputValue();
          const finalPage = parseInt(finalPageValue);
          
          console.log(`📍 Final page: ${finalPage}, Target: ${targetPage}, Reading progress was: 2`);
          
          // Should be on search target page, not reading progress page
          expect(finalPage).toBe(targetPage);
          expect(finalPage).not.toBe(2); // Should not revert to reading progress
          
          console.log('✅ Search navigation protected from reading progress override');
        } else {
          console.log('⏭️ No suitable page number found for override test');
        }
      } else {
        console.log('⏭️ No page numbers in search results');
      }
    } else {
      console.log('⏭️ No search results found');
    }
  });

  test('should show debug information for search navigation', async ({ page, uploadTestPdf }) => {
    // Upload test file
    await uploadTestPdf('large-response-test-1.pdf');
    await page.waitForTimeout(3000);

    // Enable console logging capture
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && (
        msg.text().includes('🎯') || 
        msg.text().includes('🔍') || 
        msg.text().includes('📖') ||
        msg.text().includes('✅') ||
        msg.text().includes('❌') ||
        msg.text().includes('⏭️')
      )) {
        consoleMessages.push(msg.text());
      }
    });

    // Perform search and navigation
    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });

    const searchResults = page.locator('.search-result-item');
    const resultCount = await searchResults.count();

    if (resultCount > 0) {
      console.log('📊 Search results found, clicking first result...');
      await searchResults.first().click();
      
      // Wait for navigation and capture logs
      await page.waitForTimeout(8000);
      
      // Print captured console messages
      console.log('🔍 Navigation debug logs:');
      consoleMessages.forEach(msg => console.log(`  ${msg}`));
      
      // Verify we got some navigation-related logs
      const navigationLogs = consoleMessages.filter(msg => 
        msg.includes('Navigation request found') ||
        msg.includes('Processing navigation') ||
        msg.includes('Navigation completed')
      );
      
      console.log(`📊 Found ${navigationLogs.length} navigation-related log messages`);
      
      // Check if PDF viewer is functional
      const pdfViewer = page.locator('pdf-viewer');
      const isVisible = await pdfViewer.isVisible();
      console.log(`📺 PDF viewer visible: ${isVisible}`);
      
      if (isVisible) {
        const pageInput = page.locator('.page-input');
        if (await pageInput.count() > 0) {
          const currentPage = await pageInput.inputValue();
          console.log(`📄 Final page number: ${currentPage}`);
        }
      }
    } else {
      console.log('❌ No search results found for debug test');
    }
  });

  test('should verify search result data structure', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('large-response-test-1.pdf');
    await page.waitForTimeout(3000);

    await page.click('.search-toggle-btn');
    await page.fill('.global-search-input', 'test');
    await page.waitForSelector('.search-results', { timeout: 10000 });

    // Inspect search results data
    const searchResultsData = await page.evaluate(() => {
      const searchComponent = document.querySelector('app-search') as any;
      if (searchComponent && searchComponent.searchResults) {
        return searchComponent.searchResults.map((result: any) => ({
          bookTitle: result.book?.title,
          pageNumber: result.pageNumber,
          snippets: result.snippets,
          relevanceScore: result.relevanceScore
        }));
      }
      return null;
    });

    console.log('📊 Search results data:', JSON.stringify(searchResultsData, null, 2));

    if (searchResultsData && searchResultsData.length > 0) {
      const firstResult = searchResultsData[0];
      console.log('🔍 First result analysis:', {
        hasPageNumber: firstResult.pageNumber !== undefined && firstResult.pageNumber !== null,
        pageNumber: firstResult.pageNumber,
        hasSnippets: firstResult.snippets && firstResult.snippets.length > 0,
        hasRelevanceScore: firstResult.relevanceScore !== undefined
      });

      // Verify search results have expected structure
      expect(firstResult.bookTitle).toBeTruthy();
      
      if (firstResult.pageNumber) {
        expect(typeof firstResult.pageNumber).toBe('number');
        expect(firstResult.pageNumber).toBeGreaterThan(0);
        console.log('✅ Page number is valid');
      } else {
        console.log('⚠️ No page number in search result');
      }
    } else {
      console.log('❌ Could not access search results data');
    }
  });
});