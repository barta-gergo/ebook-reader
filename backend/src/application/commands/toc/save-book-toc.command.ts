import { Injectable, Inject } from '@nestjs/common';
import { TocItemRepository } from '../../../domain/repositories/toc-item.repository.interface';
import { TOC_ITEM_REPOSITORY } from '../../../domain/repositories/tokens';
import { TocItem } from '../../../domain/entities/toc-item.entity';
import { TOCItem } from '../../../domain/services/pdf-metadata.interface';
import { BookId } from '../../../domain/value-objects';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SaveBookTocCommand {
  constructor(
    @Inject(TOC_ITEM_REPOSITORY)
    private readonly tocItemRepository: TocItemRepository,
  ) {}

  async execute(bookId: string, tocItems: TOCItem[]): Promise<void> {
    const bookIdVO = BookId.fromString(bookId);
    // Clear existing TOC items for this book
    await this.tocItemRepository.deleteByBookId(bookIdVO);

    // Save new TOC items
    await this.saveTocItems(bookIdVO, tocItems);
  }

  private async saveTocItems(
    bookId: BookId, 
    tocItems: TOCItem[], 
    parentId?: string, 
    order: number = 0
  ): Promise<void> {
    for (let i = 0; i < tocItems.length; i++) {
      const item = tocItems[i];
      const tocId = uuidv4();
      
      const tocItem = TocItem.create(
        tocId,
        bookId,
        item.title,
        item.page,
        item.level,
        parentId,
        order + i
      );

      await this.tocItemRepository.save(tocItem);

      // Save children recursively
      if (item.children && item.children.length > 0) {
        await this.saveTocItems(bookId, item.children, tocId, 0);
      }
    }
  }
}