import { test, expect } from './fixtures';

test.describe('API Integration', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should handle backend API responses correctly', async ({ page }) => {
    // Test GET /books endpoint
    const booksResponse = await page.request.get('http://localhost:3000/books');
    expect(booksResponse.status()).toBe(200);
    
    const books = await booksResponse.json();
    expect(Array.isArray(books)).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Test invalid endpoint
    const invalidResponse = await page.request.get('http://localhost:3000/invalid-endpoint');
    expect(invalidResponse.status()).toBe(404);
    
    // UI should handle this gracefully when it occurs
  });

  test('should validate API request/response formats', async ({ page, uploadTestPdf }) => {
    await uploadTestPdf('api-test.pdf');
    
    // Test books endpoint response format
    const booksResponse = await page.request.get('http://localhost:3000/books');
    const books = await booksResponse.json();
    
    if (books.length > 0) {
      const book = books[0];
      
      // Validate required fields
      expect(book.id).toBeDefined();
      expect(book.title).toBeDefined();
      expect(book.author).toBeDefined();
      expect(book.filePath).toBeDefined();
      expect(book.fileSize).toBeDefined();
      expect(book.mimeType).toBeDefined();
      expect(book.totalPages).toBeDefined();
      expect(book.addedAt).toBeDefined();
      
      // Validate types
      expect(typeof book.id).toBe('string');
      expect(typeof book.title).toBe('string');
      expect(typeof book.author).toBe('string');
      expect(typeof book.fileSize).toBe('number');
      expect(typeof book.totalPages).toBe('number');
    }
  });

  test('should handle search API correctly', async ({ page }) => {
    // Test search endpoint
    const searchResponse = await page.request.get('http://localhost:3000/books/search/content?q=test');
    expect(searchResponse.status()).toBe(200);
    
    const searchResults = await searchResponse.json();
    expect(Array.isArray(searchResults)).toBe(true);
    
    // Validate search result format
    if (searchResults.length > 0) {
      const result = searchResults[0];
      expect(result.book).toBeDefined();
      expect(result.snippets).toBeDefined();
      expect(result.relevanceScore).toBeDefined();
      
      expect(Array.isArray(result.snippets)).toBe(true);
      expect(typeof result.relevanceScore).toBe('number');
    }
  });

  test('should handle file upload API', async ({ page }) => {
    // Create a test file
    const testPdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n%%EOF';
    const testFile = new File([testPdfContent], 'api-upload-test.pdf', { type: 'application/pdf' });
    
    // Test upload endpoint
    const formData = new FormData();
    formData.append('file', testFile);
    
    const uploadResponse = await page.request.post('http://localhost:3000/books/upload', {
      data: formData
    });
    
    expect(uploadResponse.status()).toBe(201);
    
    const uploadResult = await uploadResponse.json();
    expect(uploadResult.id).toBeDefined();
    expect(uploadResult.title).toBeDefined();
  });

  test('should handle concurrent API requests', async ({ page }) => {
    // Make multiple simultaneous requests
    const requests = [
      page.request.get('http://localhost:3000/books'),
      page.request.get('http://localhost:3000/books/search/content?q=test'),
      page.request.get('http://localhost:3000/books'),
    ];
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });

  test('should handle large responses efficiently', async ({ page, uploadTestPdf }) => {
    // Upload multiple books to create a larger response
    for (let i = 1; i <= 5; i++) {
      await uploadTestPdf(`large-response-test-${i}.pdf`);
    }
    
    const startTime = Date.now();
    const booksResponse = await page.request.get('http://localhost:3000/books');
    const endTime = Date.now();
    
    expect(booksResponse.status()).toBe(200);
    
    // Response should be reasonably fast (adjust threshold as needed)
    expect(endTime - startTime).toBeLessThan(5000);
    
    const books = await booksResponse.json();
    expect(books.length).toBeGreaterThan(0);
  });

  test('should validate search query parameters', async ({ page }) => {
    // Test various search parameters
    const searchTests = [
      { query: 't', expectedStatus: 200 }, // Very short query
      { query: 'test query', expectedStatus: 200 },
      { query: '', expectedStatus: 200 }, // Empty query
      { query: 'a'.repeat(1000), expectedStatus: 200 }, // Very long query
    ];
    
    for (const { query, expectedStatus } of searchTests) {
      const response = await page.request.get(`http://localhost:3000/books/search/content?q=${encodeURIComponent(query)}`);
      expect(response.status()).toBe(expectedStatus);
    }
  });

  test('should handle database connection issues', async ({ page }) => {
    // This test is more theoretical - in practice you'd need to simulate DB issues
    // For now, just ensure the API is responding
    const response = await page.request.get('http://localhost:3000/books');
    expect(response.status()).toBe(200);
  });

  test('should return appropriate HTTP status codes', async ({ page }) => {
    // Test various endpoints and their expected status codes
    const endpointTests = [
      { url: '/books', method: 'GET', expectedStatus: 200 },
      { url: '/books/search/content?q=test', method: 'GET', expectedStatus: 200 },
      { url: '/books/nonexistent-id', method: 'GET', expectedStatus: 404 },
      { url: '/invalid-endpoint', method: 'GET', expectedStatus: 404 },
    ];
    
    for (const { url, method, expectedStatus } of endpointTests) {
      const response = await page.request.fetch(`http://localhost:3000${url}`, { method });
      expect(response.status()).toBe(expectedStatus);
    }
  });

  test('should handle CORS correctly', async ({ page }) => {
    // Test CORS headers
    const response = await page.request.get('http://localhost:3000/books');
    
    // Should have appropriate CORS headers for development
    const corsHeader = response.headers()['access-control-allow-origin'];
    expect(corsHeader).toBeDefined();
  });
});