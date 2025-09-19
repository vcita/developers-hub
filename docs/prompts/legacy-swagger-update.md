### Legacy Swagger Availability Update Prompt

Use this one-shot prompt to update ALL legacy swagger files with purpose descriptions and bold token availability, backed by evidence from core. It is generic and should work across all legacy swagger JSON files.

#### One-shot prompt

```
Update swagger "<SWAGGER_NAME>.json". Do everything end-to-end without asking for confirmation.

1) Evidence collection (vcita/core)
- For every endpoint found in the selected swagger file, locate and quote the exact lines proving access behavior using github mcp:
  - app/controllers/** (including platform/v1 base controllers)
  - lib/api/authentication.rb (OAuth scope definitions/bindings)
  - modules/**/config/routes/**/*.rb (route bindings)
  - spec/** (controller/component specs asserting scope behavior)
- If actor_type is not present in legacy v1, infer allowed tokens from scope-based behavior (directory vs user/app) shown in controllers/specs.
- Map actors to tokens consistently:
  - Admin → Internal
  - Business & User → Staff
  - Directory → Directory
  - Application/Application User (app-level OAuth) → App

##### Generic scope-inference and sanity checks
- Determine actor by the code context, not path names:
  - If the endpoint acts on the authenticated business context (e.g., uses current business, business_id from token, or mutates resources within a business), choose **Staff**.
  - If the endpoint manages directory-wide resources or requires a directory context, choose **Directory**.
  - If the endpoint is authenticated via application-level OAuth and operates without a staff/directory context, choose **App**.
  - Only use **Internal** when there is clear evidence of admin/internal-only access (e.g., admin/internal namespaces, controllers, or specs requiring internal/admin tokens).
- For mutating operations (create/update/delete) scoped to a specific business, default to **Staff** unless strong evidence indicates otherwise.
- Require at least one concrete code location (controller or component) AND one auxiliary source (routes, authentication, or specs) when selecting **Internal** or **App**.
- Completely disregard every information in the swagger except the path structure. it is misleading. 
- end points with /business/ in the pass are usually available for staff token (but can be available for directory tokens too)
- end point with /clients/ in the pass are usually available for client token (but not alway)
- 
- End points can work for more than one context, don't force a single selection if its not implicit in the code context

2) Apply edits to swagger descriptions
- For each operation (GET/POST/PUT/PATCH/DELETE) in each legacy swagger file:
  - Ensure description begins with a concise purpose sentence (what the endpoint does).
  - Append a bold availability statement, keeping only the relevant tokens, exactly in one of these formats (combine as needed):
    - **Available for Staff Tokens**
    - **Available for Directory Tokens**
    - **Available for App Tokens**
    - **Available for Internal Tokens**
    - e.g., **Available for Staff and Directory Tokens** when multiple apply
- Do not modify any other fields. Preserve existing indentation, spacing, and JSON formatting. Only touch the description field values.

3) Validation and output
- Validate JSON and run the linter after edits; fix any issues.
- For each file, output:
  - File path
  - A concise list of endpoints updated with the final availability tokens
  - Short quoted evidence (1–3 lines) per endpoint showing where the scope/actor decision came from.
- If a private repo blocks inline rendering, include GitHub UI links that use HEAD (not commit SHAs) and paste minimal text snippets of the relevant lines.

Constraints
- Preserve all existing formatting; only touch description fields.
- Use Markdown bold for the availability sentence inside the JSON string values.
- Keep availability tokens limited to: Staff, Directory, App, Internal.
```

#### Notes
- Keep purpose sentences short and action-oriented (e.g., "Retrieve X", "Create Y", "Update Z").
- When multiple tokens apply, list them in a natural order (e.g., Staff and Directory).


