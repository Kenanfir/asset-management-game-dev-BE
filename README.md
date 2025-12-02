# Asset Management Game Dev Backend

A production-ready NestJS backend API for managing game development assets with secure authentication, file uploads, and path resolution.

## 🏗️ Architecture

- **Runtime**: Node.js 20+ with NestJS + Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis (in-memory fallback)
- **Storage**: Local filesystem (configurable, S3/GCS ready)
- **Auth**: GitHub OAuth with server-side sessions
- **Validation**: class-validator with Zod config validation
- **Documentation**: OpenAPI/Swagger with generated TypeScript client

## 📂 Project Structure

```
src/
├── common/         # Shared resources, decorators, filters, guards
├── config/         # Configuration files
├── modules/        # Feature modules (Business logic)
├── app.module.ts   # Root application module
└── main.ts         # Application entry point
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 13+
- Redis (optional, will use in-memory fallback)
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, SESSION_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed database with sample data
pnpm prisma:seed

# Start development server
pnpm dev
```

The API will be available at `http://localhost:4000` with documentation at `http://localhost:4000/docs`.

## 📋 Environment Variables

### Required

```env
NODE_ENV=development
PORT=4000
DATABASE_URL="postgresql://username:password@localhost:5432/asset_manager_dev"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"
APP_BASE_URL="http://localhost:4000"
FRONTEND_ORIGIN="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
STORAGE_ROOT="./var/data/uploads"
```

### Optional

```env
LOG_LEVEL=info
REDIS_URL="redis://localhost:6379"
CORS_EXTRA_ORIGINS="https://staging.example.com,https://preview.example.com"
```

## 🗄️ Database Schema

### Core Models

- **Project**: Game projects with repository links
- **AssetGroup**: Logical groupings of assets (sprites, audio, etc.)
- **SubAsset**: Individual assets with versioning and path templates
- **AssetHistory**: Version history for each sub-asset
- **UploadJob**: Background processing jobs for file uploads
- **User**: GitHub OAuth users

### Key Features

- Hierarchical asset organization
- Versioned file storage with path templates
- Background job processing
- Audit trail for all changes

## 🔐 Authentication

### GitHub OAuth Flow

1. **Start OAuth**: `GET /api/v1/auth/github/start`
   - Redirects to GitHub authorization
   - Stores CSRF state server-side

2. **OAuth Callback**: `GET /api/v1/auth/github/callback`
   - Exchanges code for access token (server-side)
   - Creates/updates user record
   - Sets httpOnly session cookie
   - Redirects to frontend

3. **Session Management**: 
   - Server-side sessions stored in memory (Redis-ready)
   - Session ID in `sid` cookie (httpOnly, secure, sameSite=none)
   - 7-day session lifetime

### Security Features

- CSRF protection via state parameter
- Secure cookie configuration
- No client-side token exposure
- Rate limiting on auth endpoints

## 📁 File Upload & Processing

### Upload Flow

1. **Upload Files**: `POST /api/v1/uploads`
   - Multipart form data with files and metadata
   - File validation (MIME type, size limits)
   - Creates upload job and queues for processing

2. **Background Processing**:
   - Files stored in versioned directory structure
   - Asset history entries created
   - Sub-asset versions incremented
   - Database updated in transactions

3. **Job Status**: `GET /api/v1/uploads/:id`
   - Real-time job status and progress
   - Error details if processing fails

### File Validation

- **Supported Types**: PNG, JPEG, GIF, WebP, MP3, OGG, WAV, GLTF, FBX
- **Size Limits**: 10MB per file, 10 files max per upload
- **MIME Detection**: Server-side validation using file-type
- **Path Safety**: Prevents directory traversal attacks

## 🛠️ API Endpoints

### Health & Status
- `GET /api/v1/health` - Service health check

