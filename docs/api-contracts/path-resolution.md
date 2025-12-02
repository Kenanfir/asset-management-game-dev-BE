# Path Resolution API Contract

## Overview

This document outlines the API contract for path resolution. The path resolution service resolves asset paths from templates using variable substitution.

## Flow

1. **Resolve Path** - Submit template and variables
2. **Template Processing** - Replace variables in template
3. **Return Resolved Path** - Get final file path

---

## Endpoints

### 1. Resolve Path

**Endpoint:** `POST /api/v1/path/resolve`

**Description:** Resolves an asset file path from a template string by substituting variables. This endpoint is used to preview how path templates will be resolved during file uploads.

**Headers:**
- No authentication required (utility endpoint)
- `Content-Type: application/json`

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

**Request Fields:**
- `base` (string, required): Base storage path
- `key` (string, required): Asset key/identifier
- `version` (number, required): Version number (positive integer)
- `ext` (string, required): File extension (without dot)
- `pathTemplate` (string, required): Template string with variables

**Response (Success):**
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

**Response Fields:**
- `resolvedPath` - Final resolved path string
- `template` - Original template used
- `variables` - Variable values that were substituted

**Response (Error - 400 Bad Request - Missing Variable):**
```json
{
  "message": "Missing required variable",
  "content": null,
  "errors": [
    {
      "field": "base",
      "message": "Variable 'base' is required for this template"
    }
  ]
}
```

**Response (Error - 400 Bad Request - Invalid Template):**
```json
{
  "message": "Invalid path template",
  "content": null,
  "errors": [
    {
      "field": "pathTemplate",
      "message": "Template contains invalid variable syntax"
    }
  ]
}
```

**Business Logic:**
1. Validate all required variables are provided
2. Validate template syntax
3. Replace {variable} placeholders with values
4. Sanitize resolved path (prevent directory traversal)
5. Return resolved path with metadata

---

## Template Variables

### Standard Variables

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{base}` | string | Base storage path | `sprites/player` |
| `{key}` | string | Asset key/identifier | `player-idle` |
| `{version}` | number | Version number | `3` |
| `{ext}` | string | File extension | `png` |

### Variable Rules

- **Case Sensitive**: Variables are case-sensitive
- **Curly Braces**: Must be wrapped in `{` `}`
- **No Spaces**: Variable names cannot contain spaces
- **Alphanumeric**: Variable names must be alphanumeric with underscores

---

## Template Examples

### Common Templates

```javascript
// Version suffix
"{base}/{key}_v{version}.{ext}"
→ "sprites/player/player-idle_v3.png"

// Version directory
"{base}/{key}/{version}/{key}.{ext}"
→ "sprites/player/player-idle/3/player-idle.png"

// Version prefix
"{base}/v{version}/{key}.{ext}"
→ "sprites/player/v3/player-idle.png"

// Timestamped (custom variable)
"{base}/{key}/{version}_{timestamp}.{ext}"
→ "sprites/player/player-idle/3_20240301100000.png"

// Date-based directory
"{base}/{year}/{month}/{key}_v{version}.{ext}"
→ "sprites/player/2024/03/player-idle_v3.png"
```

### Complex Templates

```javascript
// Multi-level organization
"{base}/{category}/{subcategory}/{key}_v{version}.{ext}"
→ "assets/sprites/characters/player-idle_v3.png"

// Environment-specific
"{env}/{base}/{key}_v{version}.{ext}"
→ "dev/sprites/player/player-idle_v3.png"

// Platform-specific
"{base}/{platform}/{key}_v{version}.{ext}"
→ "sprites/player/pc/player-idle_v3.png"
```

---

## Path Sanitization

### Security Measures

The service sanitizes paths to prevent security issues:

1. **Directory Traversal Prevention**
   - Removes `..` sequences
   - Removes leading `/` 
   - Replaces multiple `/` with single `/`

2. **Validation**
   - Ensures resolved path doesn't escape storage root
   - Rejects paths with suspicious patterns

3. **Normalization**
   - Converts to relative paths
   - Removes redundant separators

### Example Sanitization

```javascript
// Input with directory traversal attempt
{
  base: "../../../etc",
  key: "passwd",
  version: 1,
  ext: "txt",
  template: "{base}/{key}.{ext}"
}

// Sanitized output (prevented)
→ Error: "Path traversal detected"

