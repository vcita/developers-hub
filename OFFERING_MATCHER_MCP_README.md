### Automatic Offering Matcher (MCP) — Hackathon MVP

Bring Google Ads–style targeting to partner offerings on vcita data. Two MCP tools ship the demo:
- Create this offering (Marketing): ingest docs/chat → draft rules/thresholds.
- Who should I call today? (Sales): ranked SMBs + top 3 matched offerings.

## Goals
- Convert partner offerings into precise, explainable SMB segments in minutes.
- Prioritize sales outreach daily with transparent reasons and one-line CTAs.
- Prove value quickly with a static demo store; swap in live APIs next.

## Architecture (MVP)
- MCP Server with two tools: ingestion and daily-calls ranking.
- Static matching DB (single JSON) acts as the source of truth for the demo.
- Lightweight Rule DSL compiled against a small feature library.
- Matching Engine evaluates rules → scores → top-N per day.

## Scenarios

### MCP tool: Create this offering (ingestion)
- Who: Marketing
- Input:
  - PDFs (product one-pager, terms, ICP) and/or interactive chat prompts.
- Output (persisted in matching DB):
  - Offering object with: id, name, description, triggers, rules (DSL), weights, example CTA copy, guardrails (exclusions), initial thresholds, owner.
- Flow:
  1) User uploads PDFs and/or answers a short prompt flow (ICP, value prop, constraints).
  2) LLM extracts key attributes and proposes 2–3 targeting rule sets with thresholds and reasoning.
  3) Validate fields/ops against the DSL schema; clamp thresholds to safe bounds.
  4) Persist offering; optionally run an immediate dry-run to preview estimated reach.
- Example prompt
```text
Create this offering: "AI Receptionist" for SMBs missing inbound calls during business hours; only for VOICE-enabled numbers; exclude firms already using AI Receptionist. Prioritize health/wellness categories.
```

### MCP tool: Who should I call today?
- Who: Sales
- Input:
  - Optional filter: list of offering ids (e.g., smartslots,pickmycall).
  - Optional: max_results (default 25), exclude statuses (default: called).
- Output:
  - Ranked SMB list with top 3 matched offerings per SMB, match score, and short reasoning.
- Flow:
  1) Load matching DB (SMBs, offerings, prior statuses/matches).
  2) Evaluate rules per offering → compute per-SMB per-offering score.
  3) Aggregate into per-SMB top-3; filter out already-called if requested.
  4) Return ranked list; support mutations: mark called/do_not_call and append notes.
- Example prompts
```text
Who should I call today for smartslots and pickmycall?
I called: biz_123, biz_456 — mark them as called with note "left VM".
Give me the next 10 SMBs to call.
```

## Matching DB (static JSON)
Single file for demo simplicity (path configurable), e.g. `data/offering_matcher/db.json`.
```json
{
  "smbs": [
    {
      "business_uid": "biz_123",
      "name": "Acme Dental",
      "category": "health",
      "country": "US",
      "signals": {
        "cancel_rate_30d": 0.21,
        "bookings_30d": 66,
        "inbound_missed_call_rate_14d": 0.38,
        "inbound_calls_14d": 52,
        "active_staff_count": 6,
        "has_voice_number": true,
        "smartslots_installed": false,
        "pickmycall_installed": false,
        "staff_slot_quantity": 5,
        "forecast_down_2mo": 0.12,
        "overdue_payments_total": 0
      },
      "status": { "called": false, "notes": "" }
    }
  ],
  "offerings": [
    {
      "id": "pickmycall",
      "name": "AI Receptionist",
      "description": "Reduce missed calls with AI.",
      "triggers": ["daily"],
      "rules": [
        { "feature": "inbound_missed_call_rate_14d", "op": ">=", "value": 0.30, "min_support": 20 },
        { "feature": "has_voice_number", "op": "=", "value": true },
        { "feature": "pickmycall_installed", "op": "=", "value": false }
      ],
      "weights": { "base": 0.6, "missed_call_rate": 0.4 },
      "exclusions": [ { "feature": "category", "op": "in", "value": ["regulated_finance"] } ],
      "cta": "Enable AI Receptionist",
      "owner": "partner_abc"
    },
    {
      "id": "smartslots",
      "name": "SmartSlots",
      "description": "Lower cancellations & smooth scheduling.",
      "triggers": ["daily"],
      "rules": [
        { "feature": "cancel_rate_30d", "op": ">=", "value": 0.15, "min_support": 20 },
        { "feature": "smartslots_installed", "op": "=", "value": false }
      ],
      "weights": { "base": 0.7, "cancel_rate": 0.3 },
      "cta": "Try SmartSlots"
    }
  ],
  "matches": [
    {
      "business_uid": "biz_123",
      "offering_id": "pickmycall",
      "score": 0.86,
      "reason": "38% missed inbound calls (14d, n=52) and VOICE-enabled",
      "last_evaluated_at": "2025-09-10T09:00:00Z"
    }
  ]
}
```

