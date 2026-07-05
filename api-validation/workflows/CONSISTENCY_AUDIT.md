# Workflow Consistency Audit Report

> **Date**: 2026-02-03
> **Workflows Analyzed**: 229 files across 7 domains
> **Status**: COMPLETED - All workflows migrated to TEMPLATE.md format
> **Migration Script**: `scripts/migrate-to-template.js`
> **Validation Script**: `scripts/validate-workflows.js`

## Migration Summary (Completed 2026-02-03)

All 229 workflows have been successfully migrated to comply with `TEMPLATE.md`:

| Change Type | Count |
|-------------|-------|
| Status values fixed (success/working → verified, skip → skipped) | 216 |
| Sections renamed (Overview→Summary, etc.) | 25 |
| Prerequisites text standardized | 20 |
| YAML step fixes (status arrays, path params) | 156 |
| Fields added (timesReused, verifiedAt, swagger, savedAt) | 249 |
| Content simplified (JSON blocks removed) | 17 |

---

## Original Audit (Historical Reference)

---

## Executive Summary

The existing 230 workflow files show significant inconsistencies in structure, naming, and content quality. This audit identifies 12 major inconsistency categories and recommends standardization based on the new `TEMPLATE.md`.

---

## Inconsistencies Found

### 1. Status Field Values

**Problem**: Multiple status values used inconsistently.

| Found Value | Count | Recommended |
|-------------|-------|-------------|
| `verified` | ~30 | ✅ Keep |
| `success` | ~150 | ❌ Change to `verified` |
| `pending` | ~20 | ✅ Keep |
| `working` | ~5 | ❌ Change to `verified` |
| `failed` | ~5 | ✅ Keep |

**Recommendation**: Standardize to 4 values: `verified`, `pending`, `failed`, `skipped`

---

### 2. Section Naming

**Problem**: Same sections have different names across files.

| Variation Found | Recommended Standard |
|-----------------|---------------------|
| `## Overview` | `## Summary` |
| `## Request Template` | `## Test Request` |
| `## Token Requirements` | `## Authentication` |
| `## Parameter Reference` | `## Parameters Reference` |
| `## Setup Requirements` | `## Test Data Setup` |

---

### 3. Prerequisites Section

**Problem**: Inconsistent "no prerequisites" messaging.

| Found | Recommended |
|-------|-------------|
| "No prerequisites required for this endpoint." | ✅ Keep |
| "No specific prerequisites documented." | ❌ Change |
| (empty section) | ❌ Add standard text |

**Standard text**: `None required for this endpoint.`

---

### 4. Status Code Format in expect

**Problem**: Mix of single values and arrays.

```yaml
# Found (inconsistent):
expect:
  status: 200

expect:
  status: [200, 201]

expect:
  status: [200, 201, 422]
```

**Recommendation**: Always use array format: `status: [200, 201]`

---

### 5. Path Parameter Syntax

**Problem**: Two different syntaxes for path parameters.

| Found | Context | Recommendation |
|-------|---------|----------------|
| `{uid}` | In frontmatter `endpoint` | ✅ Keep (Swagger format) |
| `{{uid}}` | In YAML steps `path` | ✅ Keep (template variable) |
| `{uid}` | In YAML steps `path` | ❌ Change to `{{uid}}` |

**Rule**: 
- Frontmatter `endpoint`: Use `{uid}` (Swagger format)
- YAML steps `path`: Use `{{uid}}` (template variable)

---

### 6. Missing Required Frontmatter Fields

**Problem**: Some files missing required fields.

| Field | Files Missing | Required |
|-------|---------------|----------|
| `swagger` | ~40 | Yes |
| `verifiedAt` | ~15 | Yes |
| `timesReused` | ~50 | Yes (default: 0) |
| `tags` | ~10 (completely missing) | Yes (default: []) |

---

### 7. Tag Usage

**Problem**: Most files have empty tags array.

```yaml
# Found in ~90% of files:
tags: []

# Found in ~10% of files:
tags: [scheduling, bookings, client]
```

**Recommendation**: Add meaningful tags for searchability:
- Domain-related: `payments`, `scheduling`, `clients`
- Action-related: `create`, `update`, `delete`, `list`
- Entity-related: `invoice`, `booking`, `package`

---

### 8. Token Specification Format

**Problem**: Multiple formats for specifying supported tokens.

