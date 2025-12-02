# Assets API Contract

## Overview

This document outlines the API contract for asset management, including asset groups, sub-assets, and version history.

## Flow

1. **List Asset Groups** - Fetch all asset groups (optionally filtered by project)
2. **List Sub-Assets** - Fetch sub-assets (optionally filtered by group or project)
3. **Get Sub-Asset History** - View version history for a specific sub-asset

---

## Endpoints

### 1. Get Asset Groups

**Endpoint:** `GET /api/v1/assets/groups`

**Description:** Returns all asset groups, with optional filtering by project. Asset groups are logical groupings of related assets (e.g., "Player Sprites", "Background Music").

**Headers:**
- No authentication required

**Query Parameters:**
- `projectId` (string, optional): Filter by project ID

**Response (Success - All Groups):**
```json
{
  "message": "Success",
  "content": [
    {
      "id": "grp_aaa111bbb222",
      "key": "player-sprites",
      "type": "sprites",
      "project": {
        "id": "proj_abc123def456",
        "name": "My Game Project"
      },
      "subAssetCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "grp_ccc333ddd444",
      "key": "background-music",
      "type": "audio",
      "project": {
        "id": "proj_abc123def456",
        "name": "My Game Project"
      },
      "subAssetCount": 5,
      "createdAt": "2024-01-20T14:15:00.000Z"
    }
  ],
  "errors": []
}
```

**Response (Success - Filtered by Project):**
```bash
GET /api/v1/assets/groups?projectId=proj_abc123def456
```
```json
{
  "message": "Success",
  "content": [
    {
      "id": "grp_aaa111bbb222",
      "key": "player-sprites",
      "type": "sprites",
      "project": {
        "id": "proj_abc123def456",
        "name": "My Game Project"
      },
      "subAssetCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "errors": []
}
```

**Response Fields:**
- `id` - Asset group identifier (CUID)
- `key` - Asset group key (unique per project, e.g., "player-sprites")
- `type` - Asset type (`sprites`, `audio`, `models`)
- `project` - Parent project information
  - `id` - Project identifier
  - `name` - Project name
- `subAssetCount` - Number of sub-assets in this group
- `createdAt` - Group creation timestamp

**Business Logic:**
- Returns all asset groups if no project filter
- Filters by project ID if provided
- Includes project information for context
- Counts sub-assets per group
- Ordered by creation date (ascending)

---

### 2. Get Sub-Assets

**Endpoint:** `GET /api/v1/assets/sub-assets`

**Description:** Returns all sub-assets with optional filtering by asset group or project. Sub-assets are individual versioned assets within a group.

**Headers:**
- No authentication required

**Query Parameters:**
- `groupId` (string, optional): Filter by asset group ID
- `projectId` (string, optional): Filter by project ID

**Response (Success):**
```json
{
  "message": "Success",
  "content": [
    {
      "id": "sub_123abc456def",
      "key": "player-idle",
      "type": "sprite",
      "basePath": "sprites/player",
      "pathTemplate": "{base}/{key}_v{version}.{ext}",
      "currentVersion": 3,
      "rulePackKey": "sprite_static",
      "group": {
        "id": "grp_aaa111bbb222",
        "key": "player-sprites",
        "type": "sprites",
        "project": {
          "id": "proj_abc123def456",
          "name": "My Game Project"
        }
      },
      "versionCount": 3,
      "createdAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": "sub_789ghi012jkl",
      "key": "player-walk",
      "type": "sprite",
      "basePath": "sprites/player",
      "pathTemplate": "{base}/{key}_v{version}.{ext}",
      "currentVersion": 2,
      "rulePackKey": "sprite_animation",
      "group": {
        "id": "grp_aaa111bbb222",
        "key": "player-sprites",
        "type": "sprites",
        "project": {
          "id": "proj_abc123def456",
          "name": "My Game Project"
        }
      },
      "versionCount": 2,
      "createdAt": "2024-01-16T09:30:00.000Z"
    }
  ],
  "errors": []
}
```

**Response Fields:**
- `id` - Sub-asset identifier (CUID)
- `key` - Sub-asset key (unique per group, e.g., "player-idle")
- `type` - Asset type (inherits from group)
- `basePath` - Base storage path for this asset
- `pathTemplate` - Template for generating versioned paths
  - Variables: `{base}`, `{key}`, `{version}`, `{ext}`
- `currentVersion` - Current version number (auto-incremented)
- `rulePackKey` - Validation rule pack key (e.g., "sprite_static")
- `group` - Parent asset group with project info
- `versionCount` - Total number of versions in history
- `createdAt` - Sub-asset creation timestamp

**Query Combinations:**
```bash
# All sub-assets
GET /api/v1/assets/sub-assets

# Sub-assets in specific group
GET /api/v1/assets/sub-assets?groupId=grp_aaa111bbb222

# Sub-assets in specific project (across all groups)
GET /api/v1/assets/sub-assets?projectId=proj_abc123def456

# If both provided, groupId takes precedence
GET /api/v1/assets/sub-assets?groupId=grp_aaa111bbb222&projectId=proj_abc123def456
```

**Business Logic:**
- If `groupId` provided: Filter by specific group
- If `projectId` provided (no groupId): Filter by project across all groups
- If both provided: `groupId` takes precedence
- If neither provided: Return all sub-assets
- Ordered by creation date (ascending)
- Includes nested group and project information

---

### 3. Get Sub-Asset Version History

**Endpoint:** `GET /api/v1/assets/sub-assets/:id/history`

**Description:** Returns the complete version history for a specific sub-asset, ordered from newest to oldest. Each history entry represents a file upload with metadata.

**Headers:**
- No authentication required

