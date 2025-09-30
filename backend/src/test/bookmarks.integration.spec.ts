import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarkApplicationService } from '../application/services/bookmark.application.service';
import { BookmarkRepositoryImpl } from '../infrastructure/repositories/bookmark.repository';
import { BookmarkOrmEntity } from '../infrastructure/database/entities/bookmark.orm-entity';
import { UserId, BookId } from '../domain/value-objects';
import { BOOKMARK_REPOSITORY } from '../domain/repositories/tokens';

describe('Bookmarks Integration', () => {
  let app: INestApplication;
  let bookmarkService: BookmarkApplicationService;

  const user1Id = UserId.create('user1');
  const user2Id = UserId.create('user2');
  const book1Id = BookId.create('book1');
  const book2Id = BookId.create('book2');

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [BookmarkOrmEntity],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([BookmarkOrmEntity]),
      ],
      providers: [
        BookmarkApplicationService,
        {
          provide: BOOKMARK_REPOSITORY,
          useClass: BookmarkRepositoryImpl,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    bookmarkService = moduleFixture.get<BookmarkApplicationService>(BookmarkApplicationService);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create a bookmark', async () => {
    const bookmark = await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 42,
      scrollPosition: 0.5,
      title: 'Important section',
      note: 'Remember to review this'
    });

    expect(bookmark).toBeDefined();
    expect(bookmark.bookId).toBe(book1Id.value);
    expect(bookmark.pageNumber).toBe(42);
    expect(bookmark.scrollPosition).toBe(0.5);
    expect(bookmark.title).toBe('Important section');
    expect(bookmark.note).toBe('Remember to review this');
  });

  it('should retrieve bookmarks by book', async () => {
    // Create multiple bookmarks for the same book
    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 10,
      scrollPosition: 0.0,
      title: 'Chapter 1'
    });

    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 50,
      scrollPosition: 0.0,
      title: 'Chapter 2'
    });

    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 100,
      scrollPosition: 0.0,
      title: 'Chapter 3'
    });

    const bookmarks = await bookmarkService.getBookmarksByBook(book1Id.value, user1Id);

    expect(bookmarks).toHaveLength(3);
    // Should be sorted by page number
    expect(bookmarks[0].pageNumber).toBe(10);
    expect(bookmarks[1].pageNumber).toBe(50);
    expect(bookmarks[2].pageNumber).toBe(100);
  });

  it('should isolate bookmarks between users', async () => {
    // User 1 creates bookmarks
    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 10,
      scrollPosition: 0.0,
      title: 'User 1 bookmark'
    });

    // User 2 creates bookmarks
    await bookmarkService.createBookmark(user2Id, {
      bookId: book1Id.value,
      pageNumber: 20,
      scrollPosition: 0.0,
      title: 'User 2 bookmark'
    });

    const user1Bookmarks = await bookmarkService.getBookmarksByBook(book1Id.value, user1Id);
    const user2Bookmarks = await bookmarkService.getBookmarksByBook(book1Id.value, user2Id);

    expect(user1Bookmarks).toHaveLength(1);
    expect(user2Bookmarks).toHaveLength(1);
    expect(user1Bookmarks[0].title).toBe('User 1 bookmark');
    expect(user2Bookmarks[0].title).toBe('User 2 bookmark');
  });

  it('should update a bookmark', async () => {
    const bookmark = await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 42,
      scrollPosition: 0.5,
      title: 'Original title'
    });

    const updated = await bookmarkService.updateBookmark(bookmark.id, user1Id, {
      title: 'Updated title',
      note: 'Added a note'
    });

    expect(updated.title).toBe('Updated title');
    expect(updated.note).toBe('Added a note');
    expect(updated.pageNumber).toBe(42); // Unchanged
  });

  it('should delete a bookmark', async () => {
    const bookmark = await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 42,
      scrollPosition: 0.5
    });

    await bookmarkService.deleteBookmark(bookmark.id, user1Id);

    // Try to retrieve the bookmark - should throw
    await expect(
      bookmarkService.getBookmark(bookmark.id, user1Id)
    ).rejects.toThrow();
  });

  it('should prevent users from accessing other users bookmarks', async () => {
    const user1Bookmark = await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 42,
      scrollPosition: 0.5
    });

    // User 2 tries to access user 1's bookmark
    await expect(
      bookmarkService.getBookmark(user1Bookmark.id, user2Id)
    ).rejects.toThrow('Access denied');

    // User 2 tries to update user 1's bookmark
    await expect(
      bookmarkService.updateBookmark(user1Bookmark.id, user2Id, { title: 'Hacked!' })
    ).rejects.toThrow('Access denied');

    // User 2 tries to delete user 1's bookmark
    await expect(
      bookmarkService.deleteBookmark(user1Bookmark.id, user2Id)
    ).rejects.toThrow('Access denied');
  });

  it('should get all bookmarks for a user', async () => {
    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 10,
      scrollPosition: 0.0
    });

    await bookmarkService.createBookmark(user1Id, {
      bookId: book2Id.value,
      pageNumber: 20,
      scrollPosition: 0.0
    });

    const allBookmarks = await bookmarkService.getAllUserBookmarks(user1Id);
    expect(allBookmarks).toHaveLength(2);
  });

  it('should delete all user bookmarks', async () => {
    await bookmarkService.createBookmark(user1Id, {
      bookId: book1Id.value,
      pageNumber: 10,
      scrollPosition: 0.0
    });

    await bookmarkService.createBookmark(user1Id, {
      bookId: book2Id.value,
      pageNumber: 20,
      scrollPosition: 0.0
    });

    const deletedCount = await bookmarkService.deleteAllUserBookmarks(user1Id);
    expect(deletedCount).toBe(2);

    const remainingBookmarks = await bookmarkService.getAllUserBookmarks(user1Id);
    expect(remainingBookmarks).toHaveLength(0);
  });
});
