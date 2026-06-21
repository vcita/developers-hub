# Scope

## Who the integration is for

Zapier users of this integration are **business owners** — they authenticate
with a **staff / app token** scoped to a single business.

This single fact drives every scope decision below.

## In scope

Only **business-level** resources that a staff/app token can reach. These are
the things a business owner actually works with: their clients, invoices,
estimates, payments, leads, bookings, etc.

## Out of scope

Anything that requires a **directory / operator / partner token**. These serve
partners and operators provisioning or administering businesses — not the
business owner who installs a Zap. They are present in the specs but must not be
exposed.

Explicitly excluded endpoint families:

| Family | Examples | Why excluded |
|--------|----------|--------------|
| Licensing | `/v3/license/*` (offerings, subscriptions, bundled_offerings, business_carts) | Directory-level billing administration |
| Directory administration | `/v3/business_administration/directories`, `online_profiles` | Operator/partner administration |
| Business provisioning | `/platform/v1/businesses*`, `/platform/v1/tokens` | Creating/administering businesses, not owner-facing |
| Partner APIs | `/v1/partners/*` (accounts, lead injection) | Partner token only |
| Access control | `/v3/access_control/*` (roles, permissions, overrides) | Directory/operator administration |

> **Why we cannot auto-filter:** the specs do **not** carry a structured
> `token_type` field. Required token types appear only as prose inside endpoint
> descriptions. Therefore the **manifest is the curation gate** — a human
> allow-lists only business-relevant endpoints. The generator never
> auto-exposes the full spec.

## Curated seed set

The initial manifest starts with this business-owner set. Expand by editing the
manifest (see [architecture.md](architecture.md)).

### Creates (source: `mcp_swagger/*.json`)

| Resource | Method + Path | Domain |
|----------|---------------|--------|
| Client | `POST /platform/v1/clients` | clients |
| Client note | `POST /v3/clients/client_notes` | clients |
| Invoice | `POST /business/payments/v1/invoices` | sales |
| Estimate | `POST /business/payments/v1/estimates` | sales |
| Payment | `POST /platform/v1/payments` | sales |
| Lead | `POST /platform/v1/leadgen` | sales |
| Booking / Appointment | `POST /platform/v1/scheduling/bookings` | scheduling |

### Triggers (source: documented webhook events)

The authoritative event list comes from the readme_sync webhook-response docs
(captured via `npm run zapier:capture-samples`). The subscribe enum only lists
**entity** prefixes; the real `entity/event_type` pairs come from the docs.

Seeded triggers (all confirmed to exist as documented events):

`client/updated`, `invoice/issued`, `payment/recorded`, `estimate/requested`,
`appointment/scheduled`, `appointment/cancelled`.

> **Intuitive names that do NOT exist as webhooks** (learned the hard way —
> always source event names from the docs, never guess):
> - `client/created` — only `client/updated` is documented
> - `invoice/paid` / `payment/paid` — payments are `recorded`/`refunded`/`updated`/`matched`
> - `estimate/created` — estimates are `requested`/`approved`/`rejected`
> - `lead/*` — **no lead webhook is documented at all**, so there is no lead
>   trigger (the lead *create* action still exists)

Each trigger's output fields + sample come from the captured payload. The
capture step is **strict**: any malformed JSON fence in the docs fails the run
so it gets fixed at the source rather than tolerated.

## Candidates for later expansion

Not in the seed, but business-level and reasonable next additions: products,
payment requests, messages, reviews, tags, matters.
