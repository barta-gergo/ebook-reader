import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateBookDto {
  @IsString()
  title: string;

  @IsString()
  author: string;

  @IsString()
  filePath: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsNumber()
  totalPages: number;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  keywords?: string;

  @IsOptional()
  @IsString()
  creator?: string;

  @IsOptional()
  @IsString()
  producer?: string;

  @IsOptional()
  @IsDateString()
  creationDate?: Date;

  @IsOptional()
  @IsDateString()
  modificationDate?: Date;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsNumber()
  textLength?: number;

  @IsOptional()
  @IsString()
  searchableText?: string;
}

export class BookResponseDto {
  id: string;
  title: string;
  author: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  totalPages: number;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  version?: string;
  textLength?: number;
  addedAt: Date;
  lastOpened?: Date;
}

export class UpdateReadingProgressDto {
  @IsNumber()
  currentPage: number;

  @IsNumber()
  scrollPosition: number;

  @IsOptional()
  @IsNumber()
  additionalReadingTime?: number;
}