# Uploads API Contract

## Overview

This document outlines the API contract for file upload management. The upload system processes files asynchronously using a queue-based approach with background workers.

## Flow

1. **Upload Files** - Submit files for processing
2. **Job Creation** - Create upload job and queue for background processing
3. **Background Processing** - Worker processes files asynchronously
4. **Check Status** - Poll job status for completion

---

## Endpoints

### 1. Upload Files

**Endpoint:** `POST /api/v1/uploads`

**Description:** Uploads files for processing and queues them for background processing. Creates an upload job that can be tracked. Supports multiple files in a single request.

**Headers:**
- `Cookie: sid=<session_id>` (required)
- `Content-Type: multipart/form-data`

**Request Body (multipart/form-data):**
- `files` (file[], required): Files to upload (max 10 files, 10MB each)
- `targetSubassetIds` (string[], required): Target sub-asset IDs (JSON array)
- `mode` (enum, required): Upload mode (`SINGLE` | `SEQUENCE`)

**Form Data Example:**
```
files: [File, File, ...]
targetSubassetIds: ["sub_123abc456def", "sub_789ghi012jkl"]
mode: "SINGLE"
```

**Upload Modes:**
- `SINGLE`: Each file updates the first target sub-asset
- `SEQUENCE`: Files are distributed across target sub-assets in sequence

**Response (Success):**
```json
{
  "message": "Success",
  "content": {
    "id": "job_abc123def456",
    "status": "QUEUED",
    "mode": "SINGLE",
    "createdAt": "2024-03-01T10:00:00.000Z",
    "details": {
      "targetSubassetIds": ["sub_123abc456def"],
      "fileCount": 3
    }
  },
  "errors": []
}
```

**Response Fields:**
- `id` - Upload job identifier (CUID)
- `status` - Job status (`QUEUED`, `PROCESSING`, `DONE`, `ERROR`)
- `mode` - Upload mode used
- `createdAt` - Job creation timestamp
- `details` - Job metadata
  - `targetSubassetIds` - Target sub-asset IDs
  - `fileCount` - Number of files in this job

**Response (Error - 400 Bad Request - No Files):**
```json
{
  "message": "No files provided",
  "content": null,
  "errors": [
    {
      "field": "files",
      "message": "At least one file is required"
    }
  ]
}
```

**Response (Error - 400 Bad Request - Too Many Files):**
```json
{
  "message": "Too many files (max 10)",
  "content": null,
  "errors": [
    {
      "field": "files",
      "message": "Maximum 10 files allowed per upload"
    }
  ]
}
```

**Response (Error - 400 Bad Request - Invalid Sub-Assets):**
```json
{
  "message": "One or more target sub-assets not found",
  "content": null,
  "errors": [
    {
      "field": "targetSubassetIds",
      "message": "Sub-asset sub_invalid does not exist"
    }
  ]
}
```

**Response (Error - 401 Unauthorized):**
```json
{
  "message": "Unauthorized",
  "content": null,
  "errors": [
    {
      "field": "auth",
      "message": "Authentication required"
    }
  ]
}
```

**Business Logic:**
1. Validate user authentication
2. Validate file count (1-10 files)
3. Validate file sizes (max 10MB per file)
4. Validate target sub-assets exist
5. Validate files against rule pack constraints
6. Create upload job record in database
7. Queue job for background processing
8. Return job ID immediately (non-blocking)

**File Validation:**
- MIME type detection (server-side)
- Size limits enforced
- File type validation against rule pack
- Malformed file detection

---

### 2. Get Upload Job Status

**Endpoint:** `GET /api/v1/uploads/:id`

**Description:** Retrieves the current status of an upload job. Used to poll for job completion and results.

**Headers:**
- No authentication required (jobs are public by ID)

**Path Parameters:**
- `id` (string, required): Upload job ID

**Response (Success - Queued):**
```json
{
  "message": "Success",
  "content": {
    "id": "job_abc123def456",
    "status": "QUEUED",
    "mode": "SINGLE",
    "createdAt": "2024-03-01T10:00:00.000Z",
    "details": {
      "targetSubassetIds": ["sub_123abc456def"],
      "fileCount": 3
    }
  },
  "errors": []
}
```

**Response (Success - Processing):**
```json
{
  "message": "Success",
  "content": {
    "id": "job_abc123def456",
    "status": "PROCESSING",
    "mode": "SINGLE",
    "createdAt": "2024-03-01T10:00:00.000Z",
    "details": {
      "targetSubassetIds": ["sub_123abc456def"],
      "fileCount": 3
    }
  },
  "errors": []
}
```

**Response (Success - Completed):**
```json
{
  "message": "Success",
  "content": {
    "id": "job_abc123def456",
    "status": "DONE",
    "mode": "SINGLE",
    "createdAt": "2024-03-01T10:00:00.000Z",
    "completedAt": "2024-03-01T10:00:05.123Z",
    "details": {
      "results": [
        {
          "subAssetId": "sub_123abc456def",
          "version": 4,
          "path": "sprites/player/player-idle_v4.png",
          "size": 16500,
          "hash": "sha256:abc123def456..."
        },
        {
          "subAssetId": "sub_123abc456def",
          "version": 5,
          "path": "sprites/player/player-idle_v5.png",
          "size": 17200,
          "hash": "sha256:def456ghi789..."
        }
      ]
    }
  },
  "errors": []
}
```

**Response (Success - Failed):**
```json
{
  "message": "Success",
  "content": {
    "id": "job_abc123def456",
    "status": "ERROR",
    "mode": "SINGLE",
    "createdAt": "2024-03-01T10:00:00.000Z",
    "errorMessage": "Failed to process file: Invalid image format",
    "details": {
      "targetSubassetIds": ["sub_123abc456def"],
      "fileCount": 3
    }
  },
  "errors": []
}
```

