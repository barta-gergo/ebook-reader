import { Injectable, Logger } from '@nestjs/common';
import { TOCItem, TocExtractionResult } from '../../domain/services/pdf-metadata.interface';
import { TocExtractionService } from '../../domain/services/toc-extraction.interface';

export { TocExtractionResult };
import * as FormData from 'form-data';
import axios from 'axios';
import * as fs from 'fs';

export interface HuriDocsTocItem {
  indentation: number;
  label: string;
  bounding_box: {
    left: number;
    top: number;
    width: number;
    height: number;
    page: string;
  };
}

@Injectable()
export class HuriDocsTocService implements TocExtractionService {
  private readonly logger = new Logger(HuriDocsTocService.name);
  private readonly HURIDOCS_URL = process.env.HURIDOCS_TOC_URL || 'http://localhost:5060';
  private readonly TIMEOUT = parseInt(process.env.HURIDOCS_TIMEOUT || '120000');
  private readonly MAX_RETRIES = parseInt(process.env.TOC_EXTRACTION_MAX_RETRIES || '3');

  async extractToc(filePath: string, fastMode = false): Promise<TocExtractionResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting HuriDocs TOC extraction for: ${filePath} (fast: ${fastMode})`);
      
      // Verify file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Call HuriDocs TOC service with retry logic
      const huridocsToc = await this.callHuriDocsWithRetry(filePath, fastMode);
      
      // Convert to our TOC format
      const tocItems = this.convertToTocItems(huridocsToc);
      const hierarchicalToc = this.buildHierarchy(tocItems);
      
      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(huridocsToc, hierarchicalToc);
      
      this.logger.log(`HuriDocs extraction completed: ${hierarchicalToc.length} items, confidence: ${confidence}, time: ${processingTime}ms`);
      
      return {
        items: hierarchicalToc,
        confidence,
        method: 'huridocs',
        extractedAt: new Date(),
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`HuriDocs TOC extraction failed after ${processingTime}ms:`, error.message);
      
      // Return empty result with low confidence
      return {
        items: [],
        confidence: 0,
        method: 'huridocs',
        extractedAt: new Date(),
        processingTime
      };
    }
  }

  private async callHuriDocsWithRetry(filePath: string, fastMode: boolean): Promise<HuriDocsTocItem[]> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.debug(`HuriDocs API call attempt ${attempt}/${this.MAX_RETRIES}`);
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));
        if (fastMode) {
          formData.append('fast', 'true');
        }

        const response = await axios.post(`${this.HURIDOCS_URL}/toc`, formData, {
          headers: { 
            ...formData.getHeaders(),
            'Accept': 'application/json'
          },
          timeout: this.TIMEOUT,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        if (!Array.isArray(response.data)) {
          throw new Error('Invalid response format from HuriDocs API');
        }

        return response.data;
      } catch (error) {
        lastError = error;
        this.logger.warn(`HuriDocs API attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.MAX_RETRIES) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.debug(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private convertToTocItems(huridocsToc: HuriDocsTocItem[]): TOCItem[] {
    return huridocsToc.map((item, index) => ({
      title: item.label.trim(),
      page: this.extractPageFromBoundingBox(item.bounding_box),
      level: Math.max(1, Math.min(item.indentation + 1, 6)), // Ensure level is between 1-6
      children: [] // Will be built hierarchically later
    })).filter(item => 
      // Filter out invalid items
      item.title.length > 0 && 
      item.page > 0 && 
      item.title.length < 500 // Sanity check for title length
    );
  }

  private extractPageFromBoundingBox(boundingBox: any): number {
    try {
      // HuriDocs returns page as string, convert to number
      const pageStr = boundingBox.page;
      const pageNum = parseInt(pageStr, 10);
      return isNaN(pageNum) ? 1 : Math.max(1, pageNum);
    } catch (error) {
      this.logger.warn('Failed to extract page number from bounding box:', error);
      return 1;
    }
  }

  // Build hierarchical structure from flat indented list
  buildHierarchy(flatToc: TOCItem[]): TOCItem[] {
    const result: TOCItem[] = [];
    const stack: TOCItem[] = [];

    for (const item of flatToc) {
      // Remove items from stack that are at same or higher level
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // Root level item
        result.push(item);
      } else {
        // Child item
        const parent = stack[stack.length - 1];
        if (!parent.children) parent.children = [];
        parent.children.push(item);
      }

      stack.push(item);
    }

    return result;
  }

  private calculateConfidence(huridocsToc: HuriDocsTocItem[], hierarchicalToc: TOCItem[]): number {
    // Base confidence for HuriDocs (it's ML-powered, so inherently high)
    let confidence = 0.85;
    
    // Boost confidence based on result quality
    if (hierarchicalToc.length > 0) {
      // More items generally indicate better extraction
      const itemsBonus = Math.min(0.1, hierarchicalToc.length * 0.01);
      confidence += itemsBonus;
      
      // Check for proper hierarchy (multiple levels)
      const levels = new Set(this.flattenTocItems(hierarchicalToc).map(item => item.level));
      if (levels.size > 1) {
        confidence += 0.05; // Bonus for hierarchical structure
      }
      
      // Check for reasonable page progression
      const pages = this.flattenTocItems(hierarchicalToc).map(item => item.page);
      const isProgressive = pages.every((page, i) => i === 0 || page >= pages[i - 1]);
      if (isProgressive) {
        confidence += 0.03; // Bonus for logical page order
      }
    }
    
    // Cap confidence at 0.95 (never 100% certain)
    return Math.min(0.95, confidence);
  }

  private flattenTocItems(tocItems: TOCItem[]): TOCItem[] {
    const flattened: TOCItem[] = [];
    
    const flatten = (items: TOCItem[]) => {
      for (const item of items) {
        flattened.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      }
    };
    
    flatten(tocItems);
    return flattened;
  }

  // Health check method
  async isServiceHealthy(): Promise<boolean> {
    try {
      // Simple health check - just try to connect
      const response = await axios.get(`${this.HURIDOCS_URL}/health`, { 
        timeout: 5000 
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('HuriDocs service health check failed:', error.message);
      return false;
    }
  }

  // Get service status and configuration
  getServiceInfo() {
    return {
      url: this.HURIDOCS_URL,
      timeout: this.TIMEOUT,
      maxRetries: this.MAX_RETRIES,
      enabled: process.env.HURIDOCS_ENABLED !== 'false'
    };
  }
}