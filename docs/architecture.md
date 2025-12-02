# Architecture

This document describes the system architecture and design patterns used in the Asset Management Game Dev Backend.

## System Overview

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────────────┐
│        NestJS Application           │
│  ┌───────────────────────────────┐  │
│  │   Controllers (API Layer)     │  │
│  └───────┬───────────────────────┘  │
│          │                           │
│  ┌───────▼───────────────────────┐  │
│  │   Services (Business Logic)   │  │
│  └───────┬───────────────────────┘  │
│          │                           │
│          ├──────────┬────────────┐   │
│          │          │            │   │
│    ┌─────▼─────┐ ┌──▼──────┐ ┌──▼────┐
│    │  Prisma   │ │  Queue  │ │Storage│
│    │  Service  │ │ Service │ │Service│
│    └─────┬─────┘ └──┬──────┘ └──┬────┘
└──────────┼──────────┼───────────┼─────┘
           │          │           │
     ┌─────▼─────┐ ┌──▼──────┐ ┌─▼──────┐
     │PostgreSQL │ │  Redis  │ │  File  │
     │ Database  │ │  (Bull) │ │ System │
     └───────────┘ └─────────┘ └────────┘
```

## Technology Stack

### Core Framework
- **NestJS**: Progressive Node.js framework with TypeScript support
- **Fastify**: High-performance HTTP server (instead of Express)
- **TypeScript**: Type-safe development

### Data Layer
- **PostgreSQL**: Relational database for structured data
- **Prisma ORM**: Type-safe database client with migrations
- **Redis**: In-memory data store for sessions and queues (optional, falls back to in-memory)

### Authentication & Security
- **Passport**: Authentication middleware
- **GitHub OAuth 2.0**: Third-party authentication
- **JWT**: Session tokens (server-side validation)
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **CSRF Protection**: State parameter validation

### Background Processing
- **BullMQ**: Redis-based job queue for file processing
- **Worker Pattern**: Separate worker processes for async tasks

### File Handling
- **Multer**: Multipart/form-data handling
- **file-type**: MIME type detection
- **File System**: Local storage with S3/GCS adapter support

### Logging & Monitoring
- **Pino**: Fast JSON logger
- **pino-pretty**: Development-friendly log formatting
- **Request ID**: Correlation IDs for request tracking

### API Documentation
- **Swagger/OpenAPI**: Auto-generated API docs
- **openapi-typescript**: Generate TypeScript clients from spec

## Architectural Patterns

### 1. Layered Architecture

```
Presentation Layer (Controllers)
        ↓
Business Logic Layer (Services)
        ↓
Data Access Layer (Prisma/Repositories)
        ↓
Database
```

**Benefits:**
- Clear separation of concerns
- Easy to test each layer independently
- Improved maintainability

### 2. Dependency Injection

NestJS uses IoC (Inversion of Control) container:

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
  ) {}
}
```

**Benefits:**
- Loose coupling between components
- Easy to mock dependencies for testing
- Centralized configuration

### 3. Repository Pattern (via Prisma)

Prisma acts as a repository abstraction:

```typescript
// Service uses Prisma as repository
await this.prisma.user.findUnique({
  where: { id: userId }
});
```

**Benefits:**
- Database-agnostic business logic
- Type-safe queries
- Auto-generated migrations

### 4. Queue Pattern (Async Processing)

File uploads are processed asynchronously:

```
Client → Controller → Service → Queue
                               ↓
                          Background Worker
                               ↓
                     Process & Store Files
                               ↓
                      Update Database
```

**Benefits:**
- Non-blocking API responses
- Resilient to failures (retry logic)
- Scalable processing

### 5. Middleware Pipeline

Request processing flow:

```
Request
  → CORS
  → Helmet (Security Headers)
  → Request ID
  → Logger
  → Rate Limiter
  → Body Parser
  → Authentication (Passport)
  → Controller
  → Service
  → Response Interceptor
  → Exception Filter
  → Response
```

### 6. Guard Pattern (Authorization)

Routes are protected with guards:

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('me')
getMe(@User() user: AuthenticatedUser) {
  return user;
}
```

**Benefits:**
- Centralized authorization logic
- Declarative route protection
- Easy to extend

## Data Flow

### 1. Authentication Flow

```
┌────────┐     1. Start OAuth    ┌─────────────┐
│ Client ├────────────────────────► Backend API │
└────────┘                        └──────┬──────┘
                                         │ 2. Redirect
                                         ▼
                                  ┌─────────────┐
                                  │   GitHub    │
                                  └──────┬──────┘
                                         │ 3. Callback + Code
┌────────┐                        ┌──────▼──────┐
│ Client │◄───────────────────────┤ Backend API │
└────────┘  5. Redirect + Cookie  └──────┬──────┘
                                         │ 4. Exchange Code
                                         │    for Token
                                  ┌──────▼──────┐
                                  │   GitHub    │
                                  └─────────────┘
