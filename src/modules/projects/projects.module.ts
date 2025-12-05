import { Module } from '@nestjs/common';
import { ProjectsController } from '../../controllers/projects.controller';
import { ProjectsService } from '../../services/projects.service';
import { GithubModule } from '../github/github.module';

import { AuthModule } from '../auth/auth.module';

@Module({
    controllers: [ProjectsController],
    providers: [ProjectsService],
    imports: [GithubModule, AuthModule],
    exports: [ProjectsService],
})
export class ProjectsModule { }