```yaml
# Format 1 (array in frontmatter):
tokens: [staff, client]

# Format 2 (single value in step):
token: staff

# Format 3 (in notes field):
notes: Requires Staff token...

# Format 4 (inline in markdown):
**Token Type**: This endpoint requires a **client token**.
```

**Recommendation**: 
- Frontmatter: Use `tokens: [staff, client]` array
- Individual steps: Use `token: staff` when overriding default
- Summary section: Include token requirement in text

---

### 9. UID Resolution Procedure Format

**Problem**: Two different formats found.

**Older format** (table + JSON):
```markdown
## UID Resolution Procedure

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|

```json
{
  "uid": {
    "source_endpoint": "...",
    "extract_from": "...",
    ...
  }
}
```
```

**Newer format** (simple table + steps):
```markdown
## UID Resolution Procedure

| UID Field | Source Endpoint | Extract Path | Notes |
|-----------|-----------------|--------------|-------|

### Resolution Steps
...
```

**Recommendation**: Use newer, simpler format (table + steps, no JSON block)

---

### 10. Known Issues Format

**Problem**: Multiple formats found.

**Format 1** (plain text):
```markdown
## Known Issues

**500 Error with Virtual Bookings**: There is a known bug...
```

**Format 2** (YAML block):
```yaml
knownIssues:
  - path: "/form_data"
    reason: "..."
```

**Recommendation**: Use structured markdown format:
```markdown
## Known Issues

### Issue: {Short Title}

**Description**: ...
**Root Cause**: ...
**Workaround**: ...
```

---

### 11. Request Body Format

**Problem**: Inconsistent handling of arrays/objects.

```yaml
# Format 1 (object with numeric keys - current):
body:
  items:
    "0":
      name: "Item 1"
    "1":
      name: "Item 2"

# Format 2 (actual array - cleaner):
body:
  items:
    - name: "Item 1"
    - name: "Item 2"
```

**Note**: The `"0":` format appears to be a serialization artifact. Both work, but array format is cleaner when possible.

---

### 12. onFail Action Completeness

**Problem**: `onFail: skip` used without `skipReason`.

```yaml
# Incomplete:
onFail: skip

# Complete:
onFail: skip
skipReason: "No payment requests available for this client"
```

**Recommendation**: Always require `skipReason` when `onFail: skip`

---

## Priority Fixes

### High Priority (Breaking/Confusing)

1. **Standardize status values** - Replace `success`/`working` with `verified`
2. **Fix path parameter syntax** - Use `{{var}}` in YAML steps, not `{var}`
3. **Add missing `swagger` field** - Required for endpoint identification

### Medium Priority (Consistency)

4. **Standardize section names** - Use template standard names
5. **Use array format for status** - `status: [200, 201]` always
6. **Add `skipReason`** - When using `onFail: skip`

### Low Priority (Enhancement)

7. **Add meaningful tags** - Improve searchability
8. **Simplify UID Resolution** - Remove redundant JSON blocks
9. **Standardize token documentation** - Use frontmatter array + summary text

---

## Migration Script Suggestions

To fix these issues at scale, consider scripts for:

```bash
# 1. Replace status values
sed -i 's/status: success/status: verified/g' workflows/**/*.md
sed -i 's/status: working/status: verified/g' workflows/**/*.md

# 2. Standardize section names
sed -i 's/## Overview/## Summary/g' workflows/**/*.md
sed -i 's/## Request Template/## Test Request/g' workflows/**/*.md

# 3. Fix path parameter syntax in YAML (more complex - needs AST parsing)
# Recommend: Node.js script to parse YAML and fix paths
```

---

## Validation Checklist

Use this to validate workflows against the template:

```
[ ] Frontmatter has all required fields
[ ] Status is one of: verified, pending, failed, skipped
[ ] Tags array exists (even if empty)
[ ] Swagger path is provided
[ ] Section names match template
[ ] Prerequisites section exists
[ ] Test Request section exists with YAML steps
[ ] Status in expect uses array format
[ ] Path variables use {{var}} syntax in YAML
[ ] onFail: skip has skipReason
```

---

## Recommended Next Steps

1. **Review and approve** the `TEMPLATE.md` format
2. **Create migration scripts** to fix high-priority issues
3. **Update the repository code** to validate new workflows against template
4. **Gradually fix** existing workflows during regular maintenance
5. **Add linting** to CI/CD to enforce template compliance
