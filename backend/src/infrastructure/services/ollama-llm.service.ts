import { Injectable, Logger } from '@nestjs/common';
import { LLMService, GenerationOptions, ModelInfo } from '../../domain/services/llm.interface';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

interface OllamaModel {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
}

@Injectable()
export class OllamaLLMService implements LLMService {
  private readonly logger = new Logger(OllamaLLMService.name);
  private currentModel: string;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.currentModel = process.env.LLM_MODEL || 'llama3.2:3b';
    this.logger.log(`Initialized Ollama LLM Service with model: ${this.currentModel}`);
    this.logger.log(`Ollama base URL: ${this.baseUrl}`);
  }

  async generateSummary(text: string, options?: GenerationOptions): Promise<string> {
    const systemPrompt = options?.systemPrompt ||
      'You are a helpful assistant that creates concise, informative summaries of text. ' +
      'Focus on the main points and key takeaways. Keep the summary brief (2-3 sentences).';

    const prompt = `${systemPrompt}\n\nText to summarize:\n${text}\n\nSummary:`;

    return this.generateText(prompt, options);
  }

  async generateText(prompt: string, options?: GenerationOptions): Promise<string> {
    try {
      const requestBody: OllamaGenerateRequest = {
        model: this.currentModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 500,
        },
      };

      this.logger.debug(`Generating text with model: ${this.currentModel}`);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: OllamaGenerateResponse = await response.json();

      this.logger.debug(`Generated text successfully (${data.response.length} chars)`);

      return data.response.trim();
    } catch (error) {
      this.logger.error(`Error generating text: ${error.message}`, error.stack);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data: { models: OllamaModel[] } = await response.json();

      return data.models.map(model => ({
        name: model.name,
        size: model.size ? this.formatBytes(model.size) : undefined,
        description: `Modified: ${model.modified_at || 'Unknown'}`,
      }));
    } catch (error) {
      this.logger.error(`Error listing models: ${error.message}`);
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }

  setModel(modelName: string): void {
    this.logger.log(`Switching model from ${this.currentModel} to ${modelName}`);
    this.currentModel = modelName;
  }

  getCurrentModel(): string {
    return this.currentModel;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      this.logger.warn(`Ollama health check failed: ${error.message}`);
      return false;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
