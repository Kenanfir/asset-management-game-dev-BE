# Development Guide

This guide covers everything you need to know to develop and contribute to the Asset Management Game Dev Backend.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20 or higher ([Download](https://nodejs.org/))
- **pnpm**: v8 or higher (`npm install -g pnpm`)
- **PostgreSQL**: v13 or higher ([Download](https://www.postgresql.org/download/))
- **Redis** (optional): v6 or higher ([Download](https://redis.io/download))
- **Git**: Latest version ([Download](https://git-scm.com/downloads))

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd asset-management-game-dev-BE
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/asset_manager_dev"

# Session
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Application URLs
APP_BASE_URL="http://localhost:4000"
FRONTEND_ORIGIN="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Storage
STORAGE_ROOT="./var/data/uploads"

# Optional
LOG_LEVEL=debug
REDIS_URL="redis://localhost:6379"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations
pnpm prisma:migrate

# Seed the database with sample data
pnpm prisma:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

The API will be available at:
- **API**: `http://localhost:4000/api/v1`
- **Health Check**: `http://localhost:4000/api/v1/health`
- **Swagger Docs**: `http://localhost:4000/docs`

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
pnpm dev

# Development mode (alternative)
pnpm start:dev

# Debug mode
pnpm start:debug

# Production mode
pnpm build
pnpm start:prod
```

### Database Management

```bash
# Generate Prisma client
pnpm prisma:generate

# Create a new migration
pnpm prisma:migrate

# Deploy migrations (production)
pnpm prisma:deploy

# Seed database
pnpm prisma:seed

# Open Prisma Studio (database GUI)
pnpm prisma:studio
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e

# Run tests with coverage
pnpm test:cov
```

### API Documentation

```bash
# Generate OpenAPI specification
pnpm openapi:emit

# Generate TypeScript client
pnpm client:gen
```

## Project Structure

Follow the layered architecture:

```
src/
├── controllers/    # API route handlers
├── services/       # Business logic
├── validations/    # DTOs and validation
├── modules/        # NestJS dependency injection
└── common/         # Shared utilities
```

See [Project Structure](./project-structure.md) for detailed information.

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode in `tsconfig.json`
- Define explicit return types for functions
- Use interfaces for object shapes
- Prefer `const` over `let`, avoid `var`

### Naming Conventions

- **Files**: kebab-case (e.g., `auth.service.ts`)
- **Classes**: PascalCase (e.g., `AuthService`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `IAuthService`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)

### Code Organization

1. **Controllers**:
   - Thin layer, delegate to services
   - Use DTOs for validation
   - Return plain objects (interceptor handles formatting)

2. **Services**:
   - Contain business logic
   - Use dependency injection
   - Return domain objects, not DTOs

3. **DTOs**:
   - Use class-validator decorators
   - Document with Swagger decorators
   - Keep DTOs in `validations/` directory

### Error Handling

```typescript
// Use NestJS built-in exceptions
throw new BadRequestException('Invalid input');
throw new NotFoundException('User not found');
throw new UnauthorizedException('Invalid credentials');

// For custom errors, extend HttpException
export class CustomException extends HttpException {
  constructor() {
    super('Custom error message', HttpStatus.BAD_REQUEST);
  }
}
```

### Logging

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Info message');
    this.logger.warn('Warning message');
    this.logger.error('Error message', error.stack);
    this.logger.debug('Debug message');
  }
}
```

## Adding a New Feature

### 1. Create a Module

```bash
# Example: Creating a "notifications" feature
mkdir -p src/controllers
mkdir -p src/services
mkdir -p src/validations/notifications
mkdir -p src/modules/notifications
```

### 2. Create Controller

```typescript
// src/controllers/notifications.controller.ts
import { Controller, Get } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }
}
```

### 3. Create Service

```typescript
// src/services/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.notification.findMany();
  }
}
```

### 4. Create DTO

```typescript
// src/validations/notifications/create-notification.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message: string;
}
```

### 5. Create Module

```typescript
// src/modules/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { NotificationsController } from '../../controllers/notifications.controller';
import { NotificationsService } from '../../services/notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

### 6. Register Module

```typescript
// src/app.module.ts
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // ... other modules
    NotificationsModule,
  ],
})
export class AppModule {}
```

### 7. Update Database Schema

```prisma
// prisma/schema.prisma
model Notification {
  id        String   @id @default(cuid())
  title     String
  message   String
  read      Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

```bash
# Create and run migration
pnpm prisma:migrate
```

## Debugging

### VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["start:debug"],
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Logging

Set `LOG_LEVEL=debug` in `.env` for verbose logging.

## Testing Guidelines

### Unit Tests

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find user by id', async () => {
    const mockUser = { id: '1', login: 'test' };
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

    const result = await service.findById('1');
    expect(result).toEqual(mockUser);
  });
});
```

### E2E Tests

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    const response = await fetch('http://localhost:4000/api/v1/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.content.ok).toBe(true);
  });
});
```

## Common Tasks

### Adding a New Endpoint

1. Add route to controller
2. Implement service method
3. Create DTOs for request/response
4. Add Swagger documentation
5. Write tests
6. Update API contracts documentation

### Database Changes

1. Update Prisma schema
2. Create migration: `pnpm prisma:migrate`
3. Update seed data if needed
4. Test migration on clean database

### Debugging Background Jobs

```typescript
// Enable job logging
this.logger.log(`Processing job ${job.id}`);

// Check job status
const job = await this.uploadQueue.getJob(jobId);
console.log(job.progress, job.failedReason);
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U username -d asset_manager_dev
```

### Redis Connection Issues

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
pnpm prisma:generate
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Fastify Documentation](https://www.fastify.io/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [BullMQ Guide](https://docs.bullmq.io/)

## Getting Help

- Check existing documentation
- Search GitHub issues
- Ask in team chat
- Create a new issue with:
  - Description of the problem
  - Steps to reproduce
  - Expected vs actual behavior
  - Error messages and logs
