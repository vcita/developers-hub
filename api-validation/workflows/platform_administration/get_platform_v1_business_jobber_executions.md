---
endpoint: "GET /platform/v1/business/jobber/executions"
domain: platform_administration
tags: [automation, executions]
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: verified
savedAt: 2026-01-27T08:22:12.398Z
verifiedAt: 2026-01-27T08:22:12.398Z
timesReused: 0
---

# Get Next Automation Execution Time

## Summary
Retrieves the next scheduled execution time for a specific automation flow rule. This endpoint is useful for displaying when an automation will next run, allowing users to see upcoming execution times. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_flows
    description: "Fetch automation flows to get a rule UID"
    method: GET
    path: "/business/jobber/flows"
    expect:
      status: 200
    extract:
      rule_uid: "$.data.rules[0].uid || 'example_rule_uid'"
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_execution_time
    method: GET
    path: "/platform/v1/business/jobber/executions"
    params:
      rule_uid: "{{rule_uid}}"
    expect:
      status: 200
```