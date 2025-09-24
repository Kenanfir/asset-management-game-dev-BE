import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService, UploadJobData } from './queue.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { PathService } from '../path/path.service';

@Processor('upload-processing')
export class UploadProcessor extends WorkerHost {
    private readonly logger = new Logger(UploadProcessor.name);

    constructor(
        private readonly storageService: StorageService,
        private readonly prisma: PrismaService,
        private readonly pathService: PathService,
    ) {
        super();
    }

    async process(job: Job<UploadJobData>): Promise<void> {
        const { jobId, targetSubassetIds, files, userId } = job.data;

        this.logger.log(`Processing upload job ${jobId} with ${files.length} files`);

        try {
            // Update job status to processing
            await this.prisma.uploadJob.update({
                where: { id: jobId },
                data: { status: 'PROCESSING' },
            });

            const results = [];

            for (const file of files) {
                // Get the first target sub-asset for this file
                const subAssetId = targetSubassetIds[0]; // Simplified: use first target
                const subAsset = await this.prisma.subAsset.findUnique({
                    where: { id: subAssetId },
                });

                if (!subAsset) {
                    throw new Error(`Sub-asset ${subAssetId} not found`);
                }

                // Resolve path for the new version
                const newVersion = subAsset.currentVersion + 1;
                const resolvedPath = this.pathService.resolvePath({
                    base: subAsset.basePath,
                    key: subAsset.key,
                    version: newVersion,
                    ext: this.getFileExtension(file.originalName),
                    pathTemplate: subAsset.pathTemplate,
                });

                // Store file
                const storedFile = await this.storageService.storeFile(
                    file.buffer,
                    resolvedPath,
                    file.mimeType,
                );

                // Update database in transaction
                await this.prisma.$transaction(async (tx) => {
                    // Create asset history entry
                    await tx.assetHistory.create({
                        data: {
                            subAssetId: subAsset.id,
                            version: newVersion,
                            changeNote: `Uploaded via job ${jobId}`,
                            filePath: storedFile.path,
                            fileSize: storedFile.size,
                            fileHash: storedFile.hash,
                        },
                    });

                    // Update sub-asset version
                    await tx.subAsset.update({
                        where: { id: subAsset.id },
                        data: { currentVersion: newVersion },
                    });
                });

                results.push({
                    subAssetId: subAsset.id,
                    version: newVersion,
                    path: storedFile.path,
                    size: storedFile.size,
                    hash: storedFile.hash,
                });

                this.logger.log(`Processed file ${file.originalName} for sub-asset ${subAsset.key}`);
            }

            // Update job as completed
            await this.prisma.uploadJob.update({
                where: { id: jobId },
                data: {
                    status: 'DONE',
                    details: { results },
                    completedAt: new Date(),
                },
            });

            this.logger.log(`Upload job ${jobId} completed successfully`);
        } catch (error) {
            this.logger.error(`Upload job ${jobId} failed:`, error);

            // Update job as failed
            await this.prisma.uploadJob.update({
                where: { id: jobId },
                data: {
                    status: 'ERROR',
                    errorMessage: error.message,
                },
            });

            throw error;
        }
    }

    private getFileExtension(filename: string): string {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : '';
    }
}
