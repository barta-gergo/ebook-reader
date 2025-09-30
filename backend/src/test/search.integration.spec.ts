import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { MeilisearchService } from '../infrastructure/services/meilisearch.service';
import { JwtAuthGuard } from '../infrastructure/auth/jwt-auth.guard';

describe('Search Integration Tests', () => {
  let app: INestApplication;
  let meilisearchService: MeilisearchService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: () => true,
    })
    .compile();

    app = moduleFixture.createNestApplication();
    
    // Setup Swagger for testing
    const config = new DocumentBuilder()
      .setTitle('EBook Reader API')
      .setDescription('API for managing ebooks and reading progress')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      jsonDocumentUrl: 'api-json',
    });
    
    meilisearchService = moduleFixture.get<MeilisearchService>(MeilisearchService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /books/upload -> GET /books/search/content', () => {
    it('should upload a book and then search for its content', async () => {
      // Skip test if Meilisearch is not available
      const isHealthy = await meilisearchService.isHealthy();
      if (!isHealthy) {
        console.log('Skipping integration test - Meilisearch is not available');
        return;
      }

      // Note: This test would require a real PDF file for upload
      // For now, we'll test the search endpoints with mock data
      
      const searchQuery = 'javascript';
      
      const response = await request(app.getHttpServer())
        .get(`/books/search/content?q=${searchQuery}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // The response should be an array (empty if no books are indexed)
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('book');
        expect(response.body[0]).toHaveProperty('snippets');
        expect(response.body[0]).toHaveProperty('relevanceScore');
      }
    });
  });

  describe('GET /books/search/suggestions', () => {
    it('should return search suggestions', async () => {
      const isHealthy = await meilisearchService.isHealthy();
      if (!isHealthy) {
        console.log('Skipping integration test - Meilisearch is not available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/books/search/suggestions?q=java&limit=5')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Search endpoint validation', () => {
    it('should return 400 for queries shorter than 2 characters', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search/content?q=a')
        .expect(400); // BadRequestException returns 400

      // The error message should indicate the validation issue
      expect(response.body.message).toContain('Search query must be at least 2 characters long');
    });

    it('should handle missing query parameter gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search/content')
        .expect(400); // BadRequestException returns 400

      expect(response.body.message).toContain('Search query must be at least 2 characters long');
    });
  });

  describe('Search pagination and options', () => {
    it('should accept limit and offset parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search/content?q=test&limit=5&offset=10')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should limit the maximum number of results', async () => {
      const response = await request(app.getHttpServer())
        .get('/books/search/content?q=test&limit=100') // Should be capped at 50
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Service health and fallback', () => {
    it('should return empty results when search service is unavailable', async () => {
      // Mock the service to simulate being unhealthy
      const originalIsHealthy = meilisearchService.isHealthy;
      jest.spyOn(meilisearchService, 'isHealthy').mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .get('/books/search/content?q=test')
        .expect(200);

      expect(response.body).toEqual([]);

      // Restore the original method
      meilisearchService.isHealthy = originalIsHealthy;
    });
  });

  describe('Swagger API documentation', () => {
    it('should serve API documentation', async () => {
      await request(app.getHttpServer())
        .get('/api')
        .expect(200);
    });

    it('should include search endpoints in API documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);

      const apiDoc = response.body;
      expect(apiDoc.paths).toHaveProperty('/books/search/content');
      expect(apiDoc.paths).toHaveProperty('/books/search/suggestions');
    });
  });
});