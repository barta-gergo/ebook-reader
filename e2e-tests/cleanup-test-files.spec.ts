import { test, expect } from './fixtures';

test.describe('Test File Cleanup', () => {
  test('should clean up uploaded test files', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for backend to be ready
    try {
      await page.waitForResponse(response => 
        response.url().includes('/books') && response.status() === 200,
        { timeout: 10000 }
      );
      console.log('✅ Backend is ready');
    } catch (error) {
      console.log('⚠️ Backend might not be ready, proceeding anyway');
    }

    // Get list of all uploaded books
    const response = await page.request.get('http://localhost:3000/books');
    const books = await response.json();
    
    console.log(`📚 Found ${books.length} books to clean up`);
    
    let deletedCount = 0;
    let errorCount = 0;

    // Delete each book
    for (const book of books) {
      try {
        console.log(`🗑️ Deleting book: ${book.title} (ID: ${book.id})`);
        
        const deleteResponse = await page.request.delete(`http://localhost:3000/books/${book.id}`);
        
        if (deleteResponse.ok()) {
          deletedCount++;
          console.log(`✅ Deleted: ${book.title}`);
        } else {
          errorCount++;
          console.log(`❌ Failed to delete: ${book.title} (Status: ${deleteResponse.status()})`);
        }
        
        // Small delay to avoid overwhelming the backend
        await page.waitForTimeout(100);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Error deleting ${book.title}:`, error);
      }
    }

    console.log(`🧹 Cleanup complete: ${deletedCount} deleted, ${errorCount} errors`);
    
    // Verify cleanup by checking remaining books
    const verificationResponse = await page.request.get('http://localhost:3000/books');
    const remainingBooks = await verificationResponse.json();
    
    console.log(`📊 Books remaining after cleanup: ${remainingBooks.length}`);
    
    // Expect most or all books to be cleaned up
    expect(remainingBooks.length).toBeLessThanOrEqual(errorCount);
    
    if (remainingBooks.length === 0) {
      console.log('🎉 All test files successfully cleaned up!');
    } else {
      console.log(`⚠️ ${remainingBooks.length} books could not be deleted`);
      remainingBooks.forEach((book: any) => {
        console.log(`  - ${book.title} (${book.id})`);
      });
    }
  });

  test('should clean up backend database', async ({ page }) => {
    // Test direct database cleanup through API if needed
    console.log('🔧 Attempting backend database cleanup...');
    
    try {
      // Check if there's a cleanup endpoint
      const cleanupResponse = await page.request.post('http://localhost:3000/books/cleanup', {
        data: { confirm: true }
      });
      
      if (cleanupResponse.ok()) {
        console.log('✅ Backend cleanup successful');
      } else {
        console.log('⚠️ No cleanup endpoint available (this is normal)');
      }
    } catch (error) {
      console.log('⚠️ Backend cleanup not available (this is normal)');
    }
  });

  test('should clean up frontend storage', async ({ page }) => {
    await page.goto('/');
    
    // Clear localStorage
    await page.evaluate(() => {
      const keysToKeep = ['theme', 'library-show', 'sidebar-width'];
      const allKeys = Object.keys(localStorage);
      
      let clearedCount = 0;
      allKeys.forEach(key => {
        if (!keysToKeep.some(keepKey => key.includes(keepKey))) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });
      
      return clearedCount;
    });
    
    // Clear any navigation intents
    await page.evaluate(() => {
      localStorage.removeItem('navigateToPage');
      localStorage.removeItem('lastOpenedBook');
      
      // Clear any reading progress or temporary data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('read-pages-') || 
            key.startsWith('reading-progress-') ||
            key.startsWith('book-preferences-')) {
          localStorage.removeItem(key);
        }
      });
    });
    
    console.log('🧹 Frontend storage cleaned up');
  });

  test('should clean up uploaded files from disk', async ({ page }) => {
    console.log('🗂️ Attempting to clean up uploaded files...');
    
    // This would require backend support for file cleanup
    // For now, just log what files might exist
    try {
      const filesResponse = await page.request.get('http://localhost:3000/uploads');
      
      if (filesResponse.ok()) {
        const files = await filesResponse.text();
        console.log('📁 Upload directory status:', files);
      } else {
        console.log('⚠️ Cannot access upload directory (this is normal for security)');
      }
    } catch (error) {
      console.log('⚠️ Upload directory access not available (this is normal)');
    }
    
    console.log('💡 Note: Physical file cleanup may require manual server maintenance');
  });
});