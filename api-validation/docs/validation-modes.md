# Validation Modes

The API Validation Dashboard has three testing modes, each with a specific purpose.

---

## 1. Full Validation

**Purpose:** Test that documented API endpoints work correctly and match their OpenAPI specs.

**Endpoints shown:** All endpoints from swagger files.

### Test Flow

For each selected endpoint, the system follows this decision tree:

```
  Endpoint
     │
     ▼
  Workflow status = "skip"? ──yes──▶ SKIP (user-approved skip)
     │ no
     ▼
  Has verified workflow
  with test request? ──yes──▶ Execute workflow (prereqs + test)
     │ no                          │
     │                        Success? ──yes──▶ PASS
     │                             │ no
     ▼                             ▼
  Build request from              Fall through to
  swagger spec                    swagger-based test
     │                                 │
     ◄─────────────────────────────────┘
     │
     ▼
  Resolve token type
  (from doc or fallback)
     │
     ▼
  Missing path params? ──yes──▶ AI enabled? ──yes──▶ Mark FAIL (healer will resolve)
     │ no                                │ no
     │                                   ▼
     │                              SKIP (missing params)
     ▼
  Execute HTTP request ──────▶ Network/timeout error? ──yes──▶ FAIL
     │                              │ no
     │                              ▼
     │                         Got 4xx? ──yes──▶ Retry with swapped
     │                              │ no         business_id/uid
     │                              │                │
     ◄──────────────────────────────┘◄───────────────┘
     │
     ▼
  Validate HTTP status
  against swagger spec
     │
     ├── 2xx + schema OK + no doc issues ──────▶ PASS
     ├── 2xx + doc issues or schema mismatch ──▶ WARN
     ├── non-2xx + documented error code ──────▶ ERROR
     └── non-2xx + schema mismatch ────────────▶ FAIL
                                                   │
                                                   ▼
                                           AI self-healing enabled?
                                                   │
                                              yes──▶ Agent analyzes failure,
                                                     searches source code,
                                                     resolves UIDs, retries
                                                     request (up to 30 attempts).
                                                     May auto-fix swagger files.
                                                   │
                                              no───▶ Report as-is
```

### Result Statuses

| Status | Meaning |
|--------|---------|
| **PASS** | 2xx response, schema matches, no doc issues |
| **WARN** | 2xx response but documentation issues found (missing token docs, undocumented fields, schema drift) |
| **ERROR** | Non-2xx but status code is documented (expected business error like 404, 409) |
| **FAIL** | Non-2xx with unexpected status or schema mismatch |
| **SKIP** | Workflow marked as skip, or missing required params with no healer |

---

## 2. Base URL Scan

**Purpose:** Check if endpoints using `useFallbackApi` still need the fallback, or if the primary URL now works.

**Endpoints shown:** Only endpoints with `useFallbackApi: true` in their workflow.

### Test Flow

For each endpoint, both URLs are tested and the results are compared:

```
  Endpoint
     │
     ▼
  Has workflow with
  test request? ──no──▶ NO_WORKFLOW (cannot test)
     │ yes
     ▼
  Execute workflow against
  FALLBACK URL
     │
     ├── Success ──▶ fallback_ok = true
     └── Failure ──▶ fallback_ok = false
                          │
     ◄────────────────────┘
     │
     ▼
  Execute workflow against
  PRIMARY URL
     │
     ├── Success ──▶ primary_ok = true
     └── Failure ──▶ primary_ok = false
                          │
     ◄────────────────────┘
     │
     ▼
  ┌─────────────────┬───────────────┐
  │   fallback_ok   │  primary_ok   │  Recommendation
  ├─────────────────┼───────────────┤
  │      true       │     true      │  PRIMARY_NOW_WORKS
  │      true       │     false     │  FALLBACK_STILL_NEEDED
  │      false      │     true      │  FALLBACK_BROKEN
  │      false      │     false     │  BOTH_FAILING
  └─────────────────┴───────────────┘
```

