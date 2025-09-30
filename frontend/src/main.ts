import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Configure PDF.js worker globally with specific version
declare const window: any;
if (typeof window !== 'undefined') {
  // Use specific version 4.8.69 with .mjs extension as shown in jsdelivr CDN
  (window as any).pdfWorkerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
