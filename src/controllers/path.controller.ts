import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PathService } from '../services/path.service';
import { ResolvePathDto } from '../validations/path/resolve-path.dto';
import { ResolvedPathDto } from '../validations/path/resolved-path.dto';

@ApiTags('Path Resolution')
@Controller('path')
export class PathController {
    constructor(private readonly pathService: PathService) { }

    @Post('resolve')
    @ApiOperation({ summary: 'Resolve asset path from template' })
    @ApiResponse({
        status: 200,
        description: 'Resolved path',
        type: ResolvedPathDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid path template or parameters' })
    async resolvePath(@Body() resolvePathDto: ResolvePathDto): Promise<ResolvedPathDto> {
        const resolvedPath = this.pathService.resolvePath(resolvePathDto);
        return { resolvedPath };
    }
}
