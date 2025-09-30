import { ReadingProgress } from './reading-progress.entity';
import { BookId, UserId } from '../value-objects';

describe('ReadingProgress Entity', () => {
  let progress: ReadingProgress;

  beforeEach(() => {
    progress = new ReadingProgress(
      '1',
      BookId.fromString('book-1'),
      UserId.fromString('user-1'),
      10,
      500,
      10.0,
      new Date('2023-01-01'),
      30,
    );
  });

  describe('updateProgress', () => {
    it('should update progress correctly', () => {
      const updatedProgress = progress.updateProgress(20, 1000, 100, 15);

      expect(updatedProgress.currentPage).toBe(20);
      expect(updatedProgress.scrollPosition).toBe(1000);
      expect(updatedProgress.progressPercentage).toBe(20.0);
      expect(updatedProgress.readingTimeMinutes).toBe(45);
      expect(updatedProgress.lastUpdated).toBeInstanceOf(Date);
    });

    it('should calculate progress percentage correctly', () => {
      const updatedProgress = progress.updateProgress(50, 0, 100, 0);
      expect(updatedProgress.progressPercentage).toBe(50.0);
    });

    it('should cap progress at 100%', () => {
      const updatedProgress = progress.updateProgress(150, 0, 100, 0);
      expect(updatedProgress.progressPercentage).toBe(100.0);
    });

    it('should not allow negative progress', () => {
      const updatedProgress = progress.updateProgress(-10, 0, 100, 0);
      expect(updatedProgress.progressPercentage).toBe(0.0);
    });

    it('should create a new instance', () => {
      const updatedProgress = progress.updateProgress(15, 600, 100, 0);
      expect(updatedProgress).not.toBe(progress);
    });
  });

  describe('isCompleted', () => {
    it('should return true when progress is 100%', () => {
      const completedProgress = new ReadingProgress(
        '1',
        BookId.fromString('book-1'),
        UserId.fromString('user-1'),
        100,
        0,
        100.0,
        new Date(),
        60,
      );

      expect(completedProgress.isCompleted()).toBe(true);
    });

    it('should return false when progress is less than 100%', () => {
      expect(progress.isCompleted()).toBe(false);
    });

    it('should return true when progress is greater than 100%', () => {
      const overProgress = new ReadingProgress(
        '1',
        BookId.fromString('book-1'),
        UserId.fromString('user-1'),
        150,
        0,
        110.0,
        new Date(),
        60,
      );

      expect(overProgress.isCompleted()).toBe(true);
    });
  });
});