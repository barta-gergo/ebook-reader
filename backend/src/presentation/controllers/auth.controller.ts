import { Controller, Get, Post, Put, Delete, Body, UseGuards, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../../infrastructure/auth/auth.service';
import { GoogleAuthGuard } from '../../infrastructure/auth/google-auth.guard';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../infrastructure/auth/current-user.decorator';
import { User } from '../../domain/entities/user.entity';
import { UserProfileApplicationService, UpdateUserProfileRequest } from '../../application/services/user-profile.application.service';
import { UserProfileSettingsData } from '../../domain/value-objects/user-profile-settings.value-object';
import { BookAggregateApplicationService } from '../../application/services/book-aggregate-application.service';
import { BookId } from '../../domain/value-objects';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userProfileService: UserProfileApplicationService,
    private readonly bookService: BookAggregateApplicationService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // This route initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with token' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const loginResponse = await this.authService.login(user);
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${loginResponse.accessToken}`);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with settings' })
  @ApiResponse({ status: 200, description: 'Returns current user profile with settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    return await this.userProfileService.getUserProfile(user.id);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ 
    description: 'User profile update data',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Display name' },
        settings: {
          type: 'object',
          description: 'User preferences and settings',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark', 'system'] },
            language: { type: 'string' },
            defaultZoom: { type: 'number' },
            defaultFitToPage: { type: 'boolean' },
            notificationsEnabled: { type: 'boolean' },
            emailUpdates: { type: 'boolean' },
            readingPreferences: {
              type: 'object',
              properties: {
                fontSize: { type: 'string', enum: ['small', 'medium', 'large'] },
                lineHeight: { type: 'number' },
                pageTransition: { type: 'string', enum: ['instant', 'fade', 'slide'] },
                autoBookmark: { type: 'boolean' },
                rememberLastPage: { type: 'boolean' },
              }
            },
            privacySettings: {
              type: 'object',
              properties: {
                profileVisible: { type: 'boolean' },
                readingStatsVisible: { type: 'boolean' },
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Returns updated user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@CurrentUser() user: User, @Body() updateRequest: UpdateUserProfileRequest) {
    return await this.userProfileService.updateUserProfile(user.id, updateRequest);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({ status: 200, description: 'Returns current user settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserSettings(@CurrentUser() user: User) {
    return await this.userProfileService.getUserSettings(user.id);
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user settings' })
  @ApiBody({ 
    description: 'User settings data',
    schema: {
      type: 'object',
      properties: {
        theme: { type: 'string', enum: ['light', 'dark', 'system'] },
        language: { type: 'string' },
        defaultZoom: { type: 'number' },
        defaultFitToPage: { type: 'boolean' },
        notificationsEnabled: { type: 'boolean' },
        emailUpdates: { type: 'boolean' },
        readingPreferences: {
          type: 'object',
          properties: {
            fontSize: { type: 'string', enum: ['small', 'medium', 'large'] },
            lineHeight: { type: 'number' },
            pageTransition: { type: 'string', enum: ['instant', 'fade', 'slide'] },
            autoBookmark: { type: 'boolean' },
            rememberLastPage: { type: 'boolean' },
          }
        },
        privacySettings: {
          type: 'object',
          properties: {
            profileVisible: { type: 'boolean' },
            readingStatsVisible: { type: 'boolean' },
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Returns updated user settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateUserSettings(@CurrentUser() user: User, @Body() settingsData: UserProfileSettingsData) {
    return await this.userProfileService.updateUserSettings(user.id, settingsData);
  }

  @Post('settings/reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reset user settings to defaults' })
  @ApiResponse({ status: 200, description: 'Returns default user settings' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetUserSettings(@CurrentUser() user: User) {
    return await this.userProfileService.resetUserSettings(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout() {
    // Since we're using stateless JWT tokens, logout is handled on the client side
    // by removing the token from storage
    return { message: 'Successfully logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: User) {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name,
      pictureUrl: user.pictureUrl,
      isActive: user.isActive,
    };
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user reading statistics' })
  @ApiResponse({ status: 200, description: 'Returns user reading statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStatistics(@CurrentUser() user: User) {
    return await this.bookService.getUserStatistics(user.id);
  }

  @Post('bulk/delete-books')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete user books' })
  @ApiBody({ 
    description: 'Array of book IDs to delete',
    schema: {
      type: 'object',
      properties: {
        bookIds: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Array of book IDs to delete'
        }
      },
      required: ['bookIds']
    }
  })
  @ApiResponse({ status: 200, description: 'Returns bulk deletion results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkDeleteBooks(@CurrentUser() user: User, @Body() body: { bookIds: string[] }) {
    const bookIds = body.bookIds.map(id => BookId.create(id));
    return await this.bookService.bulkDeleteBooksForUser(bookIds, user.id);
  }

  @Post('bulk/update-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk update reading progress for multiple books' })
  @ApiBody({ 
    description: 'Array of reading progress updates',
    schema: {
      type: 'object',
      properties: {
        updates: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bookId: { type: 'string' },
              currentPage: { type: 'number' },
              scrollPosition: { type: 'number' },
              readingTime: { type: 'number' }
            },
            required: ['bookId', 'currentPage', 'scrollPosition']
          },
          description: 'Array of reading progress updates'
        }
      },
      required: ['updates']
    }
  })
  @ApiResponse({ status: 200, description: 'Returns bulk update results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkUpdateProgress(@CurrentUser() user: User, @Body() body: { 
    updates: Array<{ bookId: string, currentPage: number, scrollPosition: number, readingTime?: number }> 
  }) {
    const updates = body.updates.map(update => ({
      bookId: BookId.create(update.bookId),
      currentPage: update.currentPage,
      scrollPosition: update.scrollPosition,
      readingTime: update.readingTime
    }));
    return await this.bookService.bulkUpdateReadingProgress(updates, user.id);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all user data including books, progress, and settings' })
  @ApiResponse({ status: 200, description: 'Returns complete user data export' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportUserData(@CurrentUser() user: User) {
    const bookData = await this.bookService.exportUserData(user.id);
    const userProfile = await this.userProfileService.getUserProfile(user.id);
    
    return {
      profile: {
        name: userProfile.name,
        email: userProfile.email,
        settings: userProfile.settings,
        createdAt: userProfile.createdAt,
      },
      books: bookData.books,
      statistics: bookData.statistics,
      exportedAt: bookData.exportedAt,
      version: '1.0',
    };
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import user data from exported data' })
  @ApiBody({ 
    description: 'User data export to import',
    schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            settings: { type: 'object' }
          }
        },
        books: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Returns import results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async importUserData(@CurrentUser() user: User, @Body() importData: {
    profile?: { name?: string, settings?: any };
    books?: any[];
  }) {
    const results = {
      profile: { updated: false, error: null as string | null },
      books: { imported: 0, failed: [] as any[], warnings: [] as string[] }
    };

    // Import profile if provided
    if (importData.profile) {
      try {
        await this.userProfileService.updateUserProfile(user.id, importData.profile);
        results.profile.updated = true;
      } catch (error) {
        results.profile.error = error.message;
      }
    }

    // Import books if provided
    if (importData.books && importData.books.length > 0) {
      const bookResults = await this.bookService.importUserDataMetadata(user.id, {
        books: importData.books
      });
      results.books = bookResults;
    }

    return results;
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account and all associated data' })
  @ApiBody({ 
    description: 'Confirmation object',
    schema: {
      type: 'object',
      properties: {
        confirmDeletion: { 
          type: 'boolean',
          description: 'Must be true to confirm account deletion'
        },
        reason: {
          type: 'string',
          description: 'Optional reason for account deletion'
        }
      },
      required: ['confirmDeletion']
    }
  })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid confirmation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: User, @Body() body: { 
    confirmDeletion: boolean; 
    reason?: string 
  }) {
    if (!body.confirmDeletion) {
      throw new Error('Account deletion must be confirmed');
    }

    try {
      // Delete all user books and files
      const bookDeletionResults = await this.bookService.deleteAllUserData(user.id);
      
      // Delete user profile and settings
      await this.userProfileService.deleteUserProfile(user.id);
      
      return {
        success: true,
        message: 'Account and all associated data have been successfully deleted',
        details: {
          deletedBooks: bookDeletionResults.deletedBooks,
          deletedFiles: bookDeletionResults.deletedFiles,
          errors: bookDeletionResults.errors,
          reason: body.reason || null,
          deletedAt: new Date(),
        }
      };
    } catch (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  @Get('account/deletion-preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview what will be deleted when account is deleted' })
  @ApiResponse({ status: 200, description: 'Returns preview of data to be deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAccountDeletionPreview(@CurrentUser() user: User) {
    const statistics = await this.bookService.getUserStatistics(user.id);
    const userProfile = await this.userProfileService.getUserProfile(user.id);
    
    return {
      userProfile: {
        name: userProfile.name,
        email: userProfile.email,
        createdAt: userProfile.createdAt,
        lastLogin: userProfile.lastLogin,
      },
      dataToDelete: {
        totalBooks: statistics.totalBooks,
        totalReadingTime: statistics.totalReadingTime,
        totalPages: statistics.totalPages,
        readingProgress: {
          completedBooks: statistics.completedBooks,
          inProgressBooks: statistics.inProgressBooks,
          notStartedBooks: statistics.notStartedBooks,
        },
        personalSettings: true,
        uploadedFiles: true,
      },
      warning: 'This action cannot be undone. All books, reading progress, and personal data will be permanently deleted.',
    };
  }

  @Post('cleanup/stale-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clean up stale reading progress (reset progress for books inactive for specified days)' })
  @ApiBody({ 
    description: 'Cleanup parameters',
    schema: {
      type: 'object',
      properties: {
        daysInactive: { 
          type: 'number',
          description: 'Number of days of inactivity before resetting progress (default: 90)',
          default: 90
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Returns cleanup results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupStaleProgress(@CurrentUser() user: User, @Body() body: { daysInactive?: number }) {
    const daysInactive = body.daysInactive || 90;
    return await this.bookService.cleanupStaleReadingProgress(user.id, daysInactive);
  }

  @Post('cleanup/duplicates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove duplicate books (same title and author)' })
  @ApiResponse({ status: 200, description: 'Returns duplicate removal results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeDuplicateBooks(@CurrentUser() user: User) {
    return await this.bookService.removeDuplicateBooks(user.id);
  }

  @Post('cleanup/orphaned-files')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clean up orphaned files (files without book records)' })
  @ApiResponse({ status: 200, description: 'Returns file cleanup results' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cleanupOrphanedFiles(@CurrentUser() user: User) {
    return await this.bookService.cleanupOrphanedFiles(user.id);
  }

  @Get('cleanup/preview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Preview what cleanup operations would do' })
  @ApiResponse({ status: 200, description: 'Returns preview of cleanup operations' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCleanupPreview(@CurrentUser() user: User) {
    const statistics = await this.bookService.getUserStatistics(user.id);
    const books = await this.bookService.getAllBooksByUser(user.id);
    
    // Count stale progress books (90+ days inactive)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    const staleBooksCount = books.filter(book => 
      book.readingProgress?.lastUpdated && book.readingProgress.lastUpdated < cutoffDate
    ).length;

    // Count potential duplicates
    const bookMap = new Map<string, number>();
    let duplicateCount = 0;
    for (const book of books) {
      const key = `${book.metadata.title.toLowerCase()}-${book.metadata.author.toLowerCase()}`;
      const count = (bookMap.get(key) || 0) + 1;
      bookMap.set(key, count);
      if (count > 1) {
        duplicateCount++;
      }
    }

    return {
      totalBooks: statistics.totalBooks,
      cleanupOpportunities: {
        staleProgressBooks: staleBooksCount,
        potentialDuplicates: duplicateCount,
        orphanedFilesCheck: 'Available (requires scan)',
      },
      recommendations: [
        staleBooksCount > 0 ? `Reset progress for ${staleBooksCount} stale books` : null,
        duplicateCount > 0 ? `Remove ${duplicateCount} duplicate books` : null,
        'Run orphaned files cleanup to free disk space',
      ].filter(Boolean),
    };
  }

  @Get('storage')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user storage usage and quota information' })
  @ApiResponse({ status: 200, description: 'Returns storage usage details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStorageInfo(@CurrentUser() user: User) {
    return await this.bookService.getUserStorageInfo(user.id);
  }

  @Get('storage/optimization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get storage optimization suggestions' })
  @ApiResponse({ status: 200, description: 'Returns storage optimization suggestions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStorageOptimization(@CurrentUser() user: User) {
    return await this.bookService.getStorageOptimizationSuggestions(user.id);
  }

  @Post('storage/check-upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if user can upload a file of given size' })
  @ApiBody({ 
    description: 'File size to check',
    schema: {
      type: 'object',
      properties: {
        fileSizeBytes: { 
          type: 'number',
          description: 'Size of file to upload in bytes'
        }
      },
      required: ['fileSizeBytes']
    }
  })
  @ApiResponse({ status: 200, description: 'Returns upload capability check' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkUploadCapability(@CurrentUser() user: User, @Body() body: { fileSizeBytes: number }) {
    return await this.bookService.canUserUploadFile(user.id, body.fileSizeBytes);
  }

  @Get('activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user activity summary' })
  @ApiResponse({ status: 200, description: 'Returns user activity summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserActivity(@CurrentUser() user: User) {
    return await this.bookService.getUserActivitySummary(user.id);
  }
}