### Recommendations

| Recommendation | Meaning | Action |
|----------------|---------|--------|
| **Primary Now Works** | Both URLs return 2xx | Safe to remove `useFallbackApi: true` from workflow |
| **Fallback Still Needed** | Only fallback works | Keep using fallback; investigate primary |
| **Fallback Broken** | Only primary works | Fallback may have been decommissioned; update workflow to use primary |
| **Both Failing** | Neither URL works | Endpoint has a deeper issue; needs investigation |
| **No Workflow** | No test request available | Cannot determine URL status |

### Quick Fix

The "Quick Fix" button batch-removes `useFallbackApi: true` from all workflows where the recommendation is `PRIMARY_NOW_WORKS`.

---

## 3. Token Doc Fix

**Purpose:** Fix missing token documentation (`Available for **X tokens**`) in swagger files by discovering token types from backend source code.

**Endpoints shown:** Only endpoints missing token documentation (`tokenInfo.found === false`).

### Test Flow

Each endpoint goes through code search, optional testing, and swagger update:

```
  Endpoint
     │
     ▼
  CODE SEARCH
  Map path to backend repo
  (via apigw routing config)
     │
     ▼
  Search controller for
  auth restrictions
  (ActorType in NestJS,
   authorize_params in Rails)
     │
     ├── Found explicit restrictions ──▶ tokens = [discovered types]
     └── No restrictions found ────────▶ tokens = [staff, directory, client]
                                              (default)
     │
     ▼
  Tokens found? ──no──▶ NO_TOKENS_FOUND (skip endpoint)
     │ yes
     ▼
  Workflow status = "skip"? ──yes──▶ Update swagger immediately
     │ no                                  │
     ▼                                     │
  Has workflow? ──no──▶ NO_WORKFLOW         │
     │ yes              (tokens found       │
     │                   but can't verify)  │
     ▼                                     │
  Execute workflow test                    │
     │                                     │
     ├── 2xx ──▶ Update swagger ◄──────────┘
     │                │
     │                ▼
     │           Append to description:
     │           "Available for **X and Y tokens**"
     │           (dynamically built from
     │            discovered token list)
     │
     └── Error ──▶ Do NOT update swagger
                   (report failure, tokens
                    were discovered but
                    unverified)
```

### Token Discovery Strategy

The code searcher maps endpoint paths to backend repositories using the shared APIGW routing config, then applies framework-specific search patterns:

| Framework | Search Pattern | Default (no restriction found) |
|-----------|---------------|-------------------------------|
| **NestJS** | `@Controller` decorator matching + `ActorType.X` checks in handler methods | `[staff, directory, client]` |
| **Rails** | Controller file lookup + `authorize_params[:type]`, `token_type`, `scope.includes?` patterns | `[staff, directory, client]` |

### Result Fields

| Field | Meaning |
|-------|---------|
| **Discovered Tokens** | Token types found by code search (e.g., staff, directory, client) |
| **Confidence** | `explicit` (found in code), `default` (no restriction = all standard tokens), `excluded` (auth excluded) |
| **Test Result** | `2xx`, `error`, `skipped-no-test`, `no-workflow`, `no-tokens-found` |
| **Swagger Updated** | Whether the swagger file was modified with the token doc string |

---

## Auto-Fix (All Modes)

After any mode completes, the **Auto-Fix Failed** button collects endpoints that failed (ignoring skipped) and sends them to the AI doc-fixer agent. The agent groups similar failures, processes them sequentially, and can update swagger files, workflow definitions, and entity schemas.

| Mode | What counts as "failed" |
|------|------------------------|
| **Full Validation** | Status = FAIL, ERROR, or WARN |
| **Base URL Scan** | Recommendation = BOTH_FAILING or FALLBACK_BROKEN |
| **Token Doc Fix** | Test result = error |
