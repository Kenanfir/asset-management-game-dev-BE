# Rule Packs API Contract

## Overview

This document outlines the API contract for validation rule packs. Rule packs define validation rules for different types of game assets.

## Flow

1. **Get Rule Packs** - Retrieve all available validation rule packs
2. **Apply Rules** - Rules are applied during file upload validation

---

## Endpoints

### 1. Get Available Rule Packs

**Endpoint:** `GET /api/v1/rule-packs`

**Description:** Returns all available validation rule packs. Rule packs define constraints and validation rules for different asset types.

**Headers:**
- No authentication required (public endpoint)

**Query Parameters:**
- None

**Response (Success):**
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

**Response Fields:**
- `key` - Unique rule pack identifier
- `displayName` - Human-readable name
- `rulesSummary` - Brief description of validation rules

**Business Logic:**
- Returns all available rule packs (currently hardcoded)
- Public endpoint - no authentication required
- Used for displaying validation requirements to users
- Rule packs are referenced by sub-assets during file validation

---

## Rule Pack Definitions

### sprite_static

**Purpose:** Static sprite images (PNG/JPG)

**Validation Rules:**
- **File Types**: PNG, JPEG
- **Max Dimensions**: 1024x1024 pixels
- **Preferred**: Power-of-2 dimensions (512x512, 1024x1024)
- **Color Depth**: 24-bit RGB or 32-bit RGBA
- **Max File Size**: 10MB

**Use Cases:**
- Character sprites
- UI elements
- Static background elements
- Icons and badges

---

### sprite_animation

**Purpose:** Animated sprite sheets

**Validation Rules:**
- **File Types**: PNG (transparency support)
- **Max Dimensions**: 2048x2048 pixels
- **Frame Requirements**: Consistent frame sizes
- **Color Depth**: 32-bit RGBA (transparency)
- **Max File Size**: 10MB

**Use Cases:**
- Character animations
- Effect animations
- Tilesets
- Animated UI elements

---

### model_3d

**Purpose:** 3D models for real-time rendering

**Validation Rules:**
- **File Types**: FBX, GLTF/GLB
- **Polygon Count**: Optimized for real-time (suggested < 50k tris)
- **Textures**: Embedded or referenced
- **Animations**: Supported (optional)
- **Max File Size**: 10MB

**Use Cases:**
- Character models
- Environment props
- Vehicles
- Weapons and items

---

### audio_music

**Purpose:** Background music tracks

**Validation Rules:**
- **File Types**: MP3, OGG
- **Sample Rate**: 44.1kHz
- **Channels**: Stereo (2 channels)
- **Bitrate**: 128-320 kbps
- **Max Duration**: No limit
- **Max File Size**: 5MB

**Use Cases:**
- Level background music
- Menu music
- Cutscene music
- Ambient soundscapes

---

### audio_sfx

**Purpose:** Sound effects

**Validation Rules:**
- **File Types**: WAV, OGG
- **Sample Rate**: 44.1kHz
- **Channels**: Mono or Stereo
- **Bitrate**: 128-192 kbps (for compressed formats)
- **Max Duration**: Typically < 10 seconds
- **Max File Size**: 1MB

**Use Cases:**
- UI sounds (clicks, hovers)
- Gameplay sounds (jumps, attacks)
- Impact sounds
- Ambient effects

---

## Validation Process

### During Upload

When files are uploaded, validation occurs in this order:

1. **MIME Type Detection**
   - Server-side detection using file content
   - Not relying on client-provided MIME type
   - Validates against rule pack allowed types

2. **File Size Validation**
   - Checks against rule pack max size
   - Individual file and total upload size

3. **Format-Specific Validation**
   - Image dimensions (for sprites)
   - Audio properties (for audio files)
   - Model complexity (for 3D models)

4. **Sub-Asset Rule Pack Matching**
   - Files validated against target sub-asset's rule pack
   - Validation fails if mismatch

---

## Data Model

### Rule Pack

