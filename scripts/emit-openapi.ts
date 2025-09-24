import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function emitOpenAPI() {
    console.log('🚀 Starting OpenAPI generation...');

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: false }),
    );

    // Configure Swagger
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

    // Write OpenAPI JSON
    const outputPath = join(process.cwd(), 'openapi.json');
    writeFileSync(outputPath, JSON.stringify(document, null, 2));

    console.log(`✅ OpenAPI specification written to: ${outputPath}`);

    await app.close();
}

emitOpenAPI().catch((error) => {
    console.error('❌ Failed to generate OpenAPI:', error);
    process.exit(1);
});
