import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class ResolvePathDto {
    @ApiProperty({ description: 'Base path for the asset' })
    @IsString()
    base: string;

    @ApiProperty({ description: 'Asset key/name' })
    @IsString()
    key: string;

    @ApiProperty({ description: 'Version number' })
    @IsNumber()
    @Min(1)
    version: number;

    @ApiProperty({ description: 'File extension' })
    @IsString()
    ext: string;

    @ApiProperty({ description: 'Custom path template', required: false })
    @IsString()
    @IsOptional()
    pathTemplate?: string;
}
