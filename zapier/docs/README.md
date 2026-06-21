# Zapier Integration — Documentation

This folder anchors the design and scope decisions for the vcita Zapier
integration that is generated from this repo (developers-hub).

The Zapier app is **generated**, not hand-written: a manifest curates what to
expose, a generator reads the repo's source-of-truth specs, and emits a Zapier
Platform CLI project.

## Documents

| Doc | What it covers |
|-----|----------------|
| [scope.md](scope.md) | Who the integration is for, what is in/out of scope, the curated seed set, and the exclusion list. |
| [architecture.md](architecture.md) | The single-repo layout, sources of truth, the generation pipeline, auth model, and how webhook payload samples are published via GitHub Pages. |

## Status

- Branch: `zapier-app-integration`
- Layout: **single repo** (inside developers-hub) for the initial build; may be
  split into a dedicated repo later (see architecture.md → "Repo strategy").
