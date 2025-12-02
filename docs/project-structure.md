# Project Structure

This document describes the organization of the Asset Management Game Dev Backend codebase.

## Directory Layout

```
asset-management-game-dev-BE/
├── prisma/                  # Database schema and migrations
│   ├── migrations/          # Database migration files
│   ├── schema.prisma        # Prisma schema definition
│   └── seed.ts             # Database seeding script
│
├── scripts/                 # Utility scripts
│   ├── emit-openapi.ts     # Generate OpenAPI specification
│   └── generate-client.ts  # Generate TypeScript client
│
├── src/                     # Source code
│   ├── common/             # Shared resources
│   │   ├── decorators/     # Custom decorators (e.g., @User)
│   │   ├── filters/        # Exception filters (e.g., GlobalExceptionFilter)
│   │   ├── guards/         # Route guards (e.g., AuthGuard)
│   │   ├── interceptors/   # Response interceptors (e.g., ResponseInterceptor)
│   │   └── middleware/     # Custom middleware (e.g., RequestIdMiddleware)
│   │
│   ├── config/             # Configuration
│   │   └── validation.schema.ts  # Environment validation schema
│   │
│   ├── controllers/        # API Controllers (Route handlers)
│   │   ├── assets.controller.ts
│   │   ├── auth.controller.ts
│   │   ├── path.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── rules.controller.ts
│   │   └── uploads.controller.ts
│   │
│   ├── services/           # Business Logic Services
│   │   ├── assets.service.ts
│   │   ├── auth.service.ts
│   │   ├── file-validation.service.ts
│   │   ├── path.service.ts
│   │   ├── prisma.service.ts
│   │   ├── projects.service.ts
│   │   ├── queue.service.ts
│   │   ├── rules.service.ts
│   │   ├── session.service.ts
│   │   ├── storage.service.ts
│   │   ├── upload.processor.ts
│   │   └── uploads.service.ts
│   │
│   ├── validations/        # DTOs and Validation Schemas
│   │   ├── path/
│   │   │   ├── resolve-path.dto.ts
│   │   │   └── resolved-path.dto.ts
│   │   ├── projects/
│   │   │   ├── project.dto.ts
│   │   │   └── project-with-stats.dto.ts
│   │   ├── rules/
│   │   │   └── rule-pack.dto.ts
│   │   └── uploads/
│   │       ├── create-upload.dto.ts
│   │       └── upload-job.dto.ts
│   │
│   ├── modules/            # NestJS Modules (Dependency Injection Wiring)
│   │   ├── assets/
│   │   │   └── assets.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── decorators/
│   │   │   │   └── user.decorator.ts
│   │   │   ├── strategies/
│   │   │   │   ├── github.strategy.ts
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── types/
│   │   │       └── authenticated-user.type.ts
│   │   ├── path/
│   │   │   └── path.module.ts
│   │   ├── prisma/
│   │   │   └── prisma.module.ts
│   │   ├── projects/
│   │   │   └── projects.module.ts
│   │   ├── queue/
│   │   │   └── queue.module.ts
│   │   ├── rules/
│   │   │   └── rules.module.ts
│   │   ├── storage/
│   │   │   └── storage.module.ts
│   │   └── uploads/
│   │       └── uploads.module.ts
│   │
│   ├── app.controller.ts   # Root controller (health check)
│   ├── app.module.ts       # Root application module
│   ├── app.service.ts      # Root service
│   └── main.ts             # Application entry point
│
├── test/                    # Test files
│   ├── app.e2e.spec.ts     # End-to-end tests
│   └── vitest-e2e.config.ts # Vitest E2E configuration
│
├── .env                     # Environment variables (gitignored)
├── env.example              # Environment template
├── .eslintrc.js            # ESLint configuration
├── .prettierrc             # Prettier configuration
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Dependencies and scripts
├── pnpm-lock.yaml          # Lock file for pnpm
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Architecture Layers

### 1. Controllers Layer (`src/controllers/`)
- **Purpose**: Handle HTTP requests and responses
- **Responsibilities**:
  - Route definition and parameter extraction
  - Request validation (via DTOs)
  - Delegate business logic to services
  - Return formatted responses
- **Note**: Controllers should be thin and delegate all business logic to services

### 2. Services Layer (`src/services/`)
- **Purpose**: Contain business logic and data operations
- **Responsibilities**:
  - Implement core business rules
  - Database operations via Prisma
  - Interact with external services
  - Data transformation and validation
  - Background job processing
- **Note**: Services should be framework-agnostic and testable

### 3. Validations Layer (`src/validations/`)
- **Purpose**: Define data transfer objects (DTOs) and validation schemas
- **Responsibilities**:
  - Input validation using class-validator
  - Type definitions for API contracts
  - OpenAPI/Swagger documentation
- **Organized by feature**: Each feature has its own subdirectory

### 4. Modules Layer (`src/modules/`)
- **Purpose**: NestJS dependency injection wiring
- **Responsibilities**:
  - Import and configure providers
  - Export services for use in other modules
  - Wire controllers to services
- **Note**: Modules are for NestJS DI only, not business logic

### 5. Common Layer (`src/common/`)
- **Purpose**: Shared utilities and cross-cutting concerns
- **Includes**:
  - Decorators: Custom parameter decorators (e.g., `@User`)
  - Filters: Exception handling (e.g., `GlobalExceptionFilter`)
  - Guards: Route protection (e.g., `AuthGuard`)
  - Interceptors: Response transformation (e.g., `ResponseInterceptor`)
  - Middleware: Request processing (e.g., `RequestIdMiddleware`)

## Key Design Patterns

### Layered Architecture
The codebase follows a layered architecture pattern:
```
Controllers → Services → Data Access (Prisma)
     ↓           ↓
   DTOs      Business Logic
