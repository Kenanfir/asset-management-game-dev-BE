import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface UploadJobData {
    jobId: string;
    targetSubassetIds: string[];
    files: Array<{
        originalName: string;
        buffer: Buffer;
        mimeType: string;
    }>;
    userId: string;
}

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('upload-processing')
        private uploadQueue: Queue<UploadJobData>,
    ) { }

    async addUploadJob(data: UploadJobData): Promise<void> {
        try {
            await this.uploadQueue.add('process-upload', data, {
                jobId: data.jobId,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });

            this.logger.log(`Upload job ${data.jobId} queued for processing`);
        } catch (error) {
            this.logger.error(`Failed to queue upload job ${data.jobId}:`, error);
            throw error;
        }
    }

    async getJobStatus(jobId: string) {
        const job = await this.uploadQueue.getJob(jobId);

        if (!job) {
            return null;
        }

        return {
            id: job.id,
            status: await job.getState(),
            progress: job.progress,
            data: job.data,
            error: job.failedReason,
            createdAt: new Date(job.timestamp),
            processedAt: job.processedOn ? new Date(job.processedOn) : null,
        };
    }

    async getQueueStats() {
        const waiting = await this.uploadQueue.getWaiting();
        const active = await this.uploadQueue.getActive();
        const completed = await this.uploadQueue.getCompleted();
        const failed = await this.uploadQueue.getFailed();

        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
        };
    }
}
