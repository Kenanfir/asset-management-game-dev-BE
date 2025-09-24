import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsString, ArrayMinSize } from 'class-validator';

export enum UploadMode {
    SINGLE = 'single',
    SEQUENCE = 'sequence',
}

export class CreateUploadDto {
    @ApiProperty({
        description: 'Target sub-asset IDs',
        type: [String],
        example: ['sub-asset-1', 'sub-asset-2'],
    })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    targetSubassetIds: string[];

    @ApiProperty({
        description: 'Upload mode',
        enum: UploadMode,
        example: UploadMode.SINGLE,
    })
    @IsEnum(UploadMode)
    mode: UploadMode;
}
