import { Module } from '@nestjs/common';
import { UploadsController } from '../../controllers/uploads.controller';
import { UploadsService } from '../../services/uploads.service';
import { FileValidationService } from '../../services/file-validation.service';

@Module({
    controllers: [UploadsController],
    providers: [UploadsService, FileValidationService],
    exports: [UploadsService],
})
export class UploadsModule { }
