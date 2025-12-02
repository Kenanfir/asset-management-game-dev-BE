import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestId = request.headers['x-request-id'] || 'unknown';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let details: any = undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || message;
                details = (exceptionResponse as any).details;
            }
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // Log the error
        this.logger.error(
            `Request ${requestId} failed: ${message}`,
            exception instanceof Error ? exception.stack : undefined,
        );

        // Send error response
        // Send error response
        const errors = [];
        if (details) {
            if (Array.isArray(details)) {
                errors.push(...details);
            } else {
                errors.push(details);
            }
        }

        response.status(status).json({
            message,
            content: null,
            errors,
        });
    }

    private getErrorCode(status: number): string {
        switch (status) {
            case 400:
                return 'BAD_REQUEST';
            case 401:
                return 'UNAUTHORIZED';
            case 403:
                return 'FORBIDDEN';
            case 404:
                return 'NOT_FOUND';
            case 409:
                return 'CONFLICT';
            case 422:
                return 'VALIDATION_ERROR';
            case 429:
                return 'RATE_LIMITED';
            case 500:
                return 'INTERNAL_ERROR';
            default:
                return 'UNKNOWN_ERROR';
        }
    }
}
