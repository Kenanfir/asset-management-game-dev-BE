import { Module } from '@nestjs/common';
import { PathController } from '../../controllers/path.controller';
import { PathService } from '../../services/path.service';

@Module({
    controllers: [PathController],
    providers: [PathService],
    exports: [PathService],
})
export class PathModule { }
