# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project follows
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-08-10

Initial stable release.

### Added

- MCP server (`angular-material-mcp`) exposing 6 tools over stdio: `list_components`,
  `get_component_api`, `search_components`, `get_composition_pattern`, `get_theming_guide`,
  `get_schematics_usage`.
- Fail-fast resolution of `@angular/material` (env var → `cwd()` → parent walk → exit(1)), with
  `@angular/cdk` supported as an optional second root for `cdk/*` lookups.
- TypeScript AST-based extraction of component/directive metadata (selectors, inputs, outputs,
  methods, JSDoc) directly from installed `.d.ts` files — no static snapshot shipped with the
  package.
- In-memory LRU cache in front of extraction, keyed by package version and component name.
- Curated JSON knowledge base: composition patterns, theming guides, schematics usage, and
  per-component overlays (gotchas, minimal examples, CSS custom properties), covering the core
  and extended Angular Material component set plus `@angular/cdk` drag-drop, virtual scrolling,
  overlay, clipboard, and a11y.
- Fuzzy, token-overlap ranking for `search_components` over natural-language queries.
- Security hardening: path-safety checks on `ANGULAR_PROJECT_PATH`, extraction wall-clock timeout
  and file-count/size caps, and sanitization of absolute host paths from tool error output.
- Structured stderr-only logging (`LOG_LEVEL`), a startup banner reporting resolved versions and
  config, and graceful shutdown on `SIGINT`/`SIGTERM`.
- Full unit + integration test suite (including a suite-wide assertion that stdout is never
  written to, since stdout is reserved for the JSON-RPC transport) and CI running lint, format,
  typecheck, data validation, tests, `npm audit`, and build on every push/PR.

[1.0.0]: https://github.com/rlakamraju/angular-material-mcp/releases/tag/v1.0.0
