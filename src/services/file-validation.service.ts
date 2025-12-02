import { Injectable, BadRequestException } from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import { UploadedFile } from '../common/types/uploaded-file.interface';

@Injectable()
export class FileValidationService {
    private readonly allowedMimeTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/webp',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'model/gltf-binary',
        'model/gltf+json',
        'application/octet-stream', // For FBX and other binary formats
    ]);

    private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

    async validateFile(file: UploadedFile): Promise<void> {
        // Check file size
        if (file.size > this.maxFileSize) {
            throw new BadRequestException(
                `File ${file.originalname} exceeds maximum size of ${this.maxFileSize / 1024 / 1024}MB`
            );
        }

        // Detect actual MIME type
        const detectedType = await fileTypeFromBuffer(file.buffer);
        const mimeType = detectedType?.mime || file.mimetype;

        // Validate MIME type
        if (!this.allowedMimeTypes.has(mimeType)) {
            throw new BadRequestException(
                `File ${file.originalname} has unsupported MIME type: ${mimeType}`
            );
        }

        // Additional validation based on file type
        if (mimeType.startsWith('image/')) {
            await this.validateImageFile(file, mimeType);
        } else if (mimeType.startsWith('audio/')) {
            await this.validateAudioFile(file, mimeType);
        }
    }

    private async validateImageFile(file: UploadedFile, mimeType: string): Promise<void> {
        // Basic image validation - in production, you'd use a proper image library
        if (file.size < 100) {
            throw new BadRequestException(`File ${file.originalname} appears to be corrupted (too small)`);
        }
    }

    private async validateAudioFile(file: UploadedFile, mimeType: string): Promise<void> {
        // Basic audio validation
        if (file.size < 100) {
            throw new BadRequestException(`File ${file.originalname} appears to be corrupted (too small)`);
        }
    }
}
