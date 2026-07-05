# Fix Processor - Endpoint-by-Endpoint Report Handler

A managed approach to processing API validation reports, fixing one endpoint at a time to prevent Cursor from getting overwhelmed by large reports.

## Problem

When processing large validation reports (150+ issues across 30+ endpoints), Cursor tends to:
- Skip phases or endpoints
- Lose context mid-processing
- Not complete all fixes

## Solution

This script breaks down the report into manageable chunks, processing **one endpoint at a time** with:
- Progress tracking (resume from where you left off)
- Focused prompts optimized for Cursor's context window
- Severity-based prioritization
- Deduplication of redundant issues

## Quick Start

```bash
# 1. Check status of a report
node api-validation/scripts/fix-processor.js <report-folder> --status

# 2. Get the next endpoint to fix (Cursor-friendly prompt)
node api-validation/scripts/fix-processor.js <report-folder> --cursor

# 3. Copy the prompt output and paste into Cursor

# 4. After fixing, mark as done
node api-validation/scripts/fix-processor.js <report-folder> --mark-done "<METHOD /path>"

# 5. Repeat steps 2-4
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `--status` | Show overall progress (completed/pending/skipped counts) |
| `--cursor` | Generate focused Cursor prompt for next endpoint |
| `--next` | Get detailed instructions for next endpoint |
| `--list` | List all endpoints with their status |
| `--instructions <endpoint>` | Get instructions for a specific endpoint |
| `--mark-done <endpoint>` | Mark endpoint as completed |
| `--mark-skip <endpoint>` | Mark endpoint as skipped |
| `--mark-jira <endpoint>` | Mark endpoint as needing JIRA ticket |
| `--batch [N]` | Generate prompts for N endpoints (default: 3) |
| `--retest` | Generate list of fixed endpoints for retesting |
| `--reset` | Reset all progress and start fresh |

## Recommended Workflow

### Step 1: Initial Assessment

```bash
node api-validation/scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --status
```

Output:
```
## Fix Progress Report

**Total Endpoints:** 34
**Total Issues:** 153

### Status Breakdown
| Status | Count | Percentage |
|--------|-------|------------|
| Completed | 0 | 0.0% |
| Pending | 34 | 100.0% |
```

### Step 2: Get Next Endpoint Prompt

```bash
node api-validation/scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --cursor
```

Output:
```
Fix validation issues for: **GET /business/search/v1/view_filters**

Follow @developers-hub/.cursor/rules/handle_report.mdc rules.

## Files to check:
1. Workflow: `api-validation/workflows/clients/business_search_v1_view_filters.md`
2. Swagger: `swagger/clients/legacy/crm_views.json`

## Issues to fix (1):

### 1. [MINOR] /
**Problem:** Primary URL returned bad gateway error...
**Fix:** Investigate gateway/load balancer issues...

## After fixing:
Run: `node api-validation/scripts/fix-processor.js "..." --mark-done "GET /business/search/v1/view_filters"`
```

### Step 3: Fix in Cursor

Copy the prompt and paste it into Cursor. The prompt:
- References the `handle_report.mdc` rule for fix priorities
- Points to exact files to check/modify
- Lists only issues for that one endpoint
- Is small enough to fit in context

### Step 4: Mark as Done

```bash
node api-validation/scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --mark-done "GET /business/search/v1/view_filters"
```

### Step 5: Repeat

Run `--cursor` again to get the next endpoint.

## Files Generated

| File | Purpose |
|------|---------|
| `fix-progress.json` | Tracks progress state (completed, pending, skipped) |
| `current-instructions.md` | Detailed instructions for current endpoint |
| `cursor-prompt.md` | Focused prompt for Cursor |

## Issue Processing Order

Issues are processed by severity in this order (per `handle_report.mdc`):

1. **Warning** - Reference annotations, minor suggestions
2. **Major** - Schema issues, missing documentation
3. **Critical** - Breaking issues, 500 errors, missing required fields
4. **Minor** - Gateway fallbacks, minor improvements

## Fix Priority Order

When fixing each endpoint, follow this priority (from `handle_report.mdc`):

1. **WORKFLOW FIRST** - Check if test data is fake (`inv_12345`, `test_abc`)
2. **SCHEMA SECOND** - Fix swagger schema (add `required`, `type`, `example`)
3. **DOCUMENTATION THIRD** - Add descriptions for behavior that can't be expressed in schema
4. **JIRA LAST** - Only after exhausting all documentation options

## Example Session

```bash
# Start fresh
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --reset
Progress reset. Run again to start fresh.

# Check what we have
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --status
Total Endpoints: 34
Total Issues: 153
Completed: 0 | Pending: 34

# Get first endpoint
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --cursor
📋 Instructions saved to: reports/clients-2026-01-31/cursor-prompt.md
...

# [Fix in Cursor using the prompt]

# Mark done
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --mark-done "GET /business/search/v1/view_filters"
✅ Marked as done: GET /business/search/v1/view_filters
Next endpoint: GET /business/search/v1/views

# Continue...
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --cursor

# After all done, generate retest list
$ node api-validation/scripts/fix-processor.js reports/clients-2026-01-31 --retest
```

## Tips

### Skip Gateway Issues
If an endpoint only has gateway-related issues (not documentation issues), you can skip it:
```bash
node ... --mark-skip "GET /endpoint/with/only/gateway/issue"
```

### Jump to Specific Endpoint
```bash
node ... --instructions "POST /business/clients/v1/matters/{matter_uid}/notes"
```

### Batch Processing
For parallel work, generate multiple prompts:
```bash
node ... --batch 5
```

## Integration with handle_report.mdc

The prompts generated reference `@developers-hub/.cursor/rules/handle_report.mdc`, which provides:
- Fix priority rules
- Fake data detection patterns
- Schema fix guidelines
- JIRA ticket criteria

Cursor will automatically apply these rules when processing each endpoint prompt.