```

### Dependency Injection
- All services and controllers use NestJS dependency injection
- Dependencies are injected via constructor parameters
- Modules define the dependency graph

### Repository Pattern (via Prisma)
- Database access is centralized through `PrismaService`
- Services interact with the database via Prisma Client
- No direct SQL queries in business logic

### Queue Pattern (Background Jobs)
- File uploads are processed asynchronously via BullMQ
- `QueueService` handles job creation
- `UploadProcessor` processes jobs in the background

## File Naming Conventions

- **Controllers**: `*.controller.ts` (e.g., `auth.controller.ts`)
- **Services**: `*.service.ts` (e.g., `auth.service.ts`)
- **DTOs**: `*.dto.ts` (e.g., `create-upload.dto.ts`)
- **Modules**: `*.module.ts` (e.g., `auth.module.ts`)
- **Processors**: `*.processor.ts` (e.g., `upload.processor.ts`)
- **Strategies**: `*.strategy.ts` (e.g., `jwt.strategy.ts`)
- **Types**: `*.type.ts` (e.g., `authenticated-user.type.ts`)
- **Decorators**: `*.decorator.ts` (e.g., `user.decorator.ts`)
- **Guards**: `*.guard.ts` (e.g., `auth.guard.ts`)
- **Filters**: `*.filter.ts` (e.g., `global-exception.filter.ts`)
- **Interceptors**: `*.interceptor.ts` (e.g., `response.interceptor.ts`)

## Module Dependencies

```
AppModule
├── ConfigModule (global)
├── LoggerModule (global)
├── ThrottlerModule (global)
├── PrismaModule (global)
├── AuthModule
│   ├── PassportModule
│   └── JwtModule
├── ProjectsModule
├── AssetsModule
├── UploadsModule
│   ├── QueueModule
│   └── StorageModule
├── PathModule
├── RulesModule
├── QueueModule
└── StorageModule
```

## Testing Structure

- **Unit Tests**: Located alongside source files (e.g., `auth.service.spec.ts`)
- **E2E Tests**: Located in `test/` directory
- **Test Framework**: Vitest
- **Test Coverage**: Configured in `package.json`

## Build Output

- **Build Directory**: `dist/`
- **Build Tool**: NestJS CLI (uses TypeScript compiler)
- **Output**: Compiled JavaScript files with source maps
