---
endpoint: GET /platform/v1/clients/merges/possible_merge_master
domain: clients
tags: []
status: success
savedAt: 2026-01-25T20:55:39.616Z
verifiedAt: 2026-01-25T20:55:39.616Z
timesReused: 0
---
# Get Possible merge master

## Summary
Test passes after providing required client_ids parameter. The endpoint successfully returned a list of client UIDs that can be used as primary for merge.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "GET",
  "path": "/platform/v1/clients/merges/possible_merge_master?client_ids=b4b9ydxlm25bcckl,8107yhbsp6jy7ozj"
}
```