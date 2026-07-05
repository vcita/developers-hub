Create a JIRA ticket for the following API validation failure.

## Epic
Associate this ticket with epic: https://myvcita.atlassian.net/browse/VCITA2-11611

## Failure Details

**Endpoint**: {{endpoint}}
**HTTP Status**: {{httpStatus}}
**Status**: {{status}}
**Failure Reason**: {{reason}}

## Error Description
{{friendlyMessage}}

{{#if errors}}
## Validation Errors
{{errors}}
{{/if}}

{{#if suggestion}}
## Suggested Fix
{{suggestion}}
{{/if}}

{{#if healingInfo}}
## Self-Healing Attempt
- Attempted: {{healingAttempted}}
- Iterations: {{healingIterations}}
- Result: {{healingSummary}}
{{/if}}

{{#if request}}
## Request Details
- Method: {{request.method}}
- Path: {{request.path}}
{{#if request.body}}
- Body: {{request.body}}
{{/if}}
{{/if}}

{{#if response}}
## Response Details
- Status: {{response.status}}
- Data: {{response.data}}
{{/if}}

## Instructions
1. Investigate the root cause of this failure
2. Assume this is a documentation bug
3. Fix either the documentation or the workflow. do not change source code.
4. **Validate your findings with the source code - start with frontage (frontend), looking at how this endpoint is used from the UI (service files, store actions). This reveals the exact payload structure and required fields much faster than reading backend controllers. Only go to the backend controller code if the frontend doesn't provide enough clarity.**
5. **Feature flags**: Do not include feature flags in the JIRA description unless they are packagable (see api-validation/docs/packagable-feature-flags.md). Before citing a feature flag as the cause, check GET /v3/license/features_packages to confirm the staff does not have that feature.

## Token Used
{{tokenUsed}}

## Swagger File
{{swaggerFile}}
