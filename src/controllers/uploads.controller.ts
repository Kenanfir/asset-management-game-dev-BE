import {
    Controller,
    Post,
    Get,
    Param,
    UseInterceptors,
    UploadedFiles,
    Body,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../modules/auth/decorators/user.decorator';
import { AuthenticatedUser } from '../modules/auth/types/authenticated-user.type';
import { UploadsService } from '../services/uploads.service';
import { CreateUploadDto } from '../validations/uploads/create-upload.dto';
import { UploadJobDto } from '../validations/uploads/upload-job.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @UseInterceptors(FilesInterceptor('files', 10, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB per file
            files: 10, // Max 10 files
        },
    }))
    @ApiOperation({ summary: 'Upload files for processing' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({
        status: 201,
        description: 'Upload job created successfully',
        type: UploadJobDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid upload request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() createUploadDto: CreateUploadDto,
        @User() user: AuthenticatedUser,
    ) {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided');
        }

        if (files.length > 10) {
            throw new BadRequestException('Too many files (max 10)');
        }

        return this.uploadsService.createUploadJob(files, createUploadDto, user);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get upload job status' })
    @ApiParam({ name: 'id', description: 'Upload job ID' })
    @ApiResponse({
        status: 200,
        description: 'Upload job status',
        type: UploadJobDto,
    })
    @ApiResponse({ status: 404, description: 'Upload job not found' })
    async getUploadJob(@Param('id') id: string) {
        return this.uploadsService.getUploadJob(id);
    }
}
