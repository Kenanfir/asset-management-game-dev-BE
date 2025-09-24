import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor() {
        super({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `${process.env.APP_BASE_URL}/api/v1/auth/github/callback`,
            scope: ['read:user'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any) {
        // This strategy is not used in our implementation
        // We handle GitHub OAuth manually in the controller
        return null;
    }
}
