import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';
import { AuthenticatedUser } from '../modules/auth/types/authenticated-user.type';

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);
    private readonly sessions = new Map<string, AuthenticatedUser>();

    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
    ) { }

    async createSession(user: AuthenticatedUser): Promise<string> {
        // For simplicity, using in-memory sessions
        // In production, you'd want to use Redis or database sessions
        const sessionId = this.generateSessionId();
        this.sessions.set(sessionId, user);

        this.logger.log(`Session created for user ${user.login}`);
        return sessionId;
    }

    async getSession(sessionId: string): Promise<AuthenticatedUser | null> {
        return this.sessions.get(sessionId) || null;
    }

    async destroySession(sessionId: string): Promise<void> {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            this.logger.log(`Session ${sessionId} destroyed`);
        }
    }

    async validateSession(sessionId: string): Promise<AuthenticatedUser | null> {
        const user = this.sessions.get(sessionId);

        if (!user) {
            return null;
        }

        // Verify user still exists in database
        const dbUser = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser) {
            this.sessions.delete(sessionId);
            return null;
        }

        return user;
    }

    private generateSessionId(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }
}