### Authentication
- `GET /api/v1/auth/github/start` - Start GitHub OAuth
- `GET /api/v1/auth/github/callback` - OAuth callback
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/me` - Get current user

### Projects
- `GET /api/v1/projects` - List all projects
- `GET /api/v1/projects/:id` - Get project details
- `GET /api/v1/projects/:id/assets` - Get project assets (paginated)

### Assets
- `GET /api/v1/assets/groups` - List asset groups
- `GET /api/v1/assets/sub-assets` - List sub-assets
- `GET /api/v1/assets/sub-assets/:id/history` - Get version history

### Uploads
- `POST /api/v1/uploads` - Upload files
- `GET /api/v1/uploads/:id` - Get upload job status

### Path Resolution
- `POST /api/v1/path/resolve` - Resolve asset path from template

### Rule Packs
- `GET /api/v1/rule-packs` - Get available validation rules

## � Response Format

### Success Response

Most endpoints return the data directly as a JSON object.

```json
{
  "ok": true,
  "version": "1.0.0",
  "timestamp": "2023-11-30T12:00:00.000Z"
}
```

### Error Response

Errors are returned in a standardized format wrapped in an `error` object.

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    },
    "requestId": "req-1234567890"
  }
}
```

## �🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                 # Start with hot reload
pnpm start:dev          # Start development server
pnpm start:debug        # Start with debugging

# Building
pnpm build              # Build for production
pnpm start:prod         # Start production server

# Database
pnpm prisma:generate    # Generate Prisma client
pnpm prisma:migrate     # Run migrations
pnpm prisma:deploy      # Deploy migrations (production)
pnpm prisma:seed        # Seed database
pnpm prisma:studio      # Open Prisma Studio

# API Documentation
pnpm openapi:emit       # Generate OpenAPI JSON
pnpm client:gen         # Generate TypeScript client

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Run tests in watch mode
pnpm test:e2e           # Run e2e tests
pnpm test:cov           # Run tests with coverage

# Code Quality
pnpm lint               # Run ESLint
pnpm format             # Format code with Prettier
pnpm type-check         # Run TypeScript type checking
```

### Testing

```bash
# Run all tests
pnpm test

# Run e2e tests
pnpm test:e2e

# Test specific endpoint
curl -i http://localhost:4000/api/v1/health
curl -i http://localhost:4000/api/v1/projects
```

## 📚 Frontend Integration

### CORS Configuration

The API is configured to accept requests from your frontend origin with credentials:

```typescript
// Frontend fetch example
const response = await fetch('http://localhost:4000/api/v1/me', {
  credentials: 'include', // Important: include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Session Management

- Sessions are managed via httpOnly cookies
- Include `credentials: 'include'` in all requests
- Handle 401 responses by redirecting to login

### Upload Example

```typescript
const formData = new FormData();
formData.append('targetSubassetIds', JSON.stringify(['sub-asset-1']));
formData.append('mode', 'single');
formData.append('files', fileInput.files[0]);

const response = await fetch('http://localhost:4000/api/v1/uploads', {
  method: 'POST',
  credentials: 'include',
  body: formData,
});
```

## 🚀 Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `SESSION_SECRET` (32+ characters)
3. Configure production database URL
4. Set up Redis for session storage
5. Configure proper CORS origins

### Security Considerations

- Enable HTTPS in production
- Use secure cookie settings
- Implement rate limiting
- Monitor for suspicious activity
- Regular security updates

### Scaling

- Use Redis for session storage
- Implement horizontal scaling
- Use external storage (S3/GCS)
- Monitor queue processing
- Database connection pooling

## 📖 Generated Client

After running `pnpm openapi:emit && pnpm client:gen`, you'll have a fully typed TypeScript client:

```typescript
import { AssetManagementApiClient } from './client';

const client = new AssetManagementApiClient({
  baseUrl: 'http://localhost:4000/api/v1',
  credentials: 'include',
});

// Fully typed API calls
const projects = await client.projectsControllerFindAll();
const health = await client.appControllerGetHealth();
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and DATABASE_URL is correct
2. **GitHub OAuth**: Verify CLIENT_ID and CLIENT_SECRET are correct
3. **File Uploads**: Check STORAGE_ROOT directory exists and is writable
4. **CORS Issues**: Ensure FRONTEND_ORIGIN matches your frontend URL

### Logs

The application uses structured logging with request IDs. Check logs for detailed error information:

```bash
# Development logs
pnpm dev

# Production logs
NODE_ENV=production pnpm start:prod
```

## 🤝 Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass

## 📄 License

This project is licensed under the MIT License.