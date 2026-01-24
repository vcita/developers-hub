---
endpoint: POST /v3/apps/widgets
domain: apps
tags: []
status: skip
savedAt: 2026-01-24T13:24:49.527Z
verifiedAt: 2026-01-24T13:24:49.527Z
timesReused: 0
skipReason: The current app context does not support widgets (403: 'This app's type does not support widgets'). Only certain app types can create widgets, and the staff token represents an app type that doesn't have widget support.
---
# Create Widgets

## Summary
Skipped based on cached workflow - The current app context does not support widgets (403: 'This app's type does not support widgets'). Only certain app types can create widgets, and the staff token represents an app type that doesn't have widget support.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The current app context does not support widgets (403: 'This app's type does not support widgets'). Only certain app types can create widgets, and the staff token represents an app type that doesn't have widget support.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```