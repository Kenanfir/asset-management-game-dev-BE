import { Injectable, BadRequestException } from '@nestjs/common';
import { ResolvePathDto } from '../validations/path/resolve-path.dto';

@Injectable()
export class PathService {
    resolvePath(dto: ResolvePathDto): string {
        const { base, key, version, ext, pathTemplate } = dto;

        // Validate inputs
        if (!base || !key || !version || !ext) {
            throw new BadRequestException('Missing required parameters: base, key, version, ext');
        }

        // Use provided template or default
        const template = pathTemplate || '{base}/{key}/v{version}/{key}.{ext}';

        // Replace placeholders
        let resolvedPath = template
            .replace('{base}', this.sanitizePath(base))
            .replace('{key}', this.sanitizePath(key))
            .replace('{version}', `v${version}`)
            .replace('{ext}', this.sanitizeExtension(ext));

        // Additional validation
        if (resolvedPath.includes('..') || resolvedPath.includes('//')) {
            throw new BadRequestException('Invalid path: contains unsafe characters');
        }

        return resolvedPath;
    }

    private sanitizePath(path: string): string {
        // Remove any path traversal attempts and normalize
        return path
            .replace(/\.\./g, '') // Remove .. sequences
            .replace(/\/+/g, '/') // Replace multiple slashes with single
            .replace(/^\/+/, '') // Remove leading slashes
            .replace(/\/+$/, ''); // Remove trailing slashes
    }

    private sanitizeExtension(ext: string): string {
        // Remove dots and normalize extension
        return ext.replace(/^\.+/, '').toLowerCase();
    }
}
