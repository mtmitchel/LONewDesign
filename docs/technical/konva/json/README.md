# Konva.js Documentation - NDJSON Format

## Overview

This directory contains the Konva.js complete documentation files converted to **newline-delimited JSON (NDJSON)** format. NDJSON is ideal for processing large documentation sets efficiently while maintaining data structure and allowing easy parsing.

## Files

### Generated Files

- **konva-complete-documentation_part_1.ndjson** (167 KB)
  - Complete API reference and comprehensive Konva.js documentation
  - Source: `../konva-complete-documentation.md`
  - 282 sections covering all major topics

- **konva-complete-guide_part_1.ndjson** (26 KB)
  - Complete Konva.js guide with practical examples
  - Source: `../konva-kimi-guide/konva-complete-guide.md`
  - 57 sections with step-by-step tutorials

## Format Specification

Each line in the NDJSON files is a valid JSON object with the following structure:

```json
{
  "id": "konva-complete-documentation_section_0",
  "source_file": "konva-complete-documentation",
  "section_index": 0,
  "heading_level": 1,
  "title": "Konva.js Complete Documentation",
  "content": "**Extracted on:** October 25, 2025\n**Source:** https://konvajs.org\n\n---",
  "content_length": 75
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the section (format: `source_file_section_N`) |
| `source_file` | string | Name of the original markdown file (without extension) |
| `section_index` | integer | Zero-based index of the section within the document |
| `heading_level` | integer | Markdown heading level (1=h1, 2=h2, 3=h3) |
| `title` | string | Section heading text |
| `content` | string | Full content of the section (may contain newlines) |
| `content_length` | integer | Character count of the content field |

## Usage Examples

### JavaScript/Node.js

```javascript
const fs = require('fs');
const readline = require('readline');

async function readNDJSON(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const record = JSON.parse(line);
    console.log(`${record.title} (${record.heading_level})`);
    console.log(record.content.substring(0, 100) + '...\n');
  }
}

readNDJSON('konva-complete-documentation_part_1.ndjson');
```

### Python

```python
import json

