const PDFDocument = require('pdfkit');
const fs = require('fs').promises;
const path = require('path');

async function createTestPdf(filePath, options) {
  const doc = new PDFDocument();
  
  // Set metadata
  doc.info.Title = options.title;
  doc.info.Author = options.author;
  doc.info.Subject = options.subject || 'E2E Test Document';
  doc.info.Keywords = options.keywords || 'test, ebook, reader';
  doc.info.Creator = 'E2E Test Suite';
  doc.info.Producer = 'PDFKit Test Generator';
  
  // Add title page
  doc.fontSize(24).text(options.title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(`by ${options.author}`, { align: 'center' });
  doc.moveDown(2);
  
  // Add content
  doc.fontSize(12);
  options.content.forEach((paragraph, index) => {
    if (index > 0) doc.moveDown();
    doc.text(paragraph);
  });
  
  // Create directory if it doesn't exist
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Write to file
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  
  return new Promise((resolve, reject) => {
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

async function createAllTestPdfs() {
  const fixturesDir = path.join(__dirname, 'fixtures');
  
  // Programming guide with rich searchable content
  await createTestPdf(path.join(fixturesDir, 'programming-guide.pdf'), {
    title: 'Modern Web Development Guide',
    author: 'Jane Developer',
    subject: 'Programming and Software Development',
    keywords: 'programming, web development, javascript, typescript, react, angular, nodejs',
    content: [
      'Chapter 1: Introduction to Modern Web Development',
      'Web development has evolved significantly over the past decade. Modern frameworks like React, Angular, and Vue.js have revolutionized how we build user interfaces.',
      'TypeScript has become increasingly popular due to its type safety and enhanced developer experience. It provides compile-time error checking and better IDE support.',
      'Chapter 2: Backend Development',
      'Node.js has made JavaScript a viable option for server-side development. Frameworks like Express.js, NestJS, and Fastify provide robust solutions for building APIs.',
      'Database integration is crucial for most applications. Popular choices include PostgreSQL, MongoDB, and Redis for different use cases.',
      'Chapter 3: Testing and Quality Assurance',
      'Testing is essential for maintaining code quality. Unit tests, integration tests, and end-to-end tests each serve different purposes in ensuring application reliability.',
      'Tools like Jest, Cypress, and Playwright have made testing more accessible and powerful. Automated testing pipelines help catch issues early.'
    ]
  });

  // Simple test document
  await createTestPdf(path.join(fixturesDir, 'simple-test.pdf'), {
    title: 'Simple Test Document',
    author: 'Test User',
    content: [
      'This is a simple test document with basic content.',
      'It contains common words that can be easily searched for during testing.',
      'Keywords include: test, document, content, search, functionality, automation.',
      'The document is intentionally short to ensure quick processing during test execution.',
      'Programming concepts: variables, functions, classes, objects, inheritance.',
      'Software development practices: version control, code review, continuous integration.'
    ]
  });

  console.log('Test PDFs created successfully!');
}

createAllTestPdfs().catch(console.error);