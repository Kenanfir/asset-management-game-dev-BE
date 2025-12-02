# Projects API Contract

## Overview

This document outlines the API contract for project management. Projects are the top-level organizational unit that contain asset groups and sub-assets for game development.

## Flow

1. **List Projects** - Fetch all projects with statistics
2. **Get Project Details** - Retrieve specific project information
3. **Get Project Assets** - Fetch paginated assets for a project

---

## Endpoints

### 1. List All Projects

**Endpoint:** `GET /api/v1/projects`

**Description:** Returns all projects with aggregate statistics including asset group count and total sub-assets.

**Headers:**
- No authentication required (public endpoint for now)

**Query Parameters:**
- None

**Response (Success):**
```json
{
  "message": "Success", 
  "content": [
    {
      "id": "proj_abc123def456",
      "name": "My Game Project",
      "githubUrl": "https://github.com/username/my-game",
      "assetGroupCount": 5,
      "totalSubAssets": 42,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "proj_xyz789ghi012",
      "name": "Another Game",
      "githubUrl": null,
      "assetGroupCount": 3,
      "totalSubAssets": 28,
      "createdAt": "2024-02-20T14:45:00.000Z"
    }
  ],
  "errors": []
}
```

**Response Fields:**
- `id` - Unique project identifier (CUID)
- `name` - Project name
- `githubUrl` - GitHub repository URL (optional)
- `assetGroupCount` - Number of asset groups in project
- `totalSubAssets` - Total number of sub-assets across all groups
- `createdAt` - Project creation timestamp (ISO 8601)

**Business Logic:**
- Returns all projects ordered by creation date (ascending)
- Aggregates counts using database relations
- No pagination (assumes reasonable number of projects)
- Public endpoint - no authentication required

---

### 2. Get Project Details

**Endpoint:** `GET /api/v1/projects/:id`

**Description:** Returns detailed information about a specific project including all its asset groups.

**Headers:**
- No authentication required

**Path Parameters:**
- `id` (string, required): Project ID (CUID format)

**Response (Success):**
```json
{
  "message": "Success",
  "content": {
    "id": "proj_abc123def456",
    "name": "My Game Project",
    "githubUrl": "https://github.com/username/my-game",
    "assetGroups": [
      {
        "id": "grp_aaa111bbb222",
        "key": "player-sprites",
        "type": "sprites",
        "subAssetCount": 15
      },
      {
        "id": "grp_ccc333ddd444",
        "key": "ui-elements",
        "type": "sprites",
        "subAssetCount": 8
      },
      {
        "id": "grp_eee555fff666",
        "key": "background-music",
        "type": "audio",
        "subAssetCount": 5
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "errors": []
}
```

**Response Fields:**
- `id` - Project identifier
- `name` - Project name
- `githubUrl` - GitHub repository URL (nullable)
- `assetGroups` - Array of asset groups in this project
  - `id` - Asset group identifier
  - `key` - Asset group key (unique per project)
  - `type` - Asset type (`sprites`, `audio`, `models`)
  - `subAssetCount` - Number of sub-assets in this group
- `createdAt` - Project creation timestamp

**Response (Error - 404 Not Found):**
```json
{
  "message": "Project not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Project with ID proj_invalid does not exist"
    }
  ]
}
```

**Business Logic:**
- Validates project ID format (CUID)
- Returns 404 if project doesn't exist
- Includes all asset groups with sub-asset counts
- Asset groups ordered by creation date

---

### 3. Get Project Assets (Paginated)

**Endpoint:** `GET /api/v1/projects/:id/assets`

**Description:** Returns all sub-assets for a project with pagination support. Useful for browsing all assets across multiple asset groups.

**Headers:**
- No authentication required

**Path Parameters:**
- `id` (string, required): Project ID

**Query Parameters:**
- `page` (number, optional, default: 1): Page number (starts at 1)
- `limit` (number, optional, default: 20): Items per page (max: 100)