**Response Fields:**
- `id` - Job identifier
- `status` - Current job status
- `mode` - Upload mode
- `createdAt` - Job creation timestamp
- `completedAt` - Job completion timestamp (if done)
- `errorMessage` - Error message (if failed)
- `details` - Job details and results
  - For queued/processing: Input metadata
  - For completed: Array of processed file results

**Result Object (when completed):**
- `subAssetId` - Sub-asset that was updated
- `version` - New version number created
- `path` - Resolved file path
- `size` - File size in bytes
- `hash` - SHA-256 hash of file

**Response (Error - 404 Not Found):**
```json
{
  "message": "Upload job not found",
  "content": null,
  "errors": [
    {
      "field": "id",
      "message": "Upload job with ID job_invalid does not exist"
    }
  ]
}
```

**Business Logic:**
- Validates job ID exists
- Returns current job state from database
- No authentication required (job IDs are opaque)
- Client should poll this endpoint for status updates

---

## Job Status State Machine

```
QUEUED ──→ PROCESSING ──→ DONE
                ↓
              ERROR
```

**Status Descriptions:**
- `QUEUED`: Job created, waiting for worker to pick up
- `PROCESSING`: Worker is processing files
- `DONE`: All files successfully processed
- `ERROR`: Processing failed with error message

---

## Background Processing

### Worker Process

1. **Pick Job**: Worker picks job from BullMQ queue
2. **Update Status**: Set job status to `PROCESSING`
3. **Process Files**: For each file:
   - Resolve target sub-asset
   - Calculate next version number
   - Resolve file path from template
   - Store file to filesystem
   - Calculate file hash
   - Create asset history entry
   - Update sub-asset current version
4. **Update Job**: Set status to `DONE` with results
5. **Error Handling**: On failure, set status to `ERROR`

### Retry Logic

- **Attempts**: 3 attempts per job
- **Backoff**: Exponential backoff (2s, 4s, 8s)
- **Failure**: After 3 attempts, job marked as `ERROR`

---

## File Validation

### Supported File Types

- **Images**: PNG, JPEG, GIF, WebP
- **Audio**: MP3, OGG, WAV
- **Models**: GLTF, FBX (binary)

### Validation Rules

| Rule | Value |
|------|-------|
| Max file size | 10 MB |
| Max files per upload | 10 |
| MIME types | Validated server-side |
| Filename | Sanitized for storage |

### Rule Pack Validation

Files are validated against the sub-asset's rule pack:
- `sprite_static`: PNG/JPG, max 1024x1024px
- `sprite_animation`: PNG spritesheets, max 2048x2048px
- `model_3d`: FBX/GLTF, optimized for real-time
- `audio_music`: MP3/OGG, 44.1kHz, stereo, max 5MB
- `audio_sfx`: WAV/OGG, 44.1kHz, mono/stereo, max 1MB

---

## Data Models

### Upload Job

```typescript
interface UploadJob {
  id: string;                    // CUID
  status: UploadJobStatus;       // Job status
  mode: UploadMode;              // Upload mode
  details: JsonValue;            // Metadata and results
  errorMessage: string | null;  // Error message if failed
  createdByUserId: string;       // User who created job
  createdAt: Date;
  completedAt: Date | null;
}

type UploadJobStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'ERROR';
type UploadMode = 'SINGLE' | 'SEQUENCE';
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "content": null,
  "errors": [
    {
      "field": "files",
      "message": "File exceeds maximum size of 10MB"
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
      "message": "Authentication required"
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
      "message": "Upload job not found"
    }
  ]
}
```

### 422 Unprocessable Entity
```json
{
  "message": "File validation failed",
  "content": null,
  "errors": [
    {
      "field": "files[0]",
      "message": "File type not allowed for this sub-asset"
    }
  ]
}
```

---

## Implementation Notes

### Performance Considerations
- File uploads are non-blocking (immediate response)
- Background workers scale independently
- Queue-based approach handles traffic spikes
- Database transactions ensure data consistency

### Security Considerations
- File MIME types validated server-side (not trusted from client)
- Files stored with sanitized names
- Directory traversal prevention
- File size limits enforced
- Malicious file detection

### Storage
- Files stored in local filesystem (configurable)
- Path resolution from templates
- File integrity verified with SHA-256 hashes
- Ready for S3/GCS adapter

### Future Enhancements
- Add upload progress tracking
- Support resumable uploads
- Add file preview generation
- Implement batch delete
- Add upload cancellation
- Support cloud storage (S3, GCS)
- Add webhook notifications for job completion
- Implement upload quotas per user

---

## Usage Examples

### Upload Single File
```bash
curl -X POST http://localhost:4000/api/v1/uploads \
  -H "Cookie: sid=<session_id>" \
  -F "files=@player-idle.png" \
  -F "targetSubassetIds=[\"sub_123abc456def\"]" \
  -F "mode=SINGLE"
```

### Upload Multiple Files
```bash
curl -X POST http://localhost:4000/api/v1/uploads \
  -H "Cookie: sid=<session_id>" \
  -F "files=@player-idle.png" \
  -F "files=@player-walk.png" \
  -F "files=@player-jump.png" \
  -F "targetSubassetIds=[\"sub_123abc456def\"]" \
  -F "mode=SINGLE"
```

### Check Upload Status
```bash
curl -X GET http://localhost:4000/api/v1/uploads/job_abc123def456
```

### Poll for Completion
```bash
# Client polling logic
while true; do
  status=$(curl -s http://localhost:4000/api/v1/uploads/job_abc123def456 | jq -r '.content.status')
  if [ "$status" = "DONE" ] || [ "$status" = "ERROR" ]; then
    break
  fi
  sleep 1
done
```
