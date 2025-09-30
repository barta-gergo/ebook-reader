import * as dotenv from 'dotenv';

// Load environment variables early
dotenv.config();

export interface MeilisearchConfig {
  host: string;
  apiKey?: string;
  indexName: string;
  enabled: boolean;
}

export const meilisearchConfig: MeilisearchConfig = {
  host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
  indexName: process.env.MEILISEARCH_INDEX_NAME ?? 'books',
  enabled: process.env.MEILISEARCH_ENABLED !== 'false', // Default to enabled unless explicitly disabled
};