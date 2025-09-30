#!/usr/bin/env ts-node

/**
 * CLI script to reindex all books for search
 * Usage: npm run reindex-books
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ReindexAllBooksCommand } from '../application/commands/system/reindex-all-books.command';

async function reindexBooks() {
  console.log('🔍 Starting book reindexing process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const reindexCommand = app.get(ReindexAllBooksCommand);

  try {
    const result = await reindexCommand.execute((progress) => {
      const percentage = Math.round((progress.processedBooks / progress.totalBooks) * 100);
      console.log(`📚 Progress: ${progress.processedBooks}/${progress.totalBooks} (${percentage}%) - ${progress.currentBook || 'Processing...'}`);
    });

    console.log('\n✅ Reindexing completed!');
    console.log(`📊 Results:`);
    console.log(`   Total books: ${result.totalBooks}`);
    console.log(`   Successfully indexed: ${result.successfulIndexes}`);
    console.log(`   Failed: ${result.failedIndexes}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => {
        console.log(`   - ${error.bookTitle}: ${error.error}`);
      });
    }

    // Get final stats (TODO: implement when search stats are available)
    console.log(`\n📈 Reindexing completed successfully!`);

  } catch (error) {
    console.error('❌ Reindexing failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the script
reindexBooks()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });