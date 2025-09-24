import { ApiProperty } from '@nestjs/swagger';

export class RulePackDto {
    @ApiProperty({ description: 'Rule pack identifier' })
    key: string;

    @ApiProperty({ description: 'Human-readable name' })
    displayName: string;

    @ApiProperty({ description: 'Summary of validation rules' })
    rulesSummary: string;
}
