# Asset Management Game Dev Backend Documentation

Welcome to the Asset Management Game Dev Backend API documentation. This is a NestJS/TypeScript backend application built with NestJS, Fastify, Prisma ORM, and PostgreSQL.

## 📚 Documentation Index

- [API Contracts](./contracts.md) - API endpoint specifications and request/response formats
- [Project Structure](./project-structure.md) - Overview of the codebase organization
- [Architecture](./architecture.md) - System design and architectural patterns
- [Development Guide](./development.md) - Setup and development workflow

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   pnpm prisma:seed
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

## 🛠 Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: NestJS with Fastify
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis (in-memory fallback)
- **Authentication**: GitHub OAuth with server-side sessions
- **Security**: Helmet, CORS, CSRF protection
- **Logging**: Pino with pretty printing
- **Storage**: Local filesystem (S3/GCS ready)
- **Development**: Hot reload with NestJS

## 📋 Features

- ✅ GitHub OAuth authentication
- ✅ Session-based authorization with JWT
- ✅ File upload with validation
- ✅ Background job processing with BullMQ
- ✅ Path resolution for game assets
- ✅ Asset versioning and history
- ✅ Request validation with class-validator
- ✅ Standardized API responses
- ✅ Error handling middleware
- ✅ Structured logging
- ✅ Database migrations with Prisma
- ✅ OpenAPI/Swagger documentation
- ✅ TypeScript for type safety

## 🔗 API Base URL

- **Development**: `http://localhost:4000/api/v1`
- **Health Check**: `GET /api/v1/health`
- **API Docs**: `http://localhost:4000/docs`

## 🎯 Core Concepts

### Projects
Game development projects that contain asset groups and sub-assets. Each project can have a GitHub repository link.

### Asset Groups
Logical groupings of related assets (e.g., "Player Sprites", "Background Music"). Each group belongs to a project and has a type (sprites, audio, models).

### Sub-Assets
Individual assets within a group. Each sub-asset has:
- Version control with history tracking
- Path templates for organizing files
- Rule packs for validation
- Base path for storage location

### Upload Jobs
Background processing jobs for handling file uploads with:
- Queued, processing, done, and error states
- File validation against rule packs
- Automatic version increment
- Detailed job tracking

---

*For detailed information, please refer to the specific documentation files listed above.*