**Response (Success):**
```json
{
  "message": "Success",
  "content": {
    "data": [
      {
        "id": "sub_123abc456def",
        "key": "player-idle",
        "type": "sprite",
        "currentVersion": 3,
        "basePath": "sprites/player",
        "pathTemplate": "{base}/{key}_v{version}.{ext}",
        "rulePackKey": "sprite_static",
        "group": {
          "id": "grp_aaa111bbb222",
          "key": "player-sprites",
          "type": "sprites"
        }
      },
      {
        "id": "sub_789ghi012jkl",
        "key": "player-walk",
        "type": "sprite",
        "currentVersion": 2,
        "basePath": "sprites/player",
        "pathTemplate": "{base}/{key}_v{version}.{ext}",
        "rulePackKey": "sprite_animation",
        "group": {
          "id": "grp_aaa111bbb222",
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

**Response Fields:**
- `data` - Array of sub-assets
  - `id` - Sub-asset identifier
  - `key` - Sub-asset key (unique per group)
  - `type` - Asset type
  - `currentVersion` - Current version number
  - `basePath` - Storage base path
  - `pathTemplate` - Path template for versioning
  - `rulePackKey` - Validation rule pack key
  - `group` - Parent asset group info
- `pagination` - Pagination metadata
  - `page` - Current page number
  - `limit` - Items per page
  - `total` - Total number of assets
  - `totalPages` - Total number of pages

**Response (Error - 400 Bad Request - Invalid Pagination):**
```json
{
  "message": "Invalid pagination parameters",
  "content": null,
  "errors": [
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

**Response (Error - 404 Not Found):**
```json
{
  "message": "Project not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Project with ID proj_invalid does not exist"
    }
  ]
}
```

**Business Logic:**
- Validates project exists
- Fetches sub-assets across all asset groups for the project
- Supports pagination with sensible defaults
- Maximum limit of 100 items per page
- Results ordered by creation date (ascending)
- Includes parent group information for context

---

## Data Models

### Project

```typescript
interface Project {
  id: string;           // CUID
  name: string;         // Project name
  githubUrl: string | null;  // GitHub repository URL
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
}
```

### Project Statistics

```typescript
interface ProjectWithStats {
  id: string;
  name: string;
  githubUrl: string | null;
  assetGroupCount: number;    // Count of asset groups
  totalSubAssets: number;     // Total sub-assets across all groups
  createdAt: Date;
}
```

---

## Validation Rules

### Project ID
- Must be valid CUID format
- Example: `proj_abc123def456`

### Pagination
- `page`: Must be positive integer (≥ 1)
- `limit`: Must be between 1 and 100
- Default `page`: 1
- Default `limit`: 20

### GitHub URL
- Must be valid URL format if provided
- Pattern: `https://github.com/username/repository`
- Optional field (can be null)

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "content": null,
  "errors": [
    {
      "field": "page",
      "message": "Page must be a positive integer"
    },
    {
      "field": "limit",
      "message": "Limit must be between 1 and 100"
    }
  ]
}
```

### 404 Not Found
```json
{
  "message": "Project not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Project with ID proj_abc123 does not exist"
    }
  ]
}
```

---

## Implementation Notes

### Performance Considerations
- Asset group counts are calculated via database aggregation
- Consider caching project lists for frequently accessed data
- Pagination prevents large result sets
- Database indexes on:
  - `projects.id` (primary key)
  - `assetGroups.projectId` (foreign key)
  - `subAssets.groupId` (foreign key)

### Future Enhancements
- Add project creation/update/delete endpoints (requires auth)
- Add project search and filtering
- Add project owners/collaborators
- Support project tags/categories
- Add project archiving
- Include project statistics (total file size, last updated, etc.)
- Add project activity feed

### Database Relationships
```
Project (1) ──── (N) AssetGroup (1) ──── (N) SubAsset
```

### Authorization (Future)
- Currently all endpoints are public
- Future: Add authentication for project mutations
- Future: Add role-based access control (owner, collaborator, viewer)
- Future: Add private projects

---

## Usage Examples

### Get All Projects
```bash
GET /api/v1/projects
```

### Get Specific Project
```bash
GET /api/v1/projects/proj_abc123def456
```

### Get Project Assets (First Page)
```bash
GET /api/v1/projects/proj_abc123def456/assets
```

### Get Project Assets (Second Page, 50 items)
```bash
GET /api/v1/projects/proj_abc123def456/assets?page=2&limit=50
```
