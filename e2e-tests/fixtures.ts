import { test as base, expect } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

export interface TestFixtures {
  /**
   * Upload a test PDF file to the application
   */
  uploadTestPdf: (filename?: string) => Promise<void>;
  
  /**
   * Clean up uploaded files after test
   */
  cleanupUploads: () => Promise<void>;
  
  /**
   * Wait for backend to be ready
   */
  waitForBackend: () => Promise<void>;
}

export const test = base.extend<TestFixtures>({
  uploadTestPdf: async ({ page }, use) => {
    const uploadedFiles: string[] = [];
    
    await use(async (filename = 'sample.pdf') => {
      // Create a test PDF file if it doesn't exist
      const testPdfPath = path.join(__dirname, 'fixtures', filename);
      await ensureTestPdfExists(testPdfPath);
      
      // Navigate to the app
      await page.goto('/');
      
      // Set up file chooser handler before clicking the button
      const fileChooserPromise = page.waitForEvent('filechooser');
      
      // Click the Open PDF button - this will trigger the file chooser
      await page.click('button:has-text("Open PDF")');
      
      // Wait for the file chooser and select our test file
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testPdfPath);
      
      // Wait for upload to complete by checking for success indicators
      try {
        // Wait for either a book to appear in library or some upload success indication
        await Promise.race([
          page.waitForSelector('.book-item', { timeout: 15000 }),
          page.waitForResponse(response => 
            response.url().includes('/books/upload') && response.status() === 201, 
            { timeout: 15000 }
          )
        ]);
      } catch (error) {
        console.log('Upload timeout - may have completed without visible indicators');
      }
      
      uploadedFiles.push(filename);
    });
    
    // Cleanup after test
    // Note: In a real scenario, you might want to clean up the uploads directory
  },

  cleanupUploads: async ({ page }, use) => {
    await use(async () => {
      // This could call a backend endpoint to clean up test data
      // For now, we'll just reload to reset the UI state
      await page.reload();
    });
  },

  waitForBackend: async ({ page }, use) => {
    await use(async () => {
      // Wait for backend to respond
      await page.waitForResponse(response => 
        response.url().includes('/books') && response.status() === 200,
        { timeout: 30000 }
      );
    });
  }
});

async function ensureTestPdfExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    // Create a proper PDF using PDFKit
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Extract filename from path for content
    const filename = path.basename(filePath, '.pdf');
    
    // Add title and metadata
    doc.info.Title = filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    doc.info.Author = 'Test Author';
    doc.info.Subject = 'E2E Testing PDF';
    doc.info.Keywords = 'test, ebook, reader, automation, pdf, content, search';
    
    // Add content to make it searchable
    doc.fontSize(20).text(doc.info.Title, 100, 100);
    doc.fontSize(14).text('by Test Author', 100, 130);
    
    doc.moveDown();
    doc.fontSize(12).text('Chapter 1: Introduction', { underline: true });
    doc.moveDown();
    doc.text('This is a test PDF document created for E2E testing purposes. It contains searchable content that can be used to test the search functionality of the ebook reader application.');
    
    doc.moveDown();
    doc.text('The document includes various keywords and phrases that can be searched for, including: programming, software development, testing, automation, TypeScript, Angular, NestJS, and many other technology-related terms.');
    
    doc.moveDown();
    doc.text('Chapter 2: Content Testing');
    doc.moveDown();
    doc.text('This chapter discusses content testing strategies and best practices. It covers topics such as unit testing, integration testing, end-to-end testing, and test automation frameworks.');
    
    doc.moveDown();
    doc.text('Some important concepts include: test fixtures, mock data, assertions, test coverage, continuous integration, and deployment pipelines.');
    
    // Add another page
    doc.addPage();
    doc.fontSize(12).text('Chapter 3: Advanced Topics');
    doc.moveDown();
    doc.text('This final chapter covers advanced testing concepts including performance testing, load testing, security testing, and accessibility testing.');
    
    doc.moveDown();
    doc.text('Additional keywords for search testing: database, API, REST, GraphQL, microservices, cloud computing, DevOps, agile development, and quality assurance.');
    
    // Write to file
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    
    await new Promise<void>((resolve, reject) => {
      doc.on('end', async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          await fs.writeFile(filePath, pdfBuffer);
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      doc.on('error', reject);
      doc.end();
    });
  }
}

export { expect } from '@playwright/test';