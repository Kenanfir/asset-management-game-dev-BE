import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from '../services/projects.service';
import { GithubService } from '../services/github.service';
import { AuthService } from '../services/auth.service';
import { User } from '../modules/auth/decorators/user.decorator';
import { AuthenticatedUser } from '../modules/auth/types/authenticated-user.type';
import { ProjectDto } from '../validations/projects/project.dto';
import { ProjectWithStatsDto } from '../validations/projects/project-with-stats.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly githubService: GithubService,
        private readonly authService: AuthService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all projects' })
    @ApiResponse({
        status: 200,
        description: 'List of projects',
        type: [ProjectDto],
    })
    async findAll(): Promise<ProjectDto[]> {
        return this.projectsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get project by ID' })
    @ApiParam({ name: 'id', description: 'Project ID' })
    @ApiResponse({
        status: 200,
        description: 'Project details with stats',
        type: ProjectWithStatsDto,
    })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async findOne(@Param('id') id: string): Promise<ProjectWithStatsDto> {
        return this.projectsService.findOne(id);
    }

    @Get(':id/assets')
    @ApiOperation({ summary: 'Get project assets' })
    @ApiParam({ name: 'id', description: 'Project ID' })
    @ApiQuery({ name: 'cursor', required: false, description: 'Pagination cursor' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
    @ApiResponse({
        status: 200,
        description: 'Project assets grouped by asset groups',
    })
    async getAssets(
        @Param('id') id: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: number,
    ) {
        return this.projectsService.getAssets(id, cursor, limit);
    }
    @Post(':id/readme')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Update project README' })
    @ApiParam({ name: 'id', description: 'Project ID' })
    @ApiResponse({ status: 200, description: 'README updated successfully' })
    @ApiResponse({ status: 404, description: 'Project not found' })
    async updateReadme(@Param('id') id: string, @User() user: AuthenticatedUser) {
        const project = await this.projectsService.findOne(id);

        // Fetch user with access token
        const userWithToken = await this.authService.getUserWithToken(user.id);

        if (!userWithToken?.githubAccessToken) {
            throw new Error('User does not have a GitHub access token');
        }

        const content = `# ${project.name}\n\nNo description provided.\n\n## Assets\n\nThis project contains assets managed by Asset Manager Game Dev Tool.`;

        await this.githubService.updateFile(
            userWithToken.githubAccessToken,
            project.repo,
            'README.md',
            content,
            'docs: update README via Asset Manager'
        );

        return { message: 'README updated successfully' };
    }
}
