import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PdfViewerComponent } from './pdf-viewer';
import { BookService } from '../../services/book';

describe('PdfViewerComponent', () => {
  let component: PdfViewerComponent;
  let fixture: ComponentFixture<PdfViewerComponent>;
  let bookService: jasmine.SpyObj<BookService>;

  beforeEach(async () => {
    const bookServiceSpy = jasmine.createSpyObj('BookService', ['updateReadingProgress', 'navigation$']);
    bookServiceSpy.navigation$ = of();

    await TestBed.configureTestingModule({
      imports: [PdfViewerComponent, HttpClientTestingModule],
      providers: [
        { provide: BookService, useValue: bookServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdfViewerComponent);
    component = fixture.componentInstance;
    bookService = TestBed.inject(BookService) as jasmine.SpyObj<BookService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('progress update validation', () => {
    it('should not update progress when page number exceeds total pages', (done) => {
      // Setup component with a book
      component.book = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        totalPages: 100,
        filePath: 'test.pdf',
        addedAt: new Date(),
        fileSize: 1000,
        mimeType: 'application/pdf'
      };
      component.totalPages = 100;
      bookService.updateReadingProgress.and.returnValue(of({} as any));

      // Trigger progress update with invalid page number
      component['progressUpdateSubject'].next({ page: 200, scroll: 0 });

      // Wait for debounce to complete
      setTimeout(() => {
        expect(bookService.updateReadingProgress).not.toHaveBeenCalled();
        done();
      }, 2100); // Slightly longer than debounce time
    });

    it('should update progress when page number is valid', (done) => {
      // Setup component with a book
      component.book = {
        id: 'test-book',
        title: 'Test Book',
        author: 'Test Author',
        totalPages: 100,
        filePath: 'test.pdf',
        addedAt: new Date(),
        fileSize: 1000,
        mimeType: 'application/pdf'
      };
      component.totalPages = 100;
      bookService.updateReadingProgress.and.returnValue(of({} as any));

      // Trigger progress update with valid page number
      component['progressUpdateSubject'].next({ page: 50, scroll: 0 });

      // Wait for debounce to complete
      setTimeout(() => {
        expect(bookService.updateReadingProgress).toHaveBeenCalledWith('test-book', 50, 0, jasmine.any(Number));
        done();
      }, 2100);
    });

    it('should reset reading start time when book changes', () => {
      const initialTime = component['readingStartTime'];
      
      // Simulate book change
      const newBook = {
        id: 'new-book',
        title: 'New Book',
        author: 'New Author',
        totalPages: 50,
        filePath: 'new.pdf',
        addedAt: new Date(),
        fileSize: 500,
        mimeType: 'application/pdf'
      };

      component.ngOnChanges({
        book: {
          currentValue: newBook,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component['readingStartTime']).toBeGreaterThan(initialTime);
      expect(component.currentPage).toBe(1);
      expect(component.totalPages).toBe(0);
    });
  });
});
