import { ApiProperty } from '@nestjs/swagger';
import { ProjectDto } from './project.dto';

export class ProjectStatsDto {
    @ApiProperty({ description: 'Total number of asset groups' })
    totalAssetGroups: number;

    @ApiProperty({ description: 'Total number of sub-assets' })
    totalSubAssets: number;

    @ApiProperty({ description: 'Total number of versions across all assets' })
    totalVersions: number;
}

export class ProjectWithStatsDto extends ProjectDto {
    @ApiProperty({ description: 'Project statistics', type: ProjectStatsDto })
    stats: ProjectStatsDto;
}
