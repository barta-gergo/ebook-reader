# AI-Powered Bookmark Notes

This ebook reader now includes AI-powered bookmark note generation using local LLMs via Ollama.

## Features

- **✨ Generate bookmark notes automatically** from the content of the current page
- **🤖 Local LLM processing** - Your data stays on your machine
- **⚡ Fast inference** - Optimized for RTX 4070 Ti (12GB VRAM)
- **🔄 Swappable models** - Easy to change LLM models
- **🔌 Pluggable architecture** - Easy to add new LLM providers (OpenAI, Claude, etc.)

## Prerequisites

### 1. Install Ollama

Download and install Ollama from [https://ollama.com](https://ollama.com)

**Windows/Mac/Linux:**
```bash
# Visit https://ollama.com/download and install for your OS
```

### 2. Pull the Recommended Model

For RTX 4070 Ti (12GB VRAM), we recommend **Llama 3.2 3B**:

```bash
ollama pull llama3.2:3b
```

This model provides:
- Fast inference (~30-50 tokens/sec on 4070Ti)
- Excellent summarization quality
- Low VRAM usage (~2GB)
- Leaves plenty of headroom for your system

### 3. Verify Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Or test generation
ollama run llama3.2:3b "Summarize this: The quick brown fox jumps over the lazy dog"
```

## Configuration

### Backend Configuration

Edit `backend/.env`:

```env
# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
LLM_MODEL=llama3.2:3b
LLM_PROVIDER=ollama
```

### Available Models

You can use any Ollama model. Here are recommendations based on your hardware:

| Model | VRAM Usage | Speed | Quality | Best For |
|-------|------------|-------|---------|----------|
| **llama3.2:3b** ⭐ | ~2GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Default choice, fast & efficient |
| llama3.1:8b | ~5GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐⭐ | Better quality, still fast |
| mistral:7b | ~4GB | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ | Good for concise summaries |
| phi3:mini | ~2.5GB | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | Very lightweight |
| gemma2:9b | ~6GB | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ | High quality, slower |

To switch models:

```bash
# Pull a different model
ollama pull llama3.1:8b

# Update .env
LLM_MODEL=llama3.1:8b

# Restart backend
npm run start:dev
```

## How to Use

### 1. Create a Bookmark with AI Note

1. Open a book and navigate to any page
2. Click the **☆ Bookmark** button in the toolbar
3. In the bookmark dialog, click **✨ Generate with AI**
4. Wait a few seconds for the AI to analyze the page
5. The generated note will appear in the text area
6. Edit if needed, then click **Save**

### 2. AI Generation Process

The system:
1. Extracts text from the current PDF page
2. Sends the text to your local Ollama instance
3. Uses the configured LLM to generate a concise summary
4. Returns the summary as a bookmark note

**Note:** Text is limited to 2000 characters to ensure fast processing.

## Architecture

### Backend Components

```
domain/services/
├── llm.interface.ts              # LLM service abstraction
infrastructure/services/
├── ollama-llm.service.ts          # Ollama implementation
├── text-indexing.service.ts       # PDF text extraction
application/services/
├── bookmark.application.service.ts # Bookmark + AI logic
presentation/controllers/
├── bookmarks.controller.ts        # REST API endpoint
```

### API Endpoint

```http
POST /bookmarks/generate-note
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "bookId": "book-id-here",
  "pageNumber": 42
}

Response:
{
  "note": "Generated summary of the page content..."
}
```

### Frontend Integration

```typescript
// BookmarkService
generateNote(bookId: string, pageNumber: number): Observable<{ note: string }>

// PdfViewerComponent
generateNoteWithAI(): void
```

## Adding New LLM Providers

The system uses a strategy pattern to support multiple LLM providers.

### Example: Adding OpenAI Support

1. Create `infrastructure/services/openai-llm.service.ts`:

```typescript
@Injectable()
export class OpenAILLMService implements LLMService {
  async generateSummary(text: string, options?: GenerationOptions): Promise<string> {
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: text }]
      })
    });
    // ... process response
  }
  // ... implement other methods
}
```

2. Update `app.module.ts`:

```typescript
{
  provide: LLM_SERVICE,
  useClass: process.env.LLM_PROVIDER === 'openai'
    ? OpenAILLMService
    : OllamaLLMService,
}
```

3. Add config to `.env`:

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-api-key
```

## Troubleshooting

### "Failed to generate note" Error

**Cause:** Ollama is not running or the model is not available.

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start Ollama
ollama serve

# Verify model is downloaded
ollama list

# If model is missing, pull it
ollama pull llama3.2:3b
```

### Slow Generation

**Cause:** Model is too large for your GPU or system is under load.

**Solution:**
- Switch to a smaller model (e.g., `llama3.2:3b` or `phi3:mini`)
- Close other GPU-intensive applications
- Reduce `maxTokens` in the generation options (currently 150)

### Out of Memory Errors

**Cause:** Model requires more VRAM than available.

**Solution:**
- Use a smaller model
- Close other applications using GPU
- Consider CPU-only mode (slower but works):
  ```bash
  OLLAMA_NUM_GPU=0 ollama serve
  ```

### Empty or Poor Quality Notes

**Cause:** Page has little text or text extraction failed.

**Solution:**
- Check if the PDF page contains extractable text (not just images)
- Try a different model with better summarization capabilities
- Adjust the system prompt in `bookmark.application.service.ts`

## Performance Tips

1. **Keep Ollama running** - Starting it fresh each time adds latency
2. **Pre-load models** - Run `ollama pull <model>` before first use
3. **Use smaller models** for faster responses
4. **Monitor GPU usage** - Use `nvidia-smi` to check VRAM usage
5. **Batch processing** - Generate notes for multiple bookmarks at once (future feature)

## Future Enhancements

- [ ] Model selection UI in settings
- [ ] Batch note generation for multiple pages
- [ ] Custom prompt templates
- [ ] Support for image-to-text (OCR + LLM)
- [ ] Integration with cloud LLM providers (OpenAI, Claude)
- [ ] Caching of generated notes
- [ ] Fine-tuned models for academic/technical books

## Credits

- **Ollama**: https://ollama.com
- **Llama 3.2**: Meta AI
- **PDF Text Extraction**: pdf-parse library

---

**Need Help?** Open an issue on GitHub or check the Ollama documentation at https://github.com/ollama/ollama
