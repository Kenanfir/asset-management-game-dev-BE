import { ApiProperty } from '@nestjs/swagger';

export class ResolvedPathDto {
    @ApiProperty({ description: 'Resolved file path' })
    resolvedPath: string;
}
