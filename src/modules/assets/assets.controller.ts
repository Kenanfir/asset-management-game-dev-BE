import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get('groups')
    @ApiOperation({ summary: 'Get all asset groups' })
    @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
    @ApiResponse({
        status: 200,
        description: 'List of asset groups',
    })
    async getAssetGroups(@Query('projectId') projectId?: string) {
        return this.assetsService.getAssetGroups(projectId);
    }

    @Get('sub-assets')
    @ApiOperation({ summary: 'Get all sub-assets' })
    @ApiQuery({ name: 'groupId', required: false, description: 'Filter by asset group ID' })
    @ApiQuery({ name: 'projectId', required: false, description: 'Filter by project ID' })
    @ApiResponse({
        status: 200,
        description: 'List of sub-assets',
    })
    async getSubAssets(
        @Query('groupId') groupId?: string,
        @Query('projectId') projectId?: string,
    ) {
        return this.assetsService.getSubAssets(groupId, projectId);
    }

    @Get('sub-assets/:id/history')
    @ApiOperation({ summary: 'Get sub-asset version history' })
    @ApiParam({ name: 'id', description: 'Sub-asset ID' })
    @ApiResponse({
        status: 200,
        description: 'Sub-asset version history',
    })
    async getSubAssetHistory(@Param('id') id: string) {
        return this.assetsService.getSubAssetHistory(id);
    }
}
