import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { BookListComponent } from './book-list';
import { BookService } from '../../services/book';
import { StorageService } from '../../services/storage.service';

describe('BookListComponent', () => {
  let component: BookListComponent;
  let fixture: ComponentFixture<BookListComponent>;
  let mockBookService: jasmine.SpyObj<BookService>;
  let mockStorageService: jasmine.SpyObj<StorageService>;

  beforeEach(async () => {
    const bookServiceSpy = jasmine.createSpyObj('BookService', ['setCurrentBook', 'getCurrentBook']);
    const storageServiceSpy = jasmine.createSpyObj('StorageService', ['loadBookFromLibrary'], {
      library$: of([])
    });

    await TestBed.configureTestingModule({
      imports: [BookListComponent, HttpClientTestingModule],
      providers: [
        { provide: BookService, useValue: bookServiceSpy },
        { provide: StorageService, useValue: storageServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookListComponent);
    component = fixture.componentInstance;
    mockBookService = TestBed.inject(BookService) as jasmine.SpyObj<BookService>;
    mockStorageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display empty state when no books', () => {
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('No books in your library yet');
  });
});
