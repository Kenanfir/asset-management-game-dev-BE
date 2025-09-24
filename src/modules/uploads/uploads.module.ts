import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { FileValidationService } from './file-validation.service';

@Module({
    controllers: [UploadsController],
    providers: [UploadsService, FileValidationService],
    exports: [UploadsService],
})
export class UploadsModule { }
