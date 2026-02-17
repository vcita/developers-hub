#!/usr/bin/env python3
"""
Swagger Documentation Enhancement Script

This script enhances API documentation in swagger files by adding:
- Overview sections
- When to Use sections  
- Token availability statements (at the end only)

IMPORTANT: This script properly handles existing content to avoid duplications.
It extracts base descriptions, token info, and sections separately, then
rebuilds the description cleanly.

Usage:
    python scripts/enhance_swagger_descriptions.py

Options:
    --validate-only    Only validate, don't modify files
    --file <path>      Process a single file only
"""

import json
import glob
import re
import argparse
import sys
from pathlib import Path


def extract_token_info(text: str) -> tuple[str | None, str]:
    """
    Extract token availability statement from text.
    Returns: (token_statement, text_without_token)
    """
    patterns = [
        r'\n*\*\*[Aa]vailable for [^*]+\*\*\n*',
        r'\n*[Aa]vailable for \*\*[^*]+\*\*\n*',
        r'\n*\*\*[Oo]nly available for [^*]+\*\*\n*',
        r'\n*[Oo]nly available for \*\*[^*]+\*\*\n*',
    ]
    
    token_statement = None
    text_without_token = text
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            if token_statement is None:
                token_statement = match.group(0).strip()
            # Remove ALL occurrences
            text_without_token = re.sub(pattern, '\n\n', text_without_token)
    
    # Normalize token statement formatting
    if token_statement:
        # Ensure it has ** markers
        if not token_statement.startswith('**'):
            if 'Available for' in token_statement:
                token_statement = token_statement.replace('Available for', '**Available for')
            elif 'available for' in token_statement:
                token_statement = token_statement.replace('available for', '**Available for')
        if not token_statement.endswith('**'):
            token_statement = token_statement.rstrip() + '**'
    
    return token_statement, text_without_token.strip()


def extract_base_description(text: str) -> str:
    """
    Extract the base description (first sentence/paragraph before any sections).
    """
    # Remove section headers and get first part
    parts = re.split(r'## [^\n]+', text)
    base = parts[0].strip() if parts else text.strip()
    
    # Clean up
    base = re.sub(r'\n{2,}', ' ', base)
    base = base.strip().rstrip('.')
    
    return base


def get_when_to_use_content(method: str, path: str) -> str:
    """
    Generate appropriate 'When to Use' content based on HTTP method and path.
    """
    method = method.upper()
    
    if method == 'GET':
        if '{' not in path:  # List endpoint
            return (
                "- Building list views and tables\n"
                "- Searching for specific records\n"
                "- Syncing data with external systems"
            )
        else:  # Single resource
            return (
                "- Viewing full record details\n"
                "- Building detail pages\n"
                "- Verifying record existence"
            )
    elif method == 'POST':
        return (
            "- Creating new records\n"
            "- Submitting forms\n"
            "- Triggering operations"
        )
    elif method in ['PUT', 'PATCH']:
        return (
            "- Updating existing records\n"
            "- Modifying settings\n"
            "- Changing status"
        )
    elif method == 'DELETE':
        return (
            "- Removing records\n"
            "- Canceling operations\n"
            "- Cleanup tasks"
        )
    
    return "- Standard API operation"


def enhance_description(desc: str, method: str, path: str, default_token: str = "Staff, App, and Directory tokens") -> str:
    """
    Enhance a description by adding Overview and When to Use sections.
    
    IMPORTANT: This function extracts components separately to avoid duplication:
    1. Extract and remove token info
    2. Extract base description
    3. Parse any existing sections
    4. Rebuild cleanly with token at the end only
    """
    if not desc:
        return f"API endpoint.\n\n**Available for {default_token}**"
    
    # 1. Extract token info (removes all occurrences from text)
    token_info, text_without_token = extract_token_info(desc)
    
    if token_info is None:
        token_info = f"**Available for {default_token}**"
    
    # 2. Check if already has sections
    has_overview = '## Overview' in text_without_token
    has_when_to_use = '## When to Use' in text_without_token
    
    # 3. Extract base description
    base = extract_base_description(text_without_token)
    
    # 4. Parse existing sections if present
    overview_content = base
    when_to_use_content = None
    
    if has_overview:
        overview_match = re.search(r'## Overview\s*\n(.*?)(?=## |$)', text_without_token, re.DOTALL)
        if overview_match:
            overview_content = overview_match.group(1).strip()
            # Remove duplicate base descriptions
            overview_content = re.sub(re.escape(base) + r'\.?\s*', '', overview_content, count=10).strip()
            if not overview_content:
                overview_content = base
    
    if has_when_to_use:
        when_match = re.search(r'## When to Use\s*\n(.*?)(?=## |$)', text_without_token, re.DOTALL)
        if when_match:
            when_to_use_content = when_match.group(1).strip()
    
    # 5. Generate When to Use if not present
    if not when_to_use_content:
        when_to_use_content = get_when_to_use_content(method, path)
    
    # 6. Rebuild description cleanly
    result = base.rstrip('.') + '.'
    
    result += f"\n\n## Overview\n{overview_content.rstrip('.') + '.'}"
    
    result += f"\n\n## When to Use\n{when_to_use_content}"
    
    result += f"\n\n{token_info}"
    
    # Final cleanup
    result = re.sub(r'\n{3,}', '\n\n', result)
    
    return result.strip()


