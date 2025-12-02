# Authentication API Contract

## Overview

This document outlines the API contract for authentication using GitHub OAuth 2.0. The authentication flow uses server-side OAuth with session-based authentication.

## Flow

1. **Start OAuth** - Redirect user to GitHub authorization
2. **Handle Callback** - Exchange code for user data
3. **Session Creation** - Create server-side session
4. **Get Current User** - Retrieve authenticated user info
5. **Logout** - Destroy session

---

## Endpoints

### 1. Start GitHub OAuth

**Endpoint:** `GET /api/v1/auth/github/start`

**Description:** Initiates the GitHub OAuth flow by redirecting the user to GitHub's authorization page. Generates and stores a CSRF state token for validation.

**Headers:**
- No authentication required (public endpoint)

**Response:**
- `302 Redirect` to GitHub authorization URL

**Business Logic:**
- Generates random CSRF state token
- Stores state in server-side session
- Constructs GitHub authorization URL with:
  - Client ID
  - Callback URL
  - Requested scopes (`read:user`)
  - State parameter
- Redirects user to GitHub

---

### 2. GitHub OAuth Callback

**Endpoint:** `GET /api/v1/auth/github/callback`

**Description:** Handles the OAuth callback from GitHub after user authorization. Validates the state token, exchanges the authorization code for an access token, fetches user data, and creates a session.

**Headers:**
- No authentication required

**Query Parameters:**
- `code` (string, required): Authorization code from GitHub
- `state` (string, required): CSRF state token

**Response (Success):**
- `302 Redirect` to `${FRONTEND_ORIGIN}/auth/success`
- Sets `sid` cookie with session ID

**Response (Error - Invalid State):**
- `302 Redirect` to `${FRONTEND_ORIGIN}/auth/error?error=invalid_state`

**Response (Error - OAuth Failed):**
- `302 Redirect` to `${FRONTEND_ORIGIN}/auth/error?error=oauth_failed`

**Cookie Set:**
```
sid=<session_id>
HttpOnly: true
Secure: true (production only)
SameSite: none
Max-Age: 604800 (7 days)
```

**Business Logic:**
1. Validate state parameter matches stored session state
2. Exchange authorization code for GitHub access token (server-side)
3. Fetch user data from GitHub API using access token
4. Create or update user in database:
   - Fields: `login`, `name`, `avatarUrl`, `githubId`
   - Upsert based on `githubId`
5. Create server-side session with user data
6. Generate session ID and store in memory (or Redis)
7. Set httpOnly cookie with session ID
8. Clear OAuth state from session
9. Redirect to frontend success page

**Security Considerations:**
- Access token never sent to client
- State parameter prevents CSRF attacks
- Session ID is opaque, doesn't contain user data
- HttpOnly cookie prevents XSS attacks
- Secure flag ensures HTTPS-only transmission

---

### 3. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Description:** Returns the currently authenticated user's information. Requires a valid session cookie.

**Headers:**
- `Cookie: sid=<session_id>` (required)

**Response (Success):**
```json
{
  "message": "Success",
  "content": {
    "id": "usr_abc123def456",
    "login": "github_username",
    "name": "User Full Name",
    "avatarUrl": "https://avatars.githubusercontent.com/u/12345678?v=4"
  },
  "errors": []
}
```

**Response Fields:**
- `id` - Unique user identifier (CUID)
- `login` - GitHub username
- `name` - User's display name from GitHub
- `avatarUrl` - GitHub profile picture URL

**Response (Error - 401 Unauthorized):**
```json
{
  "message": "Unauthorized",
  "content": null,
  "errors": [
    {
      "field": "auth",
      "message": "No valid session found"
    }
  ]
}
```

**Business Logic:**
- Extract session ID from `sid` cookie
- Validate session exists and is not expired
- Retrieve user data from session
- Verify user still exists in database
- Return user information
- If session invalid or user deleted, return 401

**Authentication:**
- Uses JWT strategy with Passport
- Session validated on every request
- User data cached in session for performance

---

### 4. Logout

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Logs out the current user by destroying their session and clearing the session cookie.

**Headers:**
- `Cookie: sid=<session_id>` (optional)