**Path Parameters:**
- `id` (string, required): Sub-asset ID

**Response (Success):**
```json
{
  "message": "Success",
  "content": {
    "subAsset": {
      "id": "sub_123abc456def",
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
        "id": "hist_999zzz888yyy",
        "version": 3,
        "changeNote": "Updated sprite resolution to 512x512",
        "filePath": "sprites/player/player-idle_v3.png",
        "fileSize": 15360,
        "fileHash": "sha256:abc123def456...",
        "createdAt": "2024-03-01T10:00:00.000Z"
      },
      {
        "id": "hist_888yyy777xxx",
        "version": 2,
        "changeNote": "Fixed transparency issues",
        "filePath": "sprites/player/player-idle_v2.png",
        "fileSize": 14200,
        "fileHash": "sha256:def456ghi789...",
        "createdAt": "2024-02-15T14:30:00.000Z"
      },
      {
        "id": "hist_777xxx666www",
        "version": 1,
        "changeNote": "Initial upload",
        "filePath": "sprites/player/player-idle_v1.png",
        "fileSize": 12800,
        "fileHash": "sha256:ghi789jkl012...",
        "createdAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  },
  "errors": []
}
```

**Response Fields:**
- `subAsset` - Sub-asset summary
  - `id` - Sub-asset identifier
  - `key` - Sub-asset key
  - `group` - Parent group and project info
- `history` - Array of version history entries (newest first)
  - `id` - History entry identifier
  - `version` - Version number (sequential, starts at 1)
  - `changeNote` - Description of changes in this version
  - `filePath` - Resolved file path (relative to storage root)
  - `fileSize` - File size in bytes
  - `fileHash` - SHA-256 hash of file contents
  - `createdAt` - Version creation timestamp

**Response (Error - 404 Not Found):**
```json
{
  "message": "Sub-asset not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Sub-asset with ID sub_invalid does not exist"
    }
  ]
}
```

**Business Logic:**
- Validates sub-asset exists
- Returns all history entries ordered by version (descending)
- Includes resolved file paths
- Shows file integrity hashes
- Includes change notes from upload jobs

---

## Data Models

### Asset Group

```typescript
interface AssetGroup {
  id: string;           // CUID
  key: string;          // Unique per project (e.g., "player-sprites")
  type: AssetType;      // 'sprites' | 'audio' | 'models'
  projectId: string;    // Foreign key to Project
  createdAt: Date;
  updatedAt: Date;
}

type AssetType = 'sprites' | 'audio' | 'models';
```

### Sub-Asset

```typescript
interface SubAsset {
  id: string;              // CUID
  key: string;             // Unique per group (e.g., "player-idle")
  type: string;            // Asset type (e.g., "sprite")
  basePath: string;        // Storage base path
  pathTemplate: string;    // Path template with variables
  currentVersion: number;  // Current version number
  rulePackKey: string;     // Validation rule pack key
  groupId: string;         // Foreign key to AssetGroup
  createdAt: Date;
  updatedAt: Date;
}
```

### Asset History

```typescript
interface AssetHistory {
  id: string;          // CUID
  subAssetId: string;  // Foreign key to SubAsset
  version: number;     // Version number (sequential)
  changeNote: string;  // Description of changes
  filePath: string;    // Resolved file path
  fileSize: number;    // File size in bytes
  fileHash: string;    // SHA-256 hash
  createdAt: Date;
}
```

---

## Path Templates

### Template Variables

- `{base}` - Base path from sub-asset
- `{key}` - Sub-asset key
- `{version}` - Version number
- `{ext}` - File extension

### Example Templates

```
{base}/{key}_v{version}.{ext}
→ sprites/player/player-idle_v3.png

{base}/{key}/{version}/{key}.{ext}
→ sprites/player/3/player-idle.png

{base}/v{version}/{key}.{ext}
→ sprites/player/v3/player-idle.png
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid parameter",
  "content": null,
  "errors": [
    {
      "field": "projectId",
      "message": "Project ID must be a valid CUID"
    }
  ]
}
```

### 404 Not Found
```json
{
  "message": "Resource not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Sub-asset with ID sub_invalid does not exist"
    }
  ]
}
```

---

## Implementation Notes

### Performance Considerations
- Asset groups and sub-assets are indexed by project and group IDs
- History queries benefit from composite index on (subAssetId, version)
- Consider caching frequently accessed asset lists
- File hashes enable integrity verification and deduplication

### Future Enhancements
- Add asset creation/update/delete endpoints (requires auth)
- Add bulk operations for asset management
- Support asset tagging and search
- Add asset preview/thumbnail generation
- Implement asset download endpoints
- Add asset comparison between versions
- Support asset cloning/duplication
- Add asset metadata (dimensions, duration, etc.)

### Version Management
- Versions are auto-incremented starting from 1
- Versions are immutable once created
- Current version pointer updated on new uploads
- Full history maintained for auditability
- File paths resolved from template on upload

### Storage Integration
- Files stored using resolved paths
- Storage service handles actual file I/O
- Hashes verify file integrity
- Supports local filesystem and cloud storage adapters

---

## Usage Examples

### Get All Asset Groups
```bash
GET /api/v1/assets/groups
```

### Get Asset Groups for Project
```bash
GET /api/v1/assets/groups?projectId=proj_abc123def456
```

### Get All Sub-Assets
```bash
GET /api/v1/assets/sub-assets
```

### Get Sub-Assets in Group
```bash
GET /api/v1/assets/sub-assets?groupId=grp_aaa111bbb222
```

### Get Sub-Asset Version History
```bash
GET /api/v1/assets/sub-assets/sub_123abc456def/history
```
