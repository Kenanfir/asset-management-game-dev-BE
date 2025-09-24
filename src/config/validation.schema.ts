import { z } from 'zod';

export const ConfigValidationSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().min(1).max(65535).default(4000),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

    // Database
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

    // Redis (optional)
    REDIS_URL: z.string().optional(),

    // Session & Security
    SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

    // Application URLs
    APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL'),
    FRONTEND_ORIGIN: z.string().url('FRONTEND_ORIGIN must be a valid URL'),
    CORS_EXTRA_ORIGINS: z.string().optional(),

    // GitHub OAuth
    GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
    GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),

    // Storage
    STORAGE_ROOT: z.string().min(1, 'STORAGE_ROOT is required'),
});
