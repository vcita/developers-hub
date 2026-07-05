#!/usr/bin/env python3
"""
Script to remove "When to Use" sections from swagger JSON files.
"""

import json
import re
import os
from pathlib import Path

def remove_when_to_use_section(text):
    """Remove ## When to Use section from a description string."""
    if not text or "## When to Use" not in text:
        return text, False
    
    # Pattern matches "## When to Use" followed by content until end or next ## section
    # The section typically contains bullet points
    pattern = r'\n\n## When to Use\n[^#]*?(?=\n\n##|\n\n[A-Z]|"|\Z)'
    
    new_text = re.sub(pattern, '', text)
    
    # Also handle case where it's at the end without double newline before
    pattern2 = r'\n## When to Use\n[^#]*?(?=\n\n##|\n\n[A-Z]|"|\Z)'
    new_text = re.sub(pattern2, '', new_text)
    
    # Clean up trailing whitespace/newlines
    new_text = new_text.rstrip()
    
    return new_text, new_text != text

def process_json_value(value, changes):
    """Recursively process JSON values to find and modify descriptions."""
    if isinstance(value, dict):
        for key, val in value.items():
            if key == "description" and isinstance(val, str) and "## When to Use" in val:
                new_val, changed = remove_when_to_use_section(val)
                if changed:
                    value[key] = new_val
                    changes.append(key)
            else:
                process_json_value(val, changes)
    elif isinstance(value, list):
        for item in value:
            process_json_value(item, changes)
    return value

def process_file(filepath):
    """Process a single JSON file to remove When to Use sections."""
    changes = []
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Quick check if file contains the pattern
        if "## When to Use" not in content:
            return 0
        
        data = json.loads(content)
        process_json_value(data, changes)
        
        if changes:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
        return len(changes)
    
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    swagger_dir = Path("/Users/ram.almog/Documents/GitHub/developers-hub/swagger")
    
    results = {}
    total_changes = 0
    
    for json_file in swagger_dir.rglob("*.json"):
        changes = process_file(json_file)
        if changes > 0:
            relative_path = json_file.relative_to(swagger_dir.parent)
            results[str(relative_path)] = changes
            total_changes += changes
    
    # Generate report
    report = f"""# When to Use Section Removal Report

## Summary
- **Total files modified**: {len(results)}
- **Total sections removed**: {total_changes}

## Files Modified

| File | Sections Removed |
|------|------------------|
"""
    
    for file_path, count in sorted(results.items()):
        report += f"| {file_path} | {count} |\n"
    
    report += f"""
## What Was Removed

The "## When to Use" sections were removed from endpoint descriptions. These sections contained generic guidance like:
- Viewing full record details
- Building detail pages
- Verifying record existence
- Building list views and tables
- Searching for specific records
- Syncing data with external systems

These were removed as they added boilerplate text without providing specific, actionable information for each endpoint.

## Date
Generated: {os.popen('date').read().strip()}
"""
    
    # Write report
    report_path = Path("/Users/ram.almog/Documents/GitHub/developers-hub/api-validation/reports/when-to-use-removal-report.md")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(report_path, 'w') as f:
        f.write(report)
    
    print(f"Processed {len(results)} files, removed {total_changes} 'When to Use' sections")
    print(f"Report saved to: {report_path}")

if __name__ == "__main__":
    main()
