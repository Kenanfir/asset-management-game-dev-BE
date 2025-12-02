import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: false }),
    );

    // Register Fastify plugins for cookie and file upload support
    // @ts-expect-error - Type mismatch due to how NestJS wraps Fastify instance, but works at runtime
    await app.register(fastifyCookie);
    // @ts-expect-error - Type mismatch due to how NestJS wraps Fastify instance, but works at runtime
    await app.register(fastifyMultipart);

    const configService = app.get(ConfigService);
    const logger = new Logger('Bootstrap');

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: false, // Disable for API
        crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    const frontendOrigin = configService.get('FRONTEND_ORIGIN');
    const extraOrigins = configService.get('CORS_EXTRA_ORIGINS', '');
    const allowedOrigins = [frontendOrigin];

    if (extraOrigins) {
        allowedOrigins.push(...extraOrigins.split(',').map(origin => origin.trim()));
    }

    app.enableCors({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        optionsSuccessStatus: 200,
    });

    // Global prefix
    app.setGlobalPrefix('api/v1');

    // Request ID middleware
    app.use(new RequestIdMiddleware().use);

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Global response interceptor
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Swagger documentation (dev only)
    if (configService.get('NODE_ENV') === 'development') {
        const config = new DocumentBuilder()
            .setTitle('Asset Management API')
            .setDescription('Backend API for Asset Management Game Dev Tool')
            .setVersion('1.0')
            .addBearerAuth()
            .addCookieAuth('sid', {
                type: 'apiKey',
                in: 'cookie',
                name: 'sid',
            })
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }

    const port = configService.get('PORT', 4000);
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 API Documentation: http://localhost:${port}/docs`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
