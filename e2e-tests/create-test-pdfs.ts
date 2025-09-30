import PDFDocument from 'pdfkit';
import { promises as fs } from 'fs';
import path from 'path';

interface TestPdfOptions {
  title: string;
  author: string;
  subject?: string;
  keywords?: string;
  content: string[];
}

export async function createTestPdf(filePath: string, options: TestPdfOptions): Promise<void> {
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
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  
  return new Promise<void>((resolve, reject) => {
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

export async function createAllTestPdfs(): Promise<void> {
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

  // Science book with different content
  await createTestPdf(path.join(fixturesDir, 'science-handbook.pdf'), {
    title: 'Digital Systems and Computer Science',
    author: 'Dr. Alan Computing',
    subject: 'Computer Science and Technology',
    keywords: 'computer science, algorithms, data structures, artificial intelligence, machine learning',
    content: [
      'Chapter 1: Fundamentals of Computer Science',
      'Computer science encompasses the study of algorithms, data structures, and computational systems. Understanding these fundamentals is crucial for software development.',
      'Big O notation helps us analyze algorithm efficiency. Common complexities include O(1), O(log n), O(n), O(n log n), and O(n²).',
      'Chapter 2: Data Structures',
      'Arrays, linked lists, stacks, queues, trees, and graphs are fundamental data structures. Each has specific use cases and performance characteristics.',
      'Hash tables provide O(1) average-case lookup time, making them ideal for implementing dictionaries and caches.',
      'Chapter 3: Artificial Intelligence and Machine Learning',
      'Machine learning algorithms can learn patterns from data without being explicitly programmed. Popular techniques include neural networks, decision trees, and support vector machines.',
      'Deep learning, a subset of machine learning, uses neural networks with multiple layers to solve complex problems like image recognition and natural language processing.'
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
      'The document is intentionally short to ensure quick processing during test execution.'
    ]
  });

  // Book with special characters and formatting
  await createTestPdf(path.join(fixturesDir, 'special-content.pdf'), {
    title: 'Spëcîål Çhàractërs & Formatting Test',
    author: 'Ünicøde Tëster',
    subject: 'Internationalization Testing',
    keywords: 'unicode, special characters, formatting, international, multilingual',
    content: [
      'This document tests special characters and international text handling.',
      'It includes accented characters: café, naïve, résumé, piñata.',
      'Mathematical symbols: α, β, γ, π, Σ, ∫, ∆, ∞.',
      'Currency symbols: $, €, £, ¥, ₹.',
      'The search functionality should handle these characters correctly.',
      'También incluye texto en español para probar la funcionalidad multiidioma.',
      'Et du texte en français pour tester la recherche internationale.'
    ]
  });

  console.log('Test PDFs created successfully!');
}

// Create test PDFs if this file is run directly
if (require.main === module) {
  createAllTestPdfs().catch(console.error);
}