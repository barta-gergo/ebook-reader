export class TocItemDto {
  id: string;
  bookId: string;
  title: string;
  page: number;
  level: number;
  parentId?: string;
  order?: number;
  children?: TocItemDto[];
  createdAt: Date;
  updatedAt: Date;
}