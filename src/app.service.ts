import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHealth() {
        return {
            ok: true,
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        };
    }
}
