import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './types/authenticated-user.type';

interface GitHubUser {
    id: number;
    login: string;
    name?: string;
    avatar_url?: string;
}

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) { }

    generateState(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }

    getGitHubAuthUrl(state: string): string {
        const clientId = this.configService.get('GITHUB_CLIENT_ID');
        const baseUrl = this.configService.get('APP_BASE_URL');

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: `${baseUrl}/api/v1/auth/github/callback`,
            state,
            scope: 'read:user',
        });

        return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    async exchangeCodeForToken(code: string): Promise<string> {
        const clientId = this.configService.get('GITHUB_CLIENT_ID');
        const clientSecret = this.configService.get('GITHUB_CLIENT_SECRET');
        const baseUrl = this.configService.get('APP_BASE_URL');

        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: `${baseUrl}/api/v1/auth/github/callback`,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to exchange code for token');
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
        }

        return data.access_token;
    }

    async getGitHubUser(accessToken: string): Promise<GitHubUser> {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch GitHub user');
        }

        return response.json();
    }

    async createOrUpdateUser(githubUser: GitHubUser): Promise<AuthenticatedUser> {
        const user = await this.prisma.user.upsert({
            where: { githubId: githubUser.id },
            update: {
                login: githubUser.login,
                name: githubUser.name,
                avatarUrl: githubUser.avatar_url,
            },
            create: {
                githubId: githubUser.id,
                login: githubUser.login,
                name: githubUser.name,
                avatarUrl: githubUser.avatar_url,
            },
        });

        this.logger.log(`User ${user.login} authenticated successfully`);

        return {
            id: user.id,
            login: user.login,
            name: user.name,
            avatarUrl: user.avatarUrl,
        };
    }
}