**Response:**
- `204 No Content`
- Clears `sid` cookie

**Response (Always Success):**
- Returns 204 even if no session exists (idempotent)

**Business Logic:**
- Extract session ID from cookie (if present)
- Destroy session from session store
- Clear session cookie
- Return 204 No Content
- Safe to call multiple times

---

## Session Management

### Session Structure

```typescript
interface Session {
  id: string;           // Session ID (random, opaque)
  userId: string;       // User ID from database
  login: string;        // GitHub username
  name: string;         // User display name
  avatarUrl: string;    // Profile picture URL
  createdAt: Date;      // Session creation time
  expiresAt: Date;      // Session expiration time
}
```

### Session Storage

- **Development**: In-memory storage (lost on restart)
- **Production**: Redis-backed storage (persistent, scalable)
- **Expiration**: 7 days (604,800 seconds)
- **Cleanup**: Automatic removal of expired sessions

### Session Validation

```typescript
// Validation flow
1. Extract session ID from cookie
2. Look up session in store
3. Check if session expired
4. Verify user exists in database
5. Return user data or reject
```

---

## Authentication Guard

### JWT Strategy

The application uses a custom JWT strategy that:
- Reads session ID from `sid` cookie
- Validates session with `SessionService`
- Attaches user to request object
- Used by `@UseGuards(AuthGuard('jwt'))` decorator

### Protected Routes

All endpoints requiring authentication use:

```typescript
@UseGuards(AuthGuard('jwt'))
@Get('me')
getMe(@User() user: AuthenticatedUser) {
  return user;
}
```

### User Decorator

Custom `@User()` decorator extracts authenticated user from request:

```typescript
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Bad Request",
  "content": null,
  "errors": [
    {
      "field": "code",
      "message": "Authorization code is required"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized",
  "content": null,
  "errors": [
    {
      "field": "auth",
      "message": "No valid session found"
    }
  ]
}
```

### 403 Forbidden (Invalid State)
```json
{
  "message": "Forbidden",
  "content": null,
  "errors": [
    {
      "field": "state",
      "message": "Invalid or expired state token"
    }
  ]
}
```

### 500 Internal Server Error (OAuth Failed)
```json
{
  "message": "Internal Server Error",
  "content": null,
  "errors": [
    {
      "field": "oauth",
      "message": "Failed to complete GitHub authentication"
    }
  ]
}
```

---

## GitHub OAuth Configuration

### Required Environment Variables

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
APP_BASE_URL=http://localhost:4000
FRONTEND_ORIGIN=http://localhost:3000
SESSION_SECRET=your_session_secret
```

### GitHub App Scopes

- `read:user` - Read user profile information

### Callback URL

Must be registered in GitHub App settings:
```
{APP_BASE_URL}/api/v1/auth/github/callback
```

---

## Security Considerations

### CSRF Protection
- State parameter generated per OAuth flow
- Stored server-side, validated on callback
- Prevents cross-site request forgery

### Token Security
- Access tokens never exposed to client
- Server-to-server communication only
- Tokens not stored after initial exchange

### Session Security
- Session IDs are cryptographically random
- HttpOnly flag prevents JavaScript access
- Secure flag ensures HTTPS in production
- SameSite=none allows cross-origin cookies

### Cookie Configuration
```javascript
{
  httpOnly: true,           // Prevent XSS
  secure: NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'none',         // Allow cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000,   // 7 days
  domain: undefined,        // Current domain
  path: '/',                // All paths
}
```

---

## Rate Limiting

All auth endpoints are subject to rate limiting:
- **Limit**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp
- **Response (429)**: Too Many Requests

---

## Implementation Notes

### Future Enhancements
- Add refresh token support for long-lived sessions
- Implement session revocation/invalidation
- Add multi-device session management
- Support additional OAuth providers (Google, GitLab)
- Add 2FA support
- Implement remember me functionality
- Add session activity logging

### Performance Considerations
- Use Redis for session storage in production
- Implement session caching
- Consider JWT tokens for stateless auth (trade-off)
- Add session cleanup job for expired sessions

### Monitoring
- Log successful/failed auth attempts
- Track session creation/destruction
- Monitor OAuth callback failures
- Alert on suspicious auth patterns
