import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { SessionService } from '../session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly sessionService: SessionService) {
        super({
            jwtFromRequest: (req: Request) => {
                // Get session ID from cookie
                return req.cookies?.sid || null;
            },
            ignoreExpiration: false,
            secretOrKey: process.env.SESSION_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: any) {
        const sessionId = req.cookies?.sid;

        if (!sessionId) {
            throw new UnauthorizedException('No session found');
        }

        const user = await this.sessionService.validateSession(sessionId);

        if (!user) {
            throw new UnauthorizedException('Invalid session');
        }

        return user;
    }
}
