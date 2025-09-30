import { TOCItem, TocExtractionResult } from './pdf-metadata.interface';

export interface TocExtractionService {
  extractToc(filePath: string, fastMode?: boolean): Promise<TocExtractionResult>;
  isServiceHealthy(): Promise<boolean>;
  getServiceInfo(): any;
}