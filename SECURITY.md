# Security Policy

## Supported versions

This project is pre-1.0 and has a single actively maintained line: the latest published version
on npm. Security fixes are not backported to older versions.

## Reporting a vulnerability

Please report suspected vulnerabilities privately via
[GitHub Security Advisories](../../security/advisories/new) for this repository rather than
opening a public issue. Include reproduction steps and the affected version. We aim to
acknowledge reports within a few days.

## Threat model

`angular-material-mcp` runs locally, as a child process of an MCP client, and only reads files
from the Angular project pointed at by `ANGULAR_PROJECT_PATH` (or `process.cwd()`/its parents) —
it never writes to disk and never makes network requests. The main risks are:

- **A misconfigured or hostile `ANGULAR_PROJECT_PATH`** — validated before use (rejected outright
  if malformed, rather than probed as-is).
- **A pathological or oversized `@angular/material`/`@angular/cdk` install** — extraction enforces
  a file-count cap, a per-file size cap, and an overall wall-clock timeout, so a degenerate input
  fails fast instead of hanging the server.
- **Leaking local filesystem details to the MCP client** — thrown errors are sanitized (absolute
  host paths stripped) before they reach tool output; the original error is still logged in full
  to stderr for local debugging.

## Dependencies

Runtime dependencies are intentionally minimal (`@modelcontextprotocol/sdk`, `zod`, `typescript`).
Dependabot keeps both npm dependencies and GitHub Actions up to date, and CI runs `npm audit`
on every push/PR.