def read_ndjson(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            record = json.loads(line.strip())
            print(f"{record['title']} (Level {record['heading_level']})")
            print(f"Content length: {record['content_length']} chars\n")

read_ndjson('konva-complete-documentation_part_1.ndjson')
```

### Python (Pandas)

```python
import pandas as pd

# Read NDJSON into DataFrame
df = pd.read_json(
    'konva-complete-documentation_part_1.ndjson',
    lines=True,
    orient='records'
)

# Filter by heading level
h1_sections = df[df['heading_level'] == 1]
print(h1_sections[['title', 'content_length']])

# Search for sections by title
api_sections = df[df['title'].str.contains('API', case=False, na=False)]
print(api_sections)
```

### Command Line (jq)

```bash
# Count total sections
jq -s 'length' konva-complete-documentation_part_1.ndjson

# List all section titles
jq -r '.title' konva-complete-documentation_part_1.ndjson

# Filter sections by level
jq 'select(.heading_level == 2)' konva-complete-documentation_part_1.ndjson

# Search for specific content
jq 'select(.title | contains("Animation"))' konva-complete-documentation_part_1.ndjson
```

## Size Considerations

| File | Size | Records | Avg Size/Record |
|------|------|---------|-----------------|
| konva-complete-documentation_part_1.ndjson | 167 KB | 282 | ~592 bytes |
| konva-complete-guide_part_1.ndjson | 26 KB | 57 | ~456 bytes |
| **Total** | **193 KB** | **339** | ~569 bytes |

**Note:** All files remain well below the 512 MB size limit, allowing for future expansion.

## Content Coverage

### konva-complete-documentation_part_1.ndjson

- Introduction & Installation
- API Reference (all core classes)
- Shapes (Circle, Rect, Line, Text, Image, etc.)
- Styling (Fill, Stroke, Opacity, Shadow, etc.)
- Events (Mouse, Touch, Pointer, Drag, Transform)
- Drag and Drop
- Selection & Transform
- Clipping
- Groups and Layers
- Filters (Blur, Grayscale, Brightness, etc.)
- Tweens & Animations
- Performance Optimization
- Framework Integrations (React, Vue)
- Serialization & Data Export

### konva-complete-guide_part_1.ndjson

- Introduction & Getting Started
- Core Concepts (Stage, Layer, Group)
- All Shapes with Examples
- Styling Techniques
- Event Handling
- Animation & Tweening
- Drag and Drop
- Transform & Resize
- Filters
- Performance Tips
- Advanced Topics
- Quick Reference

## Splitting Logic

Files are automatically split based on:

1. **Section boundaries** - Each markdown heading becomes a separate record
2. **Size limit** - 512 MB maximum per output file
3. **Sequential ordering** - Records maintain original document order

Current files are well under the 512 MB limit, so all content fits in single output files per source document.

## Conversion Process

The conversion was performed using `convert_to_ndjson.py` script which:

1. **Reads** markdown files line by line
2. **Parses** heading levels (# ## ###)
3. **Groups** content into logical sections
4. **Serializes** each section to JSON
5. **Validates** JSON format on each line
6. **Splits** files if they exceed 512 MB
7. **Encodes** content as UTF-8 with proper escaping

## Updating Content

To regenerate the NDJSON files after updating source markdown:

```bash
cd /home/mason/Projects/therefore/docs/technical/konva
python3 convert_to_ndjson.py
```

This will:
- Overwrite existing NDJSON files
- Process both `konva-complete-documentation.md` and `konva-kimi-guide/konva-complete-guide.md`
- Create numbered output files as needed

## Technical Notes

### Newline Handling

Content fields may contain literal `\n` characters (escaped in JSON) to preserve original markdown formatting including:
- Code block lines
- Bullet points
- Multi-line examples
- Paragraph breaks

### Special Characters

All special characters are properly JSON-escaped:
- `"` → `\"`
- `\` → `\\`
- Newlines → `\n`
- Unicode → `\uXXXX` (when necessary)

### Performance Characteristics

- **Sequential Reading**: Stream NDJSON files line-by-line for memory efficiency
- **Random Access**: Load entire file into memory if < 50 MB (both current files qualify)
- **Searching**: Use grep or jq for header filtering without loading full content
- **Processing**: Parse only needed records for targeted operations

## Storage Location

```
/home/mason/Projects/therefore/docs/technical/konva/json/
├── konva-complete-documentation_part_1.ndjson
├── konva-complete-guide_part_1.ndjson
├── README.md (this file)
└── convert_to_ndjson.py (conversion script)
```

## File Integrity

Verify file integrity:

```bash
# Count lines (should match record count)
wc -l konva-complete-documentation_part_1.ndjson

# Validate JSON structure
python3 -c "
import json
count = 0
with open('konva-complete-documentation_part_1.ndjson') as f:
    for line in f:
        json.loads(line)
        count += 1
print(f'✓ Valid: {count} records')
"
```

## Use Cases

1. **ML/AI Training Data**: Load documentation sections for model training
2. **Search Indexing**: Index by section titles and content
3. **API Documentation Generation**: Convert to multiple output formats
4. **Knowledge Bases**: Populate RAG systems with structured documentation
5. **Analytics**: Analyze documentation structure and coverage
6. **Backup & Archival**: Preserve structured copy of documentation
7. **Multi-format Export**: Convert to CSV, Parquet, database records, etc.

## Version Information

- **Generated**: October 25, 2025
- **Konva.js Documentation**: Latest (v10)
- **Format Version**: NDJSON 1.0
- **Python Version**: 3.6+
- **Encoding**: UTF-8

## Related Files

- Source markdown: `../konva-complete-documentation.md`
- Kimi guide markdown: `../konva-kimi-guide/konva-complete-guide.md`
- Conversion script: `./convert_to_ndjson.py`
- This README: `./README.md`

---

*For more information about NDJSON format, see: http://ndjson.org/*
