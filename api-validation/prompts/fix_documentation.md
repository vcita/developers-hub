Fix this documentation error. Make sure to dig deep into the code start with frontage to see how this is implemented in the frontend and then move to the controller code.

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
5. **Feature flags**: Do not add or document feature flags in swagger/workflows unless they are packagable (see api-validation/docs/packagable-feature-flags.md). Before blaming a failure on a feature flag, check GET /v3/license/features_packages to see if the staff has that feature.

## Token Used
{{tokenUsed}}

## Swagger File
{{swaggerFile}}
