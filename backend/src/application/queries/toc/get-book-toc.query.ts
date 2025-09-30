import { Injectable, Inject } from '@nestjs/common';
import { TocItemRepository } from '../../../domain/repositories/toc-item.repository.interface';
import { TOC_ITEM_REPOSITORY } from '../../../domain/repositories/tokens';
import { TocItemDto } from '../../dtos/toc-item.dto';
import { BookId } from '../../../domain/value-objects';

@Injectable()
export class GetBookTocQuery {
  constructor(
    @Inject(TOC_ITEM_REPOSITORY)
    private readonly tocItemRepository: TocItemRepository,
  ) {}

  async execute(bookId: string): Promise<TocItemDto[]> {
    const bookIdVO = BookId.fromString(bookId);
    const tocItems = await this.tocItemRepository.findByBookId(bookIdVO);
    
    // Build hierarchical structure
    const tocMap = new Map<string, TocItemDto>();
    const rootItems: TocItemDto[] = [];

    // First pass: create all items
    tocItems.forEach(item => {
      const dto: TocItemDto = {
        id: item.id,
        bookId: item.bookId.value,
        title: item.title,
        page: item.page,
        level: item.level,
        parentId: item.parentId,
        order: item.order,
        children: [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
      tocMap.set(item.id, dto);
    });

    // Second pass: build hierarchy
    tocItems.forEach(item => {
      const dto = tocMap.get(item.id)!;
      if (item.parentId) {
        const parent = tocMap.get(item.parentId);
        if (parent) {
          parent.children!.push(dto);
        }
      } else {
        rootItems.push(dto);
      }
    });

    // Sort children by order
    const sortByOrder = (items: TocItemDto[]) => {
      items.sort((a, b) => (a.order || 0) - (b.order || 0));
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(rootItems);
    return rootItems;
  }
}