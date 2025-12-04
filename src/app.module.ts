import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AssetsModule } from './modules/assets/assets.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PathModule } from './modules/path/path.module';
import { RulesModule } from './modules/rules/rules.module';
import { QueueModule } from './modules/queue/queue.module';
import { StorageModule } from './modules/storage/storage.module';
import { ConfigValidationSchema } from './config/validation.schema';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            validate: (config) => {
                const result = ConfigValidationSchema.safeParse(config);
                if (!result.success) {
                    const errors = result.error.errors.map((error) => {
                        return `${error.path.join('.')}: ${error.message}`;
                    });
                    throw new Error(`Config validation error: ${errors.join(', ')}`);
                }
                return result.data;
            },
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.LOG_LEVEL || 'info',
                transport: process.env.NODE_ENV === 'development' ? {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        singleLine: true,
                    },
                } : undefined,
                serializers: {
                    req: (req) => ({
                        id: req.id,
                        method: req.method,
                        url: req.url,
                        headers: {
                            'user-agent': req.headers['user-agent'],
                            'content-type': req.headers['content-type'],
                        },
                    }),
                    res: (res) => ({
                        statusCode: res.statusCode,
                        headers: {
                            'content-type': res.headers['content-type'],
                        },
                    }),
                },
            },
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000, // 1 minute
                limit: 100, // 100 requests per minute
            },
        ]),
        PrismaModule,
        AuthModule,
        ProjectsModule,
        AssetsModule,
        UploadsModule,
        PathModule,
        RulesModule,
        QueueModule,
        StorageModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
