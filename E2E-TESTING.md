# E2E Testing Framework Documentation

## Overview

This project uses **Playwright** for comprehensive end-to-end testing. The testing framework covers all major features of the EBook Reader application including:

- Book upload and management
- Search functionality 
- Library management
- PDF viewing
- UI/UX and responsiveness
- API integration

## Setup

### Prerequisites
- Node.js (v16 or higher)
- Both backend and frontend servers should be available

### Installation
```bash
# Install all dependencies (including E2E test dependencies)
npm run install:all

# Install Playwright browsers (if not already installed)
npx playwright install
```

## Running Tests

### Basic Commands
```bash
# Run all tests (headless)
npm test

# Run tests with browser UI visible
npm run test:headed

# Run tests with Playwright UI mode (interactive)
npm run test:ui

# Debug tests (opens browser devtools)
npm run test:debug

# Generate tests by recording interactions
npm run test:codegen

# View test reports
npm run test:report
```

### Development Workflow
```bash
# Start both backend and frontend servers
npm run dev:both

# In another terminal, run tests
npm test
```

## Test Structure

### Test Files
- `book-upload.spec.ts` - Book upload and management functionality
- `search.spec.ts` - Global search and content search features
- `library.spec.ts` - Library management and book display
- `pdf-viewer.spec.ts` - PDF viewing and navigation
- `ui-theme.spec.ts` - UI/UX, themes, and responsiveness
- `api-integration.spec.ts` - Backend API integration tests

### Test Fixtures
- `fixtures.ts` - Shared test utilities and helper functions
- `fixtures/` - Test data and sample files

## Test Categories

### 🔄 **Book Upload Tests**
- File upload functionality
- Metadata extraction and display
- Error handling for invalid files
- Upload progress and success states

### 🔍 **Search Tests**
- Global search modal functionality
- Content search with snippets
- Search debouncing and performance
- Keyboard shortcuts (Ctrl+K)
- Search result relevance scoring

### 📚 **Library Tests**
- Book list display and management
- Book metadata presentation
- Library toggling and state management
- Responsive design on different screen sizes

### 📖 **PDF Viewer Tests**
- PDF loading and display
- Page navigation (next/prev/keyboard)
- Zoom controls and fit-to-page
- Reading progress persistence
- Error handling for corrupted PDFs

### 🎨 **UI/Theme Tests**
- Theme switching (if implemented)
- Responsive design across viewports
- Accessibility compliance
- Keyboard navigation
- Performance under load

### 🔗 **API Integration Tests**
- REST API endpoint testing
- Request/response validation
- Error handling and status codes
- CORS configuration
- Concurrent request handling

## Configuration

### Playwright Config (`playwright.config.ts`)
- **Browsers**: Chrome, Firefox, Safari, Mobile browsers
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure only
- **Videos**: Retained on failure
- **Traces**: On first retry

### Test Environment
- **Frontend**: http://localhost:4200
- **Backend**: http://localhost:3000
- **Auto-start servers**: Configured in playwright.config.ts

## Best Practices

### Writing Tests
```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, waitForBackend }) => {
    await page.goto('/');
    await waitForBackend();
  });

  test('should do something specific', async ({ page }) => {
    // Arrange
    await page.click('button:has-text("Action")');
    
    // Act
    await page.fill('input', 'test value');
    
    // Assert
    await expect(page.locator('.result')).toContainText('expected');
  });
});
```

### Test Data Management
- Use `uploadTestPdf()` fixture for consistent test data
- Clean up test data after each test
- Use unique identifiers to avoid test interference

### Assertions
- Use Playwright's built-in assertions with auto-retry
- Test both positive and negative scenarios
- Verify UI state changes after actions

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Common Issues

**Tests failing with connection refused:**
```bash
# Make sure both servers are running
npm run dev:both
```

**Browser launch failures:**
```bash
# Reinstall browsers
npx playwright install --force
```

**Test timeouts:**
- Increase timeout in `playwright.config.ts`
- Check server startup time
- Verify network connectivity

**Flaky tests:**
- Use proper wait strategies (`waitForSelector`, `waitForResponse`)
- Avoid `page.waitForTimeout()` except for specific cases
- Implement proper cleanup in `afterEach` hooks

### Debug Mode
```bash
# Run single test in debug mode
npx playwright test search.spec.ts --debug

# Run specific test with browser visible
npx playwright test --headed --grep "should upload PDF"
```

## Reporting

### HTML Report
- Generated automatically after test runs
- View with: `npm run test:report`
- Includes screenshots, videos, traces

### CI Reports
- JUnit XML for CI integration
- JSON format for custom processing
- Screenshots and videos attached to failed tests

## Future Enhancements

### Planned Improvements
- [ ] Visual regression testing with screenshot comparison
- [ ] Performance testing with Lighthouse integration
- [ ] Accessibility testing with axe-core
- [ ] Cross-browser compatibility matrix
- [ ] Load testing for concurrent users
- [ ] Database state management for isolated tests

### Custom Fixtures
```typescript
// Example: Database cleanup fixture
export const test = base.extend<TestFixtures>({
  cleanDatabase: async ({}, use) => {
    await use(async () => {
      await fetch('http://localhost:3000/test/cleanup', { method: 'POST' });
    });
  }
});
```

## Contributing

When adding new features:
1. Add corresponding E2E tests
2. Update test documentation
3. Ensure tests pass in all browsers
4. Add appropriate test fixtures if needed

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Test Patterns](https://playwright.dev/docs/test-patterns)