## Rule DSL (minimal)
- Clause: `{ feature, op, value, min_support? }`
- Ops: `>`, `>=`, `<`, `<=`, `=`, `!=`, `in` (string/enum arrays), `not_in`.
- A rule set passes if all clauses are true; `min_support` gates by sample size.
- Scoring (MVP):
  - Base score = sum of matched feature weights; add small recency bonus if computed.
  - Per-SMB top-3 offerings by score; per day top-N SMBs by their best-offer score.

## Feature library (demo)
- cancel_rate_30d, bookings_30d
- inbound_missed_call_rate_14d, inbound_calls_14d, has_voice_number
- active_staff_count, staff_slot_quantity, smartslots_installed, pickmycall_installed
- forecast_down_2mo, overdue_payments_total, category, country

## Matching Engine (pseudo)
```text
for each offering:
  for each smb:
    if all offering.rules satisfied → compute score = weights.base + Σ(weights[feature])
    append {smb, offering, score, reason}
aggregate per smb → keep top-3 offerings
rank smbs by top score; filter status.called if requested
```

## MCP Tool Contracts (suggested)

### create-offering
- Input
```json
{
  "name": "AI Receptionist",
  "description": "Reduce missed calls with AI.",
  "documents": ["/path/ai-receptionist.pdf"],
  "constraints": {"regions": ["US","CA"], "exclude_categories": ["regulated_finance"]}
}
```
- Output
```json
{ "offering_id": "pickmycall", "status": "created", "rules": [...], "preview_reach": 124 }
```

### who-to-call-today
- Input
```json
{ "offerings": ["smartslots","pickmycall"], "limit": 25, "exclude_status": ["called"] }
```
- Output
```json
{
  "smbs": [
    {
      "business_uid": "biz_123",
      "name": "Acme Dental",
      "top_offerings": [
        {"id": "pickmycall", "score": 0.86, "reason": "38% missed inbound calls (14d, n=52)"},
        {"id": "smartslots", "score": 0.62, "reason": "21% cancellations (30d, n=66)"}
      ]
    }
  ]
}
```

### status updates (mutations)
- Input
```json
{ "updates": [ {"business_uid": "biz_123", "offering_id": "pickmycall", "status": "called", "notes": "Left VM"} ] }
```
- Output
```json
{ "updated": 1 }
```

## Running the demo
1) Prepare `data/offering_matcher/db.json` using the schema above.
2) Start your MCP server with the two tools wired to read/write that file.
3) Test flows:
   - create-offering → confirm it appends an offering and returns preview_reach.
   - who-to-call-today → returns ranked SMBs; then post status updates; re-run.

## Swapping static data for real APIs (next)
- Replace signals with calls to vcita v3 endpoints (appointments, voice calls, app assignments, subscriptions, sales reports).
- Cache aggregates nightly; keep the same DSL interface.

## Limitations (hackathon)
- Static signals and simplistic scoring; no seasonality or causal lift.
- No per-offering budget pacing or frequency caps (can fake with simple per-day limits).
- Minimal auth/permissions; no PII beyond business-level metadata.

## Success criteria for the demo
- Time-to-first-cohort < 10 minutes from offering brief.
- Sales flow produces a credible top-25 list with explainable reasons.
- One iteration of threshold adjustment (manually or via LLM prompt) changes cohort as expected.

