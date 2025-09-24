import { Controller, Get, Post, Req, Res, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { User } from './decorators/user.decorator';
import { AuthenticatedUser } from './types/authenticated-user.type';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly sessionService: SessionService,
    ) { }

    @Get('github/start')
    @ApiOperation({ summary: 'Start GitHub OAuth flow' })
    @ApiResponse({ status: 302, description: 'Redirect to GitHub authorization' })
    async startGitHubAuth(@Req() req: Request, @Res() res: Response) {
        const state = this.authService.generateState();
        const authUrl = this.authService.getGitHubAuthUrl(state);

        // Store state in session for validation
        req.session = req.session || {};
        req.session.oauthState = state;

        res.redirect(authUrl);
    }

    @Get('github/callback')
    @ApiOperation({ summary: 'Handle GitHub OAuth callback' })
    @ApiQuery({ name: 'code', description: 'Authorization code from GitHub' })
    @ApiQuery({ name: 'state', description: 'State parameter for CSRF protection' })
    @ApiResponse({ status: 302, description: 'Redirect to frontend with session cookie' })
    async handleGitHubCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            // Validate state
            if (!req.session?.oauthState || req.session.oauthState !== state) {
                return res.redirect(`${process.env.FRONTEND_ORIGIN}/auth/error?error=invalid_state`);
            }

            // Exchange code for access token
            const accessToken = await this.authService.exchangeCodeForToken(code);

            // Get user info from GitHub
            const githubUser = await this.authService.getGitHubUser(accessToken);

            // Create or update user in database
            const user = await this.authService.createOrUpdateUser(githubUser);

            // Create session
            const sessionId = await this.sessionService.createSession(user);

            // Set session cookie
            res.cookie('sid', sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            // Clear OAuth state
            delete req.session.oauthState;

            // Redirect to frontend
            res.redirect(`${process.env.FRONTEND_ORIGIN}/auth/success`);
        } catch (error) {
            console.error('GitHub OAuth error:', error);
            res.redirect(`${process.env.FRONTEND_ORIGIN}/auth/error?error=oauth_failed`);
        }
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 204, description: 'User logged out successfully' })
    async logout(@Req() req: Request, @Res() res: Response) {
        const sessionId = req.cookies?.sid;

        if (sessionId) {
            await this.sessionService.destroySession(sessionId);
        }

        res.clearCookie('sid');
        res.status(204).send();
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Get current user' })
    @ApiResponse({
        status: 200,
        description: 'Current user information',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                login: { type: 'string' },
                name: { type: 'string' },
                avatarUrl: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getMe(@User() user: AuthenticatedUser) {
        return {
            id: user.id,
            login: user.login,
            name: user.name,
            avatarUrl: user.avatarUrl,
        };
    }
}
