import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction): void {
        const requestId = req.headers['x-request-id'] as string || uuidv4();

        // Set request ID in headers
        req.headers['x-request-id'] = requestId;
        res.setHeader('X-Request-Id', requestId);

        // Add to request object for logging
        (req as any).requestId = requestId;

        next();
    }
}
