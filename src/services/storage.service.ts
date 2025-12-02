import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, resolve, dirname } from 'path';
import { createHash } from 'crypto';

export interface StoredFile {
    path: string;
    size: number;
    hash: string;
    mimeType: string;
}

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly storageRoot: string;

    constructor(private readonly configService: ConfigService) {
        this.storageRoot = this.configService.get('STORAGE_ROOT');
    }

    async storeFile(
        file: Buffer,
        relativePath: string,
        mimeType: string,
    ): Promise<StoredFile> {
        const fullPath = this.resolvePath(relativePath);

        // Ensure directory exists
        await fs.mkdir(dirname(fullPath), { recursive: true });

        // Write file
        await fs.writeFile(fullPath, file);

        // Calculate hash
        const hash = createHash('sha256').update(file).digest('hex');

        const result: StoredFile = {
            path: relativePath,
            size: file.length,
            hash,
            mimeType,
        };

        this.logger.log(`File stored: ${relativePath} (${file.length} bytes, ${hash})`);

        return result;
    }

    async getFile(relativePath: string): Promise<Buffer> {
        const fullPath = this.resolvePath(relativePath);
        return fs.readFile(fullPath);
    }

    async deleteFile(relativePath: string): Promise<void> {
        const fullPath = this.resolvePath(relativePath);
        await fs.unlink(fullPath);
        this.logger.log(`File deleted: ${relativePath}`);
    }

    async fileExists(relativePath: string): Promise<boolean> {
        try {
            const fullPath = this.resolvePath(relativePath);
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async getFileStats(relativePath: string) {
        const fullPath = this.resolvePath(relativePath);
        return fs.stat(fullPath);
    }

    private resolvePath(relativePath: string): string {
        // Sanitize path to prevent directory traversal
        const sanitizedPath = relativePath
            .replace(/\.\./g, '') // Remove .. sequences
            .replace(/\/+/g, '/') // Replace multiple slashes
            .replace(/^\/+/, ''); // Remove leading slashes

        const fullPath = resolve(this.storageRoot, sanitizedPath);

        // Ensure the resolved path is within storage root
        if (!fullPath.startsWith(resolve(this.storageRoot))) {
            throw new Error('Path traversal detected');
        }

        return fullPath;
    }

    async ensureDirectory(relativePath: string): Promise<void> {
        const fullPath = this.resolvePath(relativePath);
        await fs.mkdir(fullPath, { recursive: true });
    }

    async listFiles(relativePath: string): Promise<string[]> {
        const fullPath = this.resolvePath(relativePath);
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        return entries
            .filter(entry => entry.isFile())
            .map(entry => entry.name);
    }
}
