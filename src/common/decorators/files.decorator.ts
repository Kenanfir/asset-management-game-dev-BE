import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { UploadedFile } from '../types/uploaded-file.interface';

export const Files = createParamDecorator(
    async (data: unknown, ctx: ExecutionContext): Promise<UploadedFile[]> => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest>();
        const parts = await (request as any).parts();
        const files: UploadedFile[] = [];

        for await (const part of parts) {
            if (part.file) {
                const buffer = await part.toBuffer();
                files.push({
                    fieldname: part.fieldname,
                    originalname: part.filename,
                    encoding: part.encoding,
                    mimetype: part.mimetype,
                    buffer,
                    size: buffer.length,
                });
            }
        }

        return files;
    },
);
