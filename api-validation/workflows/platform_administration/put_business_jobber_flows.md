---
endpoint: PUT /business/jobber/flows
domain: platform_administration
tags: [automation, flows, billing]
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: pending
savedAt: 2026-02-07T13:35:00.000Z
verifiedAt: null
timesReused: 0
tokens: [staff, directory]
useFallbackApi: true
---

# Update or Create Automation Flow

## Summary

Updates or creates an automation flow for a business. This endpoint manages scheduled automation rules for various modules including automatic billing (invoice creation, sending payment links) and scheduled payments. When a `uid` is provided, the existing flow is updated; otherwise, a new flow is created.

**Token Type**: This endpoint requires a **Staff or Directory token** when using the fallback API.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway may not properly route this endpoint.

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Flow created or updated successfully |
| 400 | Bad Request - Invalid request parameters or malformed request body |
| 422 | Unprocessable Entity - Validation error (invalid timezone, missing required fields, etc.) |

## Prerequisites

None required for this endpoint. The endpoint uses the business UID from the test configuration.

## Test Request

```yaml
steps:
  - id: update_automation_flow
    description: "Update or create an automation flow for automatic billing"
    method: PUT
    path: "/business/jobber/flows"
    token: staff
    params:
      teams_view_filter: "{}"
    body:
      uid: "{{flow_uid}}"
      entity_uid: "{{business_id}}"
      entity_type: "business"
      module_name: "automatic_billing"
      flow_type: "create_draft"
      time_zone_name: "America/Los_Angeles"
      active: true
      rules:
        - type: "schedule"
          interval_type: "weekly"
          interval_hour: "08:00"
          interval_week_days:
            - "mo"
          event_name: "invoice:create_draft"
    expect:
      status: [200]
```

## Parameters Reference

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| teams_view_filter | string | No | JSON-encoded filter object for teams view filtering. Typically an empty object `{}`. Default: `{}` |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | No | Unique identifier for the automation flow. Required when updating an existing flow. Omit when creating a new flow. |
| entity_uid | string | Yes | The unique identifier of the entity that owns this flow. For business-level automations, this is the business UID. |
| entity_type | string | Yes | The type of entity that owns this flow. Currently supports `"business"` for business-level automations. |
| module_name | string | Yes | The module this automation flow belongs to. Valid values: `"automatic_billing"` (invoice automation), `"scheduled_payments"` (payment automation). |
| flow_type | string | Yes | The type of automation flow. Valid values depend on `module_name`: For `automatic_billing`: `"create_draft"`, `"create_and_send"`, `"send_link"`. For `scheduled_payments`: `"create_payment"`. |
| time_zone_name | string | Yes | The timezone in which the automation schedule should be interpreted. Must be a valid IANA timezone name (e.g., `"America/Los_Angeles"`, `"Europe/London"`). |
| active | boolean | Yes | Whether the automation flow is currently active. Set to `true` to enable the automation, `false` to disable it. |
| rules | array | Yes | Array of scheduling rules that define when and how the automation should execute. Each rule must include `type`, `interval_type`, `interval_hour`, and `event_name`. |
| allow_multi_flows | boolean | No | Whether multiple flows of the same type are allowed for this entity. Default: `true`. |

### Rules Array Structure

Each rule object in the `rules` array supports the following fields:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | The type of rule. Currently supports `"schedule"` for time-based scheduling. |
| interval_type | string | Yes | The frequency interval type. Valid values: `"daily"`, `"weekly"`, `"monthly"`. Determines how often the automation runs. |
| interval_hour | string | Yes | The time of day when the automation should execute, in 24-hour format (HH:MM). Must be in the timezone specified by `time_zone_name`. Format: `"08:00"`, `"14:30"`, etc. |
| interval_week_days | array | No | Array of weekday abbreviations when the automation should run. Only applicable when `interval_type` is `"weekly"`. Valid values: `"mo"`, `"tu"`, `"we"`, `"th"`, `"fr"`, `"sa"`, `"su"`. |
| interval_month_day | string | No | For monthly intervals, specifies which day of the month to run. Can be a number (1-28) or `"last day"` for the last day of the month. Required when `interval_type` is `"monthly"` and the start date's day is greater than 28. |
| event_name | string | Yes | The event name that triggers this automation. Common values: `"invoice:create_draft"`, `"invoice:issue"`, `"close_balance:send_link"`, `"payment:create"`. |
| start_date | string | No | The date when the automation should start. Format: YYYY-MM-DD. If not provided, the automation starts immediately. |
| cycles | integer | No | The number of times the automation should execute. If not specified, the automation runs indefinitely (for recurring flows). Minimum: 1. |
| interval | integer | No | The interval multiplier for the `interval_type`. For example, if `interval_type` is `"weekly"` and `interval` is 2, the automation runs every 2 weeks. Defaults to 1 if not specified. Minimum: 1. |

## Critical Learnings

1. **Flow UID for Updates**: When updating an existing flow, include the `uid` field in the request body. When creating a new flow, omit the `uid` field.

2. **Module and Flow Type Compatibility**: The `flow_type` must be compatible with the `module_name`:
   - `automatic_billing` module supports: `create_draft`, `create_and_send`, `send_link`
   - `scheduled_payments` module supports: `create_payment`

3. **Timezone Format**: The `time_zone_name` must be a valid IANA timezone name. Common examples: `"America/Los_Angeles"`, `"America/New_York"`, `"Europe/London"`, `"Asia/Tokyo"`.

4. **Weekly Schedule**: When `interval_type` is `"weekly"`, the `interval_week_days` array is required and must contain at least one weekday abbreviation.

5. **Time Format**: The `interval_hour` must be in 24-hour format (HH:MM) without seconds. Examples: `"08:00"`, `"14:30"`, `"23:59"`.

6. **Teams View Filter**: The `teams_view_filter` query parameter is typically an empty JSON object `{}` URL-encoded. It's used for teams view filtering but is often not required.

## Notes

- **Active Status**: Setting `active` to `false` disables the automation without deleting the flow configuration, allowing it to be re-enabled later.

- **Multiple Rules**: While the `rules` array can contain multiple rules, most automation flows use a single scheduling rule.

- **Event Names**: The `event_name` field determines what action the automation performs. Common event names:
  - `invoice:create_draft` - Creates draft invoices
  - `invoice:issue` - Creates and sends invoices immediately
  - `close_balance:send_link` - Sends payment links for balance settlement
  - `payment:create` - Processes recurring payments

- **Fallback API**: This endpoint must use the fallback API URL as it may not be properly routed through the main API gateway.
