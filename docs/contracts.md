# API Contracts

This document outlines the API contracts for the Asset Management Game Dev Backend.

## Base URL

- Development: `http://localhost:4000/api/v1`
- All endpoints are prefixed with `/api/v1`

## Response Format

All API responses follow a standardized format.

### Success Response

```json
{
  "message": "Success",
  "content": {
    // Response data here
  },
  "errors": []
}
```

### Error Response

```json
{
  "message": "Error message description",
  "content": null,
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

---

## Health Check

### GET /health

Get API health status.

**Response:**
```json
{
  "message": "Success",
  "content": {
    "ok": true,
    "version": "1.0.0",
    "timestamp": "2024-11-30T12:00:00.000Z"
  },
  "errors": []
}
```

---

## Authentication

### GET /auth/github/start

Start GitHub OAuth authentication flow.

**Response:**
- `302 Redirect` to GitHub authorization page

---

### GET /auth/github/callback

Handle GitHub OAuth callback.

**Query Parameters:**
- `code` (string, required): Authorization code from GitHub
- `state` (string, required): CSRF state token

**Response:**
- `302 Redirect` to frontend with session cookie set

**Errors:**
- `invalid_state`: State parameter mismatch
- `oauth_failed`: OAuth flow failed

---

### POST /auth/logout

Logout current user and clear session.

**Headers:**
- `Cookie: sid=<session_id>`

**Response:**
- `204 No Content`

---

### GET /auth/me

Get current authenticated user information.

**Headers:**
- `Cookie: sid=<session_id>` (required)

**Response:**
```json
{
  "message": "Success",
  "content": {
    "id": "usr_1234567890",
    "login": "github_username",
    "name": "User Full Name",
    "avatarUrl": "https://avatars.githubusercontent.com/u/..."
  },
  "errors": []
}
```

**Errors:**
- `401 Unauthorized`: No valid session found

---

## Projects

### GET /projects

List all projects with statistics.

**Query Parameters:**
- None

**Response:**
```json
{
  "message": "Success",
  "content": [
    {
      "id": "proj_abc123",
      "name": "My Game Project",
      "githubUrl": "https://github.com/username/repo",
      "assetGroupCount": 5,
      "totalSubAssets": 42,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "errors": []
}
```

---

### GET /projects/:id

Get detailed information about a specific project.

**Path Parameters:**
- `id` (string, required): Project ID

**Response:**
```json
{
  "message": "Success",
  "content": {
    "id": "proj_abc123",
    "name": "My Game Project",
    "githubUrl": "https://github.com/username/repo",
    "assetGroups": [
      {
        "id": "grp_xyz789",
        "key": "player-sprites",
        "type": "sprites",
        "subAssetCount": 15
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "errors": []
}
```

**Errors:**
- `404 Not Found`: Project does not exist

---

### GET /projects/:id/assets

Get all assets for a project with pagination.

**Path Parameters:**
- `id` (string, required): Project ID

**Query Parameters:**
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20): Items per page

**Response:**
```json
{
  "message": "Success",
  "content": {
    "data": [
      {
        "id": "sub_123",
        "key": "player-idle",
        "type": "sprite",
        "currentVersion": 3,
        "group": {
          "key": "player-sprites",
          "type": "sprites"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  },
  "errors": []
}
```

---

## Assets

### GET /assets/groups

List all asset groups.

**Query Parameters:**
- `projectId` (string, optional): Filter by project ID

**Response:**
```json
{
  "message": "Success",
  "content": [
    {
      "id": "grp_xyz789",
      "key": "player-sprites",
      "type": "sprites",
      "project": {
        "id": "proj_abc123",
        "name": "My Game Project"
      },
      "subAssetCount": 15,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "errors": []
}
```

---

### GET /assets/sub-assets

List all sub-assets.

**Query Parameters:**
- `groupId` (string, optional): Filter by asset group ID
- `projectId` (string, optional): Filter by project ID

**Response:**
```json
{
  "message": "Success",
  "content": [
    {
      "id": "sub_123",
      "key": "player-idle",
      "type": "sprite",
      "basePath": "sprites/player",
      "pathTemplate": "{base}/{key}_v{version}.{ext}",
      "currentVersion": 3,
      "rulePackKey": "sprite_static",
      "group": {
        "id": "grp_xyz789",
        "key": "player-sprites",
        "type": "sprites",
        "project": {
          "id": "proj_abc123",
          "name": "My Game Project"
        }
      },
      "versionCount": 3,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "errors": []
}
```

---

### GET /assets/sub-assets/:id/history

Get version history for a sub-asset.

**Path Parameters:**
- `id` (string, required): Sub-asset ID

**Response:**
```json
{
  "message": "Success",
  "content": {
    "subAsset": {
      "id": "sub_123",
      "key": "player-idle",
      "group": {
        "key": "player-sprites",
        "project": {
          "name": "My Game Project"
        }
      }
    },
    "history": [
      {
        "id": "hist_456",
        "version": 3,
        "changeNote": "Updated sprite resolution",
        "filePath": "sprites/player/player-idle_v3.png",
        "fileSize": 15360,
        "fileHash": "sha256:abc123...",
        "createdAt": "2024-03-01T00:00:00.000Z"
      },
      {
        "id": "hist_455",
        "version": 2,
        "changeNote": "Fixed transparency",
        "filePath": "sprites/player/player-idle_v2.png",
        "fileSize": 14200,
        "fileHash": "sha256:def456...",
        "createdAt": "2024-02-01T00:00:00.000Z"
      }
    ]
  },
  "errors": []
}
```

**Errors:**
- `404 Not Found`: Sub-asset does not exist

---

## Uploads

### POST /uploads

Upload files for processing.

**Headers:**
- `Content-Type: multipart/form-data`
- `Cookie: sid=<session_id>` (required)

**Body (multipart/form-data):**
- `files` (file[], required): Files to upload (max 10 files, 10MB each)
- `targetSubassetIds` (string[], required): Target sub-asset IDs
- `mode` (enum, required): Upload mode (`single` | `sequence`)

**Response:**
```json
{
  "message": "Success",
  "content": {
    "id": "job_789",
    "status": "QUEUED",
    "mode": "single",
    "createdAt": "2024-03-01T00:00:00.000Z",
    "details": {
      "targetSubassetIds": ["sub_123"],
      "fileCount": 1
    }
  },
  "errors": []
}
```

**Errors:**
- `400 Bad Request`: Invalid files or parameters
- `401 Unauthorized`: No valid session

---

### GET /uploads/:id

Get upload job status.

**Path Parameters:**
- `id` (string, required): Upload job ID

**Response:**
```json
{
  "message": "Success",
  "content": {
    "id": "job_789",
    "status": "DONE",
    "mode": "single",
    "createdAt": "2024-03-01T00:00:00.000Z",
    "completedAt": "2024-03-01T00:00:05.000Z",
    "details": {
      "results": [
        {
          "subAssetId": "sub_123",
          "version": 4,
          "path": "sprites/player/player-idle_v4.png",
          "size": 16500,
          "hash": "sha256:ghi789..."
        }
      ]
    }
  },
  "errors": []
}
```

**Status Values:**
- `QUEUED`: Job is waiting to be processed
- `PROCESSING`: Job is currently being processed
- `DONE`: Job completed successfully
- `ERROR`: Job failed (see `errorMessage` field)

**Errors:**
- `404 Not Found`: Job ID does not exist

---

## Path Resolution

### POST /path/resolve

Resolve asset path from template.

**Request Body:**
```json
{
  "base": "sprites/player",
  "key": "player-idle",
  "version": 3,
  "ext": "png",
  "pathTemplate": "{base}/{key}_v{version}.{ext}"
}
```

**Response:**
```json
{
  "message": "Success",
  "content": {
    "resolvedPath": "sprites/player/player-idle_v3.png",
    "template": "{base}/{key}_v{version}.{ext}",
    "variables": {
      "base": "sprites/player",
      "key": "player-idle",
      "version": 3,
      "ext": "png"
    }
  },
  "errors": []
}
```

**Errors:**
- `400 Bad Request`: Invalid template or variables

---

## Rule Packs

### GET /rule-packs

Get available validation rule packs.

**Response:**
```json
{
  "message": "Success",
  "content": [
    {
      "key": "sprite_static",
      "displayName": "Static Sprites",
      "rulesSummary": "PNG/JPG images, max 1024x1024px, power-of-2 dimensions preferred"
    },
    {
      "key": "sprite_animation",
      "displayName": "Animated Sprites",
      "rulesSummary": "PNG spritesheets, max 2048x2048px, consistent frame sizes"
    },
    {
      "key": "model_3d",
      "displayName": "3D Models",
      "rulesSummary": "FBX/GLTF models, optimized for real-time rendering"
    },
    {
      "key": "audio_music",
      "displayName": "Background Music",
      "rulesSummary": "MP3/OGG audio, 44.1kHz, stereo, max 5MB per track"
    },
    {
      "key": "audio_sfx",
      "displayName": "Sound Effects",
      "rulesSummary": "WAV/OGG audio, 44.1kHz, mono/stereo, max 1MB per file"
    }
  ],
  "errors": []
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Default**: 100 requests per minute per IP address
- Headers included in response:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Timestamp when limit resets

---

## Error Codes

| Code | Description |
|------|-------------|
| `BAD_REQUEST` | Invalid request parameters or body |
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource does not exist |
| `CONFLICT` | Resource conflict (e.g., duplicate key) |
| `UNPROCESSABLE_ENTITY` | Validation failed |
| `TOO_MANY_REQUESTS` | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | Server error |
