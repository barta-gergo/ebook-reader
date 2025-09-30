/**
 * Generation options for LLM text generation
 */
export interface GenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Model information returned by the LLM service
 */
export interface ModelInfo {
  name: string;
  size?: string;
  description?: string;
}

/**
 * Abstract interface for LLM services
 * Allows swapping between different providers (Ollama, OpenAI, Claude, etc.)
 */
export interface LLMService {
  /**
   * Generate a summary or note from the given text
   */
  generateSummary(text: string, options?: GenerationOptions): Promise<string>;

  /**
   * Generate text based on a prompt
   */
  generateText(prompt: string, options?: GenerationOptions): Promise<string>;

  /**
   * List all available models from the provider
   */
  listAvailableModels(): Promise<ModelInfo[]>;

  /**
   * Set the active model to use
   */
  setModel(modelName: string): void;

  /**
   * Get the currently active model
   */
  getCurrentModel(): string;

  /**
   * Check if the service is available/healthy
   */
  isHealthy(): Promise<boolean>;
}
