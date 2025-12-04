import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from '../../services/queue.service';
import { UploadProcessor } from '../../services/upload.processor';
import { StorageModule } from '../storage/storage.module';
import { PathModule } from '../path/path.module';

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: () => {
                if (process.env.REDIS_URL) {
                    const url = new URL(process.env.REDIS_URL);
                    return {
                        connection: {
                            host: url.hostname,
                            port: parseInt(url.port),
                            username: url.username,
                            password: url.password,
                        },
                    };
                }
                return {
                    connection: undefined,
                    // Use in-memory fallback if no Redis URL
                    defaultJobOptions: {
                        removeOnComplete: 10,
                        removeOnFail: 5,
                    },
                };
            },
        }),
        BullModule.registerQueue({
            name: 'upload-processing',
        }),
        StorageModule,
        PathModule,
    ],
    providers: [QueueService, UploadProcessor],
    exports: [QueueService],
})
export class QueueModule { }
