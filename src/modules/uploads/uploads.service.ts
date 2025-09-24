import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { FileValidationService } from './file-validation.service';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateUploadDto } from './dto/create-upload.dto';
import { UploadJobDto } from './dto/upload-job.dto';

@Injectable()
export class UploadsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly queueService: QueueService,
        private readonly fileValidationService: FileValidationService,
    ) { }

    async createUploadJob(
        files: Express.Multer.File[],
        createUploadDto: CreateUploadDto,
        user: AuthenticatedUser,
    ): Promise<UploadJobDto> {
        // Validate target sub-assets exist
        const subAssets = await this.prisma.subAsset.findMany({
            where: {
                id: { in: createUploadDto.targetSubassetIds },
            },
        });

        if (subAssets.length !== createUploadDto.targetSubassetIds.length) {
            throw new BadRequestException('One or more target sub-assets not found');
        }

        // Validate files
        for (const file of files) {
            await this.fileValidationService.validateFile(file);
        }

        // Create upload job
        const uploadJob = await this.prisma.uploadJob.create({
            data: {
                status: 'QUEUED',
                mode: createUploadDto.mode,
                createdByUserId: user.id,
                details: {
                    targetSubassetIds: createUploadDto.targetSubassetIds,
                    fileCount: files.length,
                },
            },
        });

        // Queue for processing
        await this.queueService.addUploadJob({
            jobId: uploadJob.id,
            targetSubassetIds: createUploadDto.targetSubassetIds,
            files: files.map(file => ({
                originalName: file.originalname,
                buffer: file.buffer,
                mimeType: file.mimetype,
            })),
            userId: user.id,
        });

        return {
            id: uploadJob.id,
            status: uploadJob.status,
            mode: uploadJob.mode,
            createdAt: uploadJob.createdAt,
            details: uploadJob.details,
        };
    }

    async getUploadJob(id: string): Promise<UploadJobDto> {
        const job = await this.prisma.uploadJob.findUnique({
            where: { id },
        });

        if (!job) {
            throw new NotFoundException(`Upload job with ID ${id} not found`);
        }

        return {
            id: job.id,
            status: job.status,
            mode: job.mode,
            createdAt: job.createdAt,
            details: job.details,
            errorMessage: job.errorMessage,
            completedAt: job.completedAt,
        };
    }
}
