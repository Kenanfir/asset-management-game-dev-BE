import { ApiProperty } from '@nestjs/swagger';
import { JobStatus, UploadMode } from '@prisma/client';

export class UploadJobDto {
    @ApiProperty({ description: 'Upload job ID' })
    id: string;

    @ApiProperty({
        description: 'Job status',
        enum: JobStatus,
    })
    status: JobStatus;

    @ApiProperty({
        description: 'Upload mode',
        enum: UploadMode,
    })
    mode: UploadMode;

    @ApiProperty({ description: 'Job creation timestamp' })
    createdAt: Date;

    @ApiProperty({
        description: 'Job details',
        nullable: true,
    })
    details?: any;

    @ApiProperty({
        description: 'Error message if job failed',
        nullable: true,
    })
    errorMessage?: string;

    @ApiProperty({
        description: 'Job completion timestamp',
        nullable: true,
    })
    completedAt?: Date;
}
