import { ApiProperty } from '@nestjs/swagger';

export class ProjectDto {
    @ApiProperty({ description: 'Project ID' })
    id: string;

    @ApiProperty({ description: 'Project name' })
    name: string;

    @ApiProperty({ description: 'Repository URL' })
    repo: string;

    @ApiProperty({ description: 'Project status' })
    status: string;

    @ApiProperty({ description: 'Last sync timestamp', nullable: true })
    latestSyncAt: Date | null;
}
