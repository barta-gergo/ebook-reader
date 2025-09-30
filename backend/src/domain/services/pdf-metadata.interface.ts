export interface PDFPageContent {
  pageNumber: number;
  textContent: string;
}

export interface TOCItem {
  title: string;
  page: number;
  level: number;
  children?: TOCItem[];
}

export interface TocExtractionResult {
  items: TOCItem[];
  confidence: number;
  method: 'huridocs' | 'embedded' | 'pattern';
  extractedAt: Date;
  processingTime: number;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pages: number;
  version?: string;
  textLength: number;
  textContent?: string;
  pageContents?: PDFPageContent[];
  outline?: TOCItem[];
  tocExtractionResult?: TocExtractionResult;
}

export interface PdfMetadataService {
  extractMetadata(filePath: string): Promise<PDFMetadata>;
}