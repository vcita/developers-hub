---
name: update-object-from-entity
description: Generate (or refresh) a ReadMe "Object" reference article from a developers-hub entity JSON and sync it into the readme_sync repo. Use when adding a new entity to the docs site, updating an existing entity's documented properties/example, or when the user says "update the object for <entity>", "create object from entity", or "sync <entity> to readme". Orchestrates both the developers-hub and readme_sync repos: branches each off its own base (developers-hub→master, readme_sync→v3.1), runs the entity→markdown generator, adapts the output to the ReadMe article format, then (after approval) commits, pushes, and opens a PR on each repo.
---

# Update Object From Entity

Turn a developers-hub **entity** (`entities/<domain>/<Entity>.json`) into a ReadMe
**Object** reference article and land it in the **readme_sync** repo. Spans two repos:

- **developers-hub** — source entity JSON + the `gen:entity` generator. (This repo.)
- **readme_sync** — the published reference site. Object articles live at
  `reference/<Domain>/<folder>/the-<entity>-object.md`.

Locate readme_sync as a sibling working dir (e.g. `../readme_sync`). If you can't find
it, ask the user for its path before proceeding.

## Inputs

- **Entity** — the entity name or path, e.g. `appAssignment`, `appAssignment.json`,
  or `apps/appAssignment.json`. If the user didn't name one, ask which entity.

## Workflow

Follow every step in order. Do **not** skip steps. **Stop at the approval gate** (Step 4)
and wait for the user before any commit/push/PR.

### Step 1 — Branch both repos (per-repo base)

The two repos have **different mainlines** — branch each off its own base, using **the
same branch name** on both:

- **developers-hub** → base **`master`** (it has no `v3.x` branch).
- **readme_sync** → base **`v3.1`** (the 3.1 docs line).

Derive a descriptive name from the entity, obeying `git-branch-naming` (only
`[A-Za-z0-9_-]`, no slashes): e.g. `update_<entity>_object` (new) or
`docs_<entity>_object_update`.

```bash
# developers-hub
git -C <dev-hub> fetch origin
git -C <dev-hub> checkout master && git -C <dev-hub> pull origin master
git -C <dev-hub> checkout -b <branch-name> master

# readme_sync
git -C <readme_sync> fetch origin
git -C <readme_sync> checkout v3.1 && git -C <readme_sync> pull origin v3.1
git -C <readme_sync> checkout -b <branch-name> v3.1
```

