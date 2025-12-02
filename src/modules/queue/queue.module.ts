import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueueService } from '../../services/queue.service';
import { UploadProcessor } from '../../services/upload.processor';

@Module({
    imports: [
        BullModule.forRootAsync({
            useFactory: () => ({
                connection: process.env.REDIS_URL ? {
                    host: process.env.REDIS_URL,
                } : undefined,
                // Use in-memory fallback if no Redis URL
                defaultJobOptions: {
                    removeOnComplete: 10,
                    removeOnFail: 5,
                },
            }),
        }),
        BullModule.registerQueue({
            name: 'upload-processing',
        }),
    ],
    providers: [QueueService, UploadProcessor],
    exports: [QueueService],
})
export class QueueModule { }
