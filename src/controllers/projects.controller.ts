import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service';
import { ProjectDto } from '../validations/projects/project.dto';
import { ProjectWithStatsDto } from '../validations/projects/project-with-stats.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

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
}