Confirm both repos are on the new branch before continuing. (Always verify each base
branch exists with `git ls-remote --heads origin <base>` — don't assume.)

### Step 2 — Generate the markdown from the entity (developers-hub)

```bash
# from the developers-hub repo root — use the bare entity name OR a path
# relative to entities/. Do NOT pass "<name>.json" alone:
npm run gen:entity -- offering                 # bare name (recursive search) ✓
npm run gen:entity -- license/offering.json    # path relative to entities/   ✓
# npm run gen:entity -- offering.json          # ✗ FAILS: "Entity not found"
```

> Gotcha: despite the README's examples, passing just `<name>.json` makes the
> generator look only for `entities/<name>.json` (repo root of entities) and skip the
> recursive search. Use the **bare name** or a **path relative to `entities/`**.

This writes `entities/<domain>/md/<Entity>.md`. Read that file — it is the raw source
for the article. Its shape:

```
## <DisplayName>

<description>

## Properties
| Name | Description | Type | Required |
...
### <Nested> Properties
...
## Example

JSON

```json
{ ... }
```
```

If generation fails (entity not found), fix the entity name/path and rerun — don't
hand-write the tables.

### Step 3 — Create or update the Object article (readme_sync)

**Find the target.** Search readme_sync for an existing article for this entity:

```bash
# in readme_sync
find reference -iname "the-<entity>-object.md" -o -iname "<entity>-entity.md"
```

- **Found → update in place.** Reuse the existing file path and its frontmatter.
- **Not found → create new.** Place it under the reference domain that matches the
  entity's developers-hub domain, in its own folder:
  `reference/<Domain>/<entity-kebab>/the-<entity>-object.md`. Also add an
  `index.md` (frontmatter `title` + `hidden: false`) and an `_order.yaml` listing the
  article slug, and add the new folder/slug to the parent domain's `_order.yaml`.
  If the right domain/folder is ambiguous, ask the user.

**Match the format the target article actually uses.** readme_sync has TWO table
styles — inspect the existing/sibling articles before writing, don't assume:

- **MDX `<Table>` style** (curated articles, e.g. `the-offering-entity.md`): rich
  frontmatter, properties rendered as a `<Table align=...>` JSX block with
  `<thead>/<tbody>/<tr>/<td style={{textAlign:"left"}}>`, headings `## Properties` and
  `## Example Entity`, and the example JSON fence has **no** `JSON` label line.
- **Plain-markdown style** (older articles, e.g. `the-widget-object.md`): simple
  markdown tables, lighter frontmatter, `### Properties` / `### Example` with a `JSON`
  label. The generator output is already close to this.

Adaptation from the generated `md/<Entity>.md`:

1. **Frontmatter** — when updating, **preserve the existing file's frontmatter
   verbatim** (title/excerpt/metadata/next). When creating new, use:
   ```yaml
   ---
   title: The <DisplayName> Object
   deprecated: false
   hidden: false
   metadata:
     robots: index
   ---
   ```
2. **Drop the leading `## <DisplayName>` heading** — its description text becomes the
   first body line (title lives in frontmatter).
3. **Render properties in the target's table style.** For the MDX `<Table>` style,
   convert each generated row → a `<tr>` with four `<td>` cells (Name backticked,
   Description as-is, Type backticked with any `(enum: …)` kept inline, Required =
   `Yes`/`No`). Wrap the table in `<br />` … `<br />`. Columns: Name/Description/Type/Required.
4. **Example** — MDX style: `## Example Entity` + bare ```json fence. Markdown style:
   `### Example` + `JSON` label + ```json fence. Use the generated (valid) example.

Default merge scope is **full-regenerate** the body from the generated content (this
refreshes new fields and fixes stale/broken examples). If asked to preserve curation,
replace only entity-derived parts (rows + example) and keep hand-written prose.

> Watch for entity gaps the generator can't fill: a property with no `description` in
> the entity JSON renders an empty cell. Flag these at the approval gate — they're a
> reason to fix the entity, not to hand-curate the article.

> Gotcha — multi-line cells: if an entity property `description` contains blank lines
> (`\n\n`), the generator emits them raw into the table cell, which **breaks the
> markdown/MDX table**. When adapting, collapse each cell to a single line (join with a
> space, or `<br /><br />` if you must keep the paragraph break).

For a **new** article, also: create it at `reference/<Domain>/<folder>/the-<entity>-object.md`
matching sibling style in that folder, add `the-<entity>-object` as the **first** entry
in the folder's `_order.yaml` (object article leads), and ensure the folder has an
`index.md`.

### Step 4 — Approval gate

**Stop.** Present to the user:
- the branch name (both repos),
- the generated `entities/<domain>/md/<Entity>.md` path,
- the readme_sync article path (created vs updated) and a diff/preview,
- any `_order.yaml`/`index.md` additions.

Do **not** commit, push, or open PRs until the user approves.

### Step 5 — After approval: commit, push, PR (both repos)

For **each** repo, commit the relevant changes, push the branch, and open a PR targeting
**that repo's base** (developers-hub → `master`, readme_sync → `v3.1`):

```bash
# developers-hub (base master)
git -C <dev-hub> add -A
git -C <dev-hub> commit -m "docs(<entity>): sync object reference from entity"
git -C <dev-hub> push -u origin <branch-name>
gh pr create -R vcita/developers-hub --base master --head <branch-name> \
  --title "docs(<entity>): update object reference" \
  --body "Generated/updated the <DisplayName> Object article from entities/<domain>/<Entity>.json via gen:entity."

# readme_sync (base v3.1)
git -C <readme_sync> add -A
git -C <readme_sync> commit -m "docs(<entity>): sync object reference from entity"
git -C <readme_sync> push -u origin <branch-name>
gh pr create -R vcita/readme_sync --base v3.1 --head <branch-name> \
  --title "docs(<entity>): update object reference" \
  --body "Synced the <DisplayName> Object article from developers-hub entities/<domain>/<Entity>.json."
```

End commit messages with the repo's standard trailer if one is in use. Present both PR
URLs to the user.

## Notes

- `origin` → `vcita/developers-hub` and `vcita/readme_sync`. PR bases differ per repo:
  developers-hub → `master`; readme_sync → `v3.1`.
- The `gen:entity` generator is the single source for the tables/example — always
  regenerate rather than editing the article's tables by hand.
- One entity ↔ one Object article. Keep the branch scoped to a single entity unless the
  user explicitly batches several.