```

### 2. File Upload Flow

```
┌────────┐   1. POST /uploads    ┌─────────────┐
│ Client ├────────────────────────► Upload API  │
└────────┘                        └──────┬──────┘
                                         │ 2. Validate Files
                                         │ 3. Create Job
                                         ▼
                                  ┌─────────────┐
                                  │ BullMQ Queue│
                                  └──────┬──────┘
                                         │
┌────────┐  4. Return Job ID     ┌──────▼──────┐
│ Client │◄───────────────────────┤ Upload API  │
└────────┘                        └─────────────┘

                                  Background Worker
                                  ┌─────────────┐
                                  │  Processor  │
                                  └──────┬──────┘
                                         │ 5. Process Files
                                         │ 6. Store Files
                                         │ 7. Update DB
                                         ▼
                                  ┌─────────────┐
                                  │  Database   │
                                  └─────────────┘
```

### 3. Request/Response Flow

```
Request
  ↓
Controller (Validation via DTO)
  ↓
Service (Business Logic)
  ↓
Prisma (Database Query)
  ↓
Service (Data Transformation)
  ↓
Controller (Return Data)
  ↓
Response Interceptor (Format Response)
  ↓
Response: { message, content, errors }
```

## Security Architecture

### 1. Authentication

- **OAuth Flow**: Server-side GitHub OAuth 2.0
- **Session Management**: Server-side sessions (in-memory or Redis)
- **CSRF Protection**: State parameter validation
- **Cookie Security**: httpOnly, secure, sameSite flags

### 2. Authorization

- **Route Guards**: JWT-based authentication guard
- **User Decorator**: Extract authenticated user from request
- **Session Validation**: Verify user exists in database

### 3. Input Validation

- **DTOs**: class-validator decorators
- **Pipe**: ValidationPipe for automatic validation
- **File Validation**: MIME type detection, size limits

### 4. Rate Limiting

- **Throttler**: 100 requests/minute per IP
- **Endpoint-specific**: Custom limits for sensitive endpoints

### 5. Security Headers

- **Helmet**: Content Security Policy, X-Frame-Options, etc.
- **CORS**: Configured allowed origins

## Database Schema Design

### Entity Relationships

```
User
  │
  └─── creates ──► Project
                      │
                      └─── contains ──► AssetGroup
                                           │
                                           ├─── contains ──► SubAsset
                                           │                    │
                                           │                    └─── has ──► AssetHistory
                                           │
                                           └─── referenced by ──► UploadJob
```

### Key Design Decisions

1. **UUID Primary Keys**: Better for distributed systems
2. **Soft Deletes**: Use `deletedAt` timestamp (not implemented yet)
3. **Audit Fields**: `createdAt`, `updatedAt` on all tables
4. **Versioning**: Track file history with separate `AssetHistory` table
5. **JSON Fields**: Use Prisma's `Json` type for flexible metadata

## Scalability Considerations

### Horizontal Scaling

- **Stateless API**: Session data in Redis (shared)
- **Load Balancer**: Distribute requests across instances
- **Database Connection Pool**: Limit concurrent connections

### Background Job Processing

- **Separate Workers**: Scale workers independently
- **Queue-based**: BullMQ handles distribution
- **Retry Logic**: Exponential backoff for failures

### File Storage

- **Local**: Development/small deployments
- **S3/GCS**: Production/large-scale deployments
- **CDN**: Serve static assets

### Caching Strategy

- **Redis**: Session data, queue jobs
- **Application Cache**: In-memory caching for rule packs
- **Database**: Prisma query caching

## Testing Strategy

### Unit Tests
- Test services in isolation
- Mock Prisma and external dependencies
- Focus on business logic

### Integration Tests
- Test controller + service integration
- Use test database
- Test API contracts

### E2E Tests
- Full request/response cycle
- Test authentication flow
- Test file upload flow

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         Load Balancer (NGINX)           │
└──────────────┬──────────────────────────┘
               │
    ┏━━━━━━━━━━┻━━━━━━━━━━┓
    ▼                     ▼
┌─────────┐           ┌─────────┐
│ API     │           │ API     │
│ Server  │           │ Server  │
│ (Node)  │           │ (Node)  │
└────┬────┘           └────┬────┘
     │                     │
     └──────────┬──────────┘
                │
       ┌────────┴────────┐
       ▼                 ▼
┌──────────┐      ┌──────────┐
│PostgreSQL│      │  Redis   │
│ Primary  │      │  Cluster │
└────┬─────┘      └──────────┘
     │
     ▼
┌──────────┐
│PostgreSQL│
│ Replica  │
└──────────┘
```

## Future Enhancements

1. **Caching Layer**: Redis caching for frequently accessed data
2. **Event Sourcing**: Track all state changes
3. **GraphQL**: Alternative API interface
4. **WebSockets**: Real-time updates for upload status
5. **Microservices**: Split large services into smaller services
6. **Service Mesh**: Istio/Linkerd for inter-service communication
