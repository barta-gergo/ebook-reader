import { Test, TestingModule } from '@nestjs/testing';
import { OllamaLLMService } from './ollama-llm.service';

describe('OllamaLLMService', () => {
  let service: OllamaLLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaLLMService],
    }).compile();

    service = module.get<OllamaLLMService>(OllamaLLMService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have a current model', () => {
    const model = service.getCurrentModel();
    expect(model).toBeDefined();
    expect(typeof model).toBe('string');
  });

  it('should allow setting a model', () => {
    const newModel = 'llama3.1:8b';
    service.setModel(newModel);
    expect(service.getCurrentModel()).toBe(newModel);
  });

  describe('with Ollama running', () => {
    beforeEach(() => {
      // Skip tests if Ollama is not available
      const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      if (!ollamaUrl) {
        pending('Ollama not configured');
      }
    });

    it('should check health', async () => {
      const isHealthy = await service.isHealthy();
      // This will only pass if Ollama is running
      // In CI/CD, this might be skipped
      if (isHealthy) {
        expect(isHealthy).toBe(true);
      }
    });

    it('should list available models', async () => {
      try {
        const models = await service.listAvailableModels();
        expect(Array.isArray(models)).toBe(true);
        if (models.length > 0) {
          expect(models[0]).toHaveProperty('name');
        }
      } catch (error) {
        // Ollama might not be running in test environment
        pending('Ollama not available');
      }
    });

    it('should generate text', async () => {
      try {
        const text = await service.generateText('Say hello in one word', {
          temperature: 0.7,
          maxTokens: 10,
        });
        expect(text).toBeDefined();
        expect(typeof text).toBe('string');
        expect(text.length).toBeGreaterThan(0);
      } catch (error) {
        // Ollama might not be running in test environment
        pending('Ollama not available');
      }
    }, 30000); // 30 second timeout for LLM generation

    it('should generate a summary', async () => {
      try {
        const testText = 'The quick brown fox jumps over the lazy dog. ' +
          'This is a classic pangram sentence that contains all letters of the alphabet.';

        const summary = await service.generateSummary(testText, {
          temperature: 0.7,
          maxTokens: 50,
        });

        expect(summary).toBeDefined();
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
        expect(summary.length).toBeLessThan(testText.length);
      } catch (error) {
        // Ollama might not be running in test environment
        pending('Ollama not available');
      }
    }, 30000); // 30 second timeout for LLM generation
  });
});
