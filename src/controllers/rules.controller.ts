import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RulesService } from '../services/rules.service';
import { RulePackDto } from '../validations/rules/rule-pack.dto';

@ApiTags('Rule Packs')
@Controller('rule-packs')
export class RulesController {
    constructor(private readonly rulesService: RulesService) { }

    @Get()
    @ApiOperation({ summary: 'Get available rule packs' })
    @ApiResponse({
        status: 200,
        description: 'List of available rule packs',
        type: [RulePackDto],
    })
    async getRulePacks(): Promise<RulePackDto[]> {
        return this.rulesService.getRulePacks();
    }
}