def validate_description(desc: str) -> list[str]:
    """
    Validate a description for common issues.
    Returns list of issues found.
    """
    issues = []
    
    # Check for multiple token statements
    token_count = len(re.findall(r'[Aa]vailable for \*\*[^*]+\*\*', desc))
    if token_count > 1:
        issues.append(f"Multiple token statements ({token_count})")
    
    # Check for duplicate sentences
    sentences = re.split(r'(?<=[.!?])\s+', desc)
    seen = set()
    for s in sentences:
        s_clean = re.sub(r'\s+', ' ', s.lower().strip().rstrip('.'))
        if len(s_clean) > 20:
            if s_clean in seen:
                issues.append(f"Duplicate sentence: '{s[:40]}...'")
            seen.add(s_clean)
    
    return issues


def process_file(filepath: str, validate_only: bool = False) -> dict:
    """
    Process a single swagger file.
    Returns stats about what was done.
    """
    stats = {
        'endpoints': 0,
        'enhanced': 0,
        'issues_before': 0,
        'issues_after': 0,
        'errors': []
    }
    
    try:
        # Read with duplicate key detection
        def check_duplicates(pairs):
            d = {}
            for k, v in pairs:
                if k in d:
                    raise ValueError(f'Duplicate JSON key: {k}')
                d[k] = v
            return d
        
        with open(filepath, 'r') as f:
            data = json.load(f, object_pairs_hook=check_duplicates)
        
        modified = False
        
        for path, methods in data.get('paths', {}).items():
            for method, details in methods.items():
                if method.lower() not in ['get', 'post', 'put', 'patch', 'delete']:
                    continue
                
                stats['endpoints'] += 1
                desc = details.get('description', '')
                
                # Check for issues before
                issues_before = validate_description(desc)
                if issues_before:
                    stats['issues_before'] += 1
                
                if not validate_only:
                    # Enhance the description
                    enhanced_desc = enhance_description(desc, method, path)
                    
                    if enhanced_desc != desc:
                        details['description'] = enhanced_desc
                        modified = True
                        stats['enhanced'] += 1
                    
                    # Check for issues after
                    issues_after = validate_description(enhanced_desc)
                    if issues_after:
                        stats['issues_after'] += 1
                        stats['errors'].extend([f"{method.upper()} {path}: {i}" for i in issues_after])
        
        if modified and not validate_only:
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
        
    except Exception as e:
        stats['errors'].append(str(e))
    
    return stats


def main():
    parser = argparse.ArgumentParser(description='Enhance swagger documentation')
    parser.add_argument('--validate-only', action='store_true', help='Only validate, do not modify')
    parser.add_argument('--file', type=str, help='Process a single file')
    args = parser.parse_args()
    
    # Find swagger files
    if args.file:
        files = [args.file]
    else:
        files = glob.glob('swagger/**/*.json', recursive=True)
    
    files.sort()
    
    total_stats = {
        'files': 0,
        'endpoints': 0,
        'enhanced': 0,
        'issues_before': 0,
        'issues_after': 0,
        'errors': []
    }
    
    for filepath in files:
        stats = process_file(filepath, args.validate_only)
        total_stats['files'] += 1
        total_stats['endpoints'] += stats['endpoints']
        total_stats['enhanced'] += stats['enhanced']
        total_stats['issues_before'] += stats['issues_before']
        total_stats['issues_after'] += stats['issues_after']
        total_stats['errors'].extend(stats['errors'])
        
        if stats['enhanced'] > 0 or stats['errors']:
            action = 'Validated' if args.validate_only else 'Processed'
            print(f"{action}: {filepath} ({stats['enhanced']} enhanced)")
    
    # Print summary
    print('\n' + '=' * 60)
    print('SUMMARY')
    print('=' * 60)
    print(f"Files:             {total_stats['files']}")
    print(f"Endpoints:         {total_stats['endpoints']}")
    
    if not args.validate_only:
        print(f"Enhanced:          {total_stats['enhanced']}")
    
    print(f"Issues before:     {total_stats['issues_before']}")
    print(f"Issues after:      {total_stats['issues_after']}")
    
    if total_stats['errors']:
        print(f"\nErrors ({len(total_stats['errors'])}):")
        for e in total_stats['errors'][:10]:
            print(f"  - {e}")
        if len(total_stats['errors']) > 10:
            print(f"  ... and {len(total_stats['errors']) - 10} more")
    
    print('=' * 60)
    
    return 0 if total_stats['issues_after'] == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
