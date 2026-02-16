# Entity Markdown Generator

Generates human-friendly Markdown reference pages for each JSON entity under `entities/**`. Output Markdown files are written next to each JSON under an `md/` subfolder.

## What it does

- Scans `entities/**/*.json` recursively
- For each entity, creates `entities/<domain>/md/<EntityName>.md`
- Renders:
  - Title and one-line description (from the entity's `description` if present)
  - Properties table with:
    - Name
    - Description
    - Type (supports arrays, objects, `$ref` names, and enums)
    - Required (Yes if included in the entity's `required` list)
  - Nested object properties tables (one level deep) for common sub-objects
  - Example section(s):
    - Supports `example` (single) and `examples` (array)
    - Prepends a "JSON" label and formats as a fenced `json` code block

## Usage

From the repo root:

- Generate Markdown for all entities
```bash
npm run gen:entities
```

- Generate Markdown for a specific entity
```bash
# Pass a path relative to entities/
npm run gen:entity -- ai/AIRecommendation.json

# Or pass just the file name (the script will search entities/**)
npm run gen:entity -- AIRecommendation.json
npm run gen:entity -- AIRecommendation
```

Output for the above examples will be created under:
```
entities/ai/md/AIRecommendation.md
```

## Output format details

- Properties table includes a Required column derived from the entity's `required` array
- Enum values appear inline in the Type column, for example: `string (enum: \`staff\`, \`directory\`)`
- Arrays appear as `array<...>` using the item type
- `$ref` appears as `ref to <SchemaName>` when referring to another schema
- Nested object properties are rendered one level deep with their own tables when `properties` exist
- Example section title is "Example" (single) or "Examples" with numbered sub-sections; a "JSON" label is shown above each code block

## Notes & limitations

- Only one level of nested object properties is expanded into its own table
- Deeply nested/complex schemas will still render, but only the first level of nested objects gets a dedicated table
- `$ref` display shows the referenced schema/file name; it does not inline referenced properties
- The description for the entity itself is taken from the root `description` field if present; otherwise a generic description is used

## Development

- Script: `scripts/generate-entity-md.js`
- Dependencies: Node.js (uses `fs-extra`)
- Style goals: easy-to-read Markdown for docs sites and pull requests

## Troubleshooting

- No output files generated
  - Ensure JSON files exist under `entities/**`
  - Ensure you have permissions to write to `entities/**/md/`
- A property is marked not-required but should be required
  - Confirm it appears in the entity's root `required` list (or the nested object's `required` list for sub-tables)
- Example section missing
  - Ensure the schema includes `example` or `examples`