// Safe input
{
  base: "sprites/player",
  key: "player-idle",
  version: 1,
  ext: "png",
  template: "{base}/{key}_v{version}.{ext}"
}

// Sanitized output (allowed)
→ "sprites/player/player-idle_v1.png"
```

---

## Validation Rules

### Template Validation

- **Required**: Template must not be empty
- **Syntax**: Must contain at least one variable
- **Format**: Variables must use `{varName}` syntax
- **Characters**: Only alphanumeric, `/`, `-`, `_`, `.` allowed

### Variable Validation

- **Required Variables**: All variables in template must be provided
- **Type Checking**: 
  - `version` must be positive integer
  - Other variables must be non-empty strings
- **Character Limits**:
  - `base`: Max 255 characters
  - `key`: Max 100 characters
  - `ext`: Max 10 characters

---

## Use Cases

### 1. Preview Path Before Upload

Client can preview where files will be stored:

```javascript
// Before upload, show user where file will be saved
POST /api/v1/path/resolve
{
  base: "sprites/player",
  key: "player-idle",
  version: 4,  // Next version
  ext: "png",
  pathTemplate: "{base}/{key}_v{version}.{ext}"
}

// Response shows preview
→ "sprites/player/player-idle_v4.png"
```

### 2. Validate Template Configuration

Verify template works correctly during setup:

```javascript
// Test template with sample data
POST /api/v1/path/resolve
{
  base: "test/path",
  key: "test-asset",
  version: 1,
  ext: "png",
  pathTemplate: "{base}/{key}_v{version}.{ext}"
}

// Verify resolution works
→ "test/path/test-asset_v1.png"
```

### 3. Generate File Paths Programmatically

Applications can use this to generate consistent paths:

```javascript
// Generate paths for batch processing
for (let i = 1; i <= 10; i++) {
  POST /api/v1/path/resolve
  {
    base: "sprites/enemies",
    key: `enemy-${i}`,
    version: 1,
    ext: "png",
    pathTemplate: "{base}/{key}_v{version}.{ext}"
  }
}
```

---

## Error Responses

### 400 Bad Request - Missing Variable
```json
{
  "message": "Missing required variable",
  "content": null,
  "errors": [
    {
      "field": "version",
      "message": "Variable 'version' is required by the template"
    }
  ]
}
```

### 400 Bad Request - Invalid Version
```json
{
  "message": "Validation failed",
  "content": null,
  "errors": [
    {
      "field": "version",
      "message": "Version must be a positive integer"
    }
  ]
}
```

### 400 Bad Request - Invalid Template
```json
{
  "message": "Invalid template syntax",
  "content": null,
  "errors": [
    {
      "field": "pathTemplate",
      "message": "Template contains unclosed variable brace"
    }
  ]
}
```

### 400 Bad Request - Path Traversal
```json
{
  "message": "Invalid path",
  "content": null,
  "errors": [
    {
      "field": "base",
      "message": "Path traversal detected in base path"
    }
  ]
}
```

---

## Implementation Notes

### Performance
- Path resolution is stateless and fast
- No database queries required
- Can be cached if templates are static
- Suitable for high-frequency calls

### Security
- All inputs validated and sanitized
- Directory traversal prevention
- Path length limits enforced
- No arbitrary code execution

### Future Enhancements
- Add template validation endpoint (GET /path/validate-template)
- Support custom variable types (date, uuid, etc.)
- Add template presets/library
- Support conditional variables
- Add path existence checking
- Implement template versioning
- Add batch path resolution

### Integration
- Used internally by upload service
- Can be used by clients for UI previews
- Useful for testing and debugging
- Helps document path conventions

---

## Usage Examples

### Basic Path Resolution
```bash
curl -X POST http://localhost:4000/api/v1/path/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "base": "sprites/player",
    "key": "player-idle",
    "version": 3,
    "ext": "png",
    "pathTemplate": "{base}/{key}_v{version}.{ext}"
  }'
```

### Complex Template
```bash
curl -X POST http://localhost:4000/api/v1/path/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "base": "assets/sprites/characters",
    "key": "player-idle",
    "version": 5,
    "ext": "png",
    "pathTemplate": "{base}/{key}/v{version}/{key}.{ext}"
  }'
```

### Version Directory Template
```bash
curl -X POST http://localhost:4000/api/v1/path/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "base": "sprites",
    "key": "enemy-boss",
    "version": 10,
    "ext": "png",
    "pathTemplate": "{base}/v{version}/{key}.{ext}"
  }'
```