```typescript
interface RulePack {
  key: string;           // Unique identifier
  displayName: string;   // Human-readable name
  rulesSummary: string;  // Brief description
}
```

### Detailed Rules (Internal)

```typescript
interface RulePackDetails {
  key: string;
  allowedMimeTypes: string[];       // ['image/png', 'image/jpeg']
  maxFileSize: number;              // In bytes
  maxDimensions?: {                 // For images
    width: number;
    height: number;
  };
  audioConstraints?: {              // For audio
    sampleRate: number;             // Hz
    channels: number;               // 1 = mono, 2 = stereo
    maxBitrate?: number;            // kbps
  };
  modelConstraints?: {              // For 3D models
    maxPolygons?: number;
    requiredFormat: string[];
  };
}
```

---

## Error Responses

### No Errors Expected

This endpoint returns a static list and should always succeed.

---

## Implementation Notes

### Current Implementation
- Rule packs are currently **hardcoded** in the service
- No database storage
- Returned from in-memory array
- Fast, cacheable response

### Future Enhancements
- Store rule packs in database
- Support custom rule pack creation
- Add detailed validation rules in response
- Support rule pack versioning
- Add rule pack categories/tags
- Implement rule pack templates
- Add validation preview/testing endpoint
- Support regex-based filename validation
- Add dependency rules (e.g., requires certain textures)

### Usage in Application

**1. Sub-Asset Configuration:**
```typescript
// Each sub-asset references a rule pack
{
  id: "sub_123",
  key: "player-idle",
  rulePackKey: "sprite_static"  // Validates against this pack
}
```

**2. Upload Validation:**
```typescript
// Before processing upload
const subAsset = await getSubAsset(targetId);
const rulePack = getRulePack(subAsset.rulePackKey);
const isValid = await validateFile(file, rulePack);
```

**3. UI Display:**
```typescript
// Show user what's allowed
GET /api/v1/rule-packs
// Display rules during sub-asset creation
```

### Caching Strategy
- Rule packs can be cached indefinitely (rarely change)
- Client can cache for session duration
- Server can keep in memory
- No need for database queries

---

## Usage Examples

### Get All Rule Packs
```bash
curl -X GET http://localhost:4000/api/v1/rule-packs
```

### Response Example
```json
{
  "message": "Success",
  "content": [
    {
      "key": "sprite_static",
      "displayName": "Static Sprites",
      "rulesSummary": "PNG/JPG images, max 1024x1024px, power-of-2 dimensions preferred"
    }
  ],
  "errors": []
}
```

---

## Integration Points

### Used By

1. **Sub-Asset Creation**
   - Select appropriate rule pack when creating sub-asset
   - Determines what files can be uploaded

2. **File Upload Validation**
   - Validates files against rule pack constraints
   - Rejects files that don't match rules

3. **UI/UX**
   - Display validation requirements to users
   - Show what file types are acceptable
   - Help users understand why uploads fail

### Dependencies

- **File Validation Service**: Implements actual validation logic
- **Upload Service**: Uses rule packs during processing
- **Sub-Asset Service**: References rule packs

---

## Validation Examples

### Valid Upload (sprite_static)
```bash
# File: player-idle.png (512x512, 2MB, PNG)
# Sub-asset rule pack: sprite_static
✅ PASS - Matches PNG/JPG requirement
✅ PASS - Within 1024x1024 limit
✅ PASS - Within 10MB limit
→ File accepted
```

### Invalid Upload (sprite_static)
```bash
# File: player-walk.gif (512x512, 1MB, GIF)
# Sub-asset rule pack: sprite_static
❌ FAIL - GIF not allowed (only PNG/JPG)
→ File rejected with error
```

### Invalid Upload (audio_sfx)
```bash
# File: background-music.mp3 (3 minutes, 6MB, MP3)
# Sub-asset rule pack: audio_sfx
❌ FAIL - File size (6MB) exceeds limit (1MB)
❌ FAIL - Duration too long for SFX
→ File rejected with error
```
