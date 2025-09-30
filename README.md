# EBook Reader

Modern ebook reader Progressive Web App built with Angular and NestJS, following Domain-Driven Design (DDD) principles.

## Features

- **PDF Support**: View and read PDF files with smooth navigation
- **Progress Tracking**: Automatic saving of reading progress (page, scroll position)
- **Progressive Web App**: Installable PWA that works offline
- **Cross-Platform**: Works on any device with a modern browser
- **Clean Architecture**: DDD-based backend with layered architecture
- **Modern UI**: Responsive Angular interface with PWA capabilities
- **TypeScript**: Full TypeScript support for type safety

## Project Structure

```
ebook-reader/
├── backend/              # NestJS Backend (DDD Architecture)
│   ├── src/
│   │   ├── domain/       # Domain Layer
│   │   │   ├── entities/
│   │   │   ├── repositories/
│   │   │   └── services/
│   │   ├── application/  # Application Layer
│   │   │   ├── dtos/
│   │   │   ├── services/
│   │   │   └── use-cases/
│   │   ├── infrastructure/  # Infrastructure Layer
│   │   │   ├── database/
│   │   │   └── repositories/
│   │   └── presentation/    # Presentation Layer
│   │       └── controllers/
│   └── package.json
└── frontend/             # Angular PWA Frontend
    ├── src/
    │   ├── app/
    │   │   ├── components/
    │   │   └── services/
    │   └── main.ts
    ├── electron.js       # Electron main process
    ├── preload.js        # Electron preload script
    └── package.json
```

## Technology Stack

### Backend
- **NestJS**: Node.js framework for building scalable applications
- **TypeORM**: Object-Relational Mapping for TypeScript/JavaScript
- **SQLite**: Lightweight database for local storage
- **Domain-Driven Design**: Clean architecture principles

### Frontend
- **Angular 20**: Modern web framework with TypeScript
- **PWA**: Progressive Web App with offline capabilities
- **ng2-pdf-viewer**: PDF viewing component
- **Angular Service Worker**: Caching and offline support
- **RxJS**: Reactive programming with observables

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ebook-reader
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Development

1. **Start the Backend**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend runs on http://localhost:3000

2. **Start the Frontend (Web)**
   ```bash
   cd frontend
   npm start
   ```
   Frontend runs on http://localhost:4200

3. **Build and Serve PWA**
   ```bash
   cd frontend
   npm run build:prod
   npm run serve:dist
   ```

### Building for Production

1. **Build Backend**
   ```bash
   cd backend
   npm run build
   ```

2. **Build PWA for Production**
   ```bash
   cd frontend
   npm run build:prod
   ```

## API Documentation

The backend provides a REST API with the following endpoints:

- `GET /books` - Get all books
- `GET /books/:id` - Get book by ID
- `POST /books` - Add new book
- `PUT /books/:id/progress` - Update reading progress
- `GET /books/search/title?q={query}` - Search by title
- `GET /books/search/author?q={query}` - Search by author

API documentation is available at http://localhost:3000/api when running in development.

## Domain Models

### Book Entity
- ID, title, author, file path
- File size, MIME type, total pages
- Timestamps (added, last opened)

### Reading Progress Entity
- Current page, scroll position
- Progress percentage, reading time
- Last updated timestamp

## Testing

### Backend Tests
```bash
cd backend
npm run test              # Unit tests
npm run test:cov         # Coverage report
npm run test:e2e         # End-to-end tests
```

### Frontend Tests
```bash
cd frontend
npm run test             # Unit tests
```

## Code Quality

- **ESLint**: Code linting for both frontend and backend
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

### Run Linting
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

## Database

The application uses SQLite for local storage with TypeORM for ORM functionality. Database file is automatically created as `ebook-reader.db` in the backend directory.

## Future Enhancements

- [ ] Support for EPUB format
- [ ] Bookmarks and annotations
- [ ] Full-text search within books
- [ ] Reading statistics and analytics
- [ ] Cloud sync for reading progress
- [ ] Multiple library management
- [ ] Dark/light theme toggle
- [ ] Export reading notes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.