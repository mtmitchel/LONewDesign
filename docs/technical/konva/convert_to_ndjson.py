#!/usr/bin/env python3
"""
Convert Konva.js markdown documentation files to newline-delimited JSON format.
Splits files to maintain 512MB size limit and ensures each line is valid JSON.
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any

def split_markdown_into_sections(content: str) -> List[Dict[str, Any]]:
    """
    Split markdown content into logical sections for JSON conversion.
    Each section is a JSON object with metadata and content.
    """
    lines = content.split('\n')
    sections = []
    current_section = {
        'title': 'Introduction',
        'level': 0,
        'content': []
    }
    
    for line in lines:
        # Detect heading levels
        if line.startswith('# '):
            if current_section['content'] or current_section['title'] != 'Introduction':
                sections.append(current_section)
            current_section = {
                'title': line.lstrip('# ').strip(),
                'level': 1,
                'content': []
            }
        elif line.startswith('## '):
            if current_section['content']:
                sections.append(current_section)
            current_section = {
                'title': line.lstrip('## ').strip(),
                'level': 2,
                'content': []
            }
        elif line.startswith('### '):
            if current_section['content']:
                sections.append(current_section)
            current_section = {
                'title': line.lstrip('### ').strip(),
                'level': 3,
                'content': []
            }
        else:
            current_section['content'].append(line)
    
    if current_section['content'] or current_section['title'] != 'Introduction':
        sections.append(current_section)
    
    return sections

def convert_markdown_to_ndjson(md_file_path: str, output_dir: str) -> None:
    """
    Convert a markdown file to newline-delimited JSON format.
    Splits into multiple files if necessary to stay under 512MB.
    """
    # Read markdown file
    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract filename without extension
    file_name = Path(md_file_path).stem
    
    # Split into sections
    sections = split_markdown_into_sections(content)
    
    # Convert sections to JSON records
    json_records = []
    current_file_size = 0
    file_number = 1
    output_records = []
    
    MAX_FILE_SIZE = 512 * 1024 * 1024  # 512 MB
    
    for idx, section in enumerate(sections):
        # Create JSON record
        json_record = {
            'id': f'{file_name}_section_{idx}',
            'source_file': file_name,
            'section_index': idx,
            'heading_level': section['level'],
            'title': section['title'],
            'content': '\n'.join(section['content']),
            'content_length': len('\n'.join(section['content']))
        }
        
        # Serialize to JSON
        json_line = json.dumps(json_record, ensure_ascii=False)
        json_line_size = len(json_line.encode('utf-8')) + 1  # +1 for newline
        
        # Check if we need a new file
        if current_file_size + json_line_size > MAX_FILE_SIZE and output_records:
            # Write current file
            output_path = os.path.join(output_dir, f'{file_name}_part_{file_number}.ndjson')
            with open(output_path, 'w', encoding='utf-8') as f:
                for record in output_records:
                    f.write(record + '\n')
            
            print(f"✓ Created {output_path} ({current_file_size / (1024*1024):.2f} MB)")
            
            # Reset for next file
            output_records = []
            current_file_size = 0
            file_number += 1
        
        output_records.append(json_line)
        current_file_size += json_line_size
    
    # Write final file
    if output_records:
        output_path = os.path.join(output_dir, f'{file_name}_part_{file_number}.ndjson')
        with open(output_path, 'w', encoding='utf-8') as f:
            for record in output_records:
                f.write(record + '\n')
        
        print(f"✓ Created {output_path} ({current_file_size / (1024*1024):.2f} MB)")

def main():
    """Convert all Konva documentation files to NDJSON format."""
    
    konva_dir = '/home/mason/Projects/therefore/docs/technical/konva'
    output_dir = os.path.join(konva_dir, 'json')
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Files to convert (complete documentation only, not quick references)
    files_to_convert = [
        'konva-complete-documentation.md',
        'konva-kimi-guide/konva-complete-guide.md'
    ]
    
    print("Converting Konva.js documentation to NDJSON format...\n")
    
    for file_name in files_to_convert:
        file_path = os.path.join(konva_dir, file_name)
        
        if os.path.exists(file_path):
            print(f"Processing: {file_name}")
            convert_markdown_to_ndjson(file_path, output_dir)
            print()
        else:
            print(f"⚠ File not found: {file_path}\n")
    
    print("✓ Conversion complete!")
    print(f"\nOutput files are in: {output_dir}")

if __name__ == '__main__':
    main()
