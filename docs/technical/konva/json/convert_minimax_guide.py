#!/usr/bin/env python3
"""
Convert the comprehensive_konvajs_documentation_guide.md to NDJSON format
and then to OpenAI Finetuning format.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any

def split_markdown_into_sections(content: str) -> List[Dict[str, Any]]:
    """
    Parse markdown content into sections based on heading levels.
    Preserves heading hierarchy and groups content under headings.
    """
    sections = []
    current_section = None
    section_index = 0
    lines = content.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Detect headings
        heading_match = re.match(r'^(#{1,3})\s+(.+)$', line)
        
        if heading_match:
            # Save previous section if exists
            if current_section and current_section['content'].strip():
                sections.append(current_section)
                section_index += 1
            
            # Create new section
            heading_level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()
            
            current_section = {
                'section_index': section_index,
                'heading_level': heading_level,
                'title': heading_text,
                'content': '',
                'content_length': 0
            }
            
            i += 1
        elif current_section is not None:
            # Add content to current section
            current_section['content'] += line + '\n'
            i += 1
        else:
            # Skip lines before first heading
            i += 1
    
    # Add final section
    if current_section and current_section['content'].strip():
        sections.append(current_section)
    
    # Clean up and calculate content length
    for section in sections:
        section['content'] = section['content'].strip()
        section['content_length'] = len(section['content'])
    
    # Remove empty sections
    sections = [s for s in sections if s['content_length'] > 0]
    
    return sections

def convert_markdown_to_ndjson(input_file: str, output_file: str, max_file_size: int = 512 * 1024 * 1024) -> None:
    """
    Convert markdown file to NDJSON with metadata.
    Splits into multiple files if needed to respect max_file_size.
    """
    print(f"Reading: {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    sections = split_markdown_into_sections(content)
    print(f"Extracted {len(sections)} sections")
    
    # Write NDJSON
    record_count = 0
    current_file_size = 0
    part_num = 1
    current_output = None
    
    for section in sections:
        # Create record with metadata
        record = {
            'id': f"konva-minimax-guide_{section['section_index']:03d}",
            'source_file': 'comprehensive_konvajs_documentation_guide.md',
            'section_index': section['section_index'],
            'heading_level': section['heading_level'],
            'title': section['title'],
            'content': section['content'],
            'content_length': section['content_length']
        }
        
        # Serialize record
        line = json.dumps(record, ensure_ascii=False) + '\n'
        line_size = len(line.encode('utf-8'))
        
        # Check if we need a new file
        if current_file_size + line_size > max_file_size and current_output is not None:
            current_output.close()
            print(f"  Part {part_num} written ({current_file_size} bytes)")
            part_num += 1
            current_file_size = 0
            current_output = None
        
        # Open new file if needed
        if current_output is None:
            output_path = output_file.replace('.ndjson', f'_part_{part_num}.ndjson')
            current_output = open(output_path, 'w', encoding='utf-8')
        
        # Write record
        current_output.write(line)
        current_file_size += line_size
        record_count += 1
    
    # Close final file
    if current_output is not None:
        current_output.close()
        print(f"  Part {part_num} written ({current_file_size} bytes)")
    
    print(f"✓ Converted {record_count} records to NDJSON")
    print(f"  Output pattern: {output_file.replace('.ndjson', '_part_*.ndjson')}")

def convert_ndjson_to_finetuning(input_file: str, output_file: str) -> None:
    """
    Convert NDJSON records to OpenAI finetuning format.
    Each record becomes a message array ending with assistant role.
    """
    record_count = 0
    
    # Handle part files
    base_path = input_file.rsplit('.', 1)[0] if '.' in input_file else input_file
    
    # Check if multiple parts exist
    import glob
    part_files = sorted(glob.glob(f"{base_path}_part_*.ndjson"))
    
    # Exclude any files that already end with _finetuning
    part_files = [f for f in part_files if not f.endswith('_finetuning.ndjson')]
    
    if not part_files:
        # Single file (but check it's not a finetuning file)
        if input_file.endswith('_finetuning.ndjson'):
            print(f"⚠ Skipping already-finetuned file: {input_file}")
            return
        input_files = [input_file]
    else:
        input_files = part_files
    
    for input_path in input_files:
        output_path = input_path.replace('.ndjson', '_finetuning.ndjson')
        
        with open(input_path, 'r', encoding='utf-8') as infile:
            with open(output_path, 'w', encoding='utf-8') as outfile:
                part_count = 0
                for line in infile:
                    if not line.strip():
                        continue
                    
                    # Parse the NDJSON record
                    record = json.loads(line.strip())
                    
                    # Create system message with metadata
                    system_content = f"Section: {record['title']}\nLevel: H{record['heading_level']}\nSource: {record['source_file']}"
                    
                    # Create the finetuning message format with assistant response
                    finetuning_record = {
                        "messages": [
                            {"role": "system", "content": system_content},
                            {"role": "user", "content": record['content']},
                            {"role": "assistant", "content": "This documentation has been reviewed and is ready for reference."}
                        ]
                    }
                    
                    # Write as NDJSON
                    outfile.write(json.dumps(finetuning_record, ensure_ascii=False) + '\n')
                    part_count += 1
                    record_count += 1
        
        print(f"✓ Converted {part_count} records to finetuning format")
        print(f"  Output: {output_path}")

def main():
    """Convert comprehensive guide to NDJSON and finetuning formats."""
    
    json_dir = '/home/mason/Projects/therefore/docs/technical/konva/json'
    guide_path = '/home/mason/Projects/therefore/docs/technical/konva/konva-minimax-guide/comprehensive_konvajs_documentation_guide.md'
    base_output = os.path.join(json_dir, 'konva-minimax-guide')
    
    if not os.path.exists(guide_path):
        print(f"✗ File not found: {guide_path}")
        return
    
    print("=" * 70)
    print("Converting Konva Minimax Guide to NDJSON")
    print("=" * 70)
    
    # Convert to NDJSON
    print("\n📋 STEP 1: Markdown → NDJSON")
    print("-" * 70)
    convert_markdown_to_ndjson(guide_path, base_output + '.ndjson')
    
    # Convert to finetuning format
    print("\n🔄 STEP 2: NDJSON → OpenAI FinetuningMessages")
    print("-" * 70)
    convert_ndjson_to_finetuning(base_output + '.ndjson', base_output + '_finetuning.ndjson')
    
    print("\n✓ Conversion complete!")

if __name__ == '__main__':
    main()
