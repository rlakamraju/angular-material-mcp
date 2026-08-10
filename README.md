# angular-material-mcp

An MCP (Model Context Protocol) server that gives AI coding assistants structured, accurate
access to Angular Material component APIs — extracted directly from the `@angular/material` (and
`@angular/cdk`) package versions actually installed in _your_ Angular project, plus a curated
knowledge base of composition patterns, theming guides, and schematics usage.

Because the API data is parsed live from your `node_modules`, the assistant always sees the
component surface for the exact version you're on — not a stale snapshot baked into the package.

## Requirements

- Node.js `>= 20`
- An Angular project with `@angular/material` installed in `node_modules` (`@angular/cdk` is
  optional — only `cdk/*` lookups need it)

## Install

No install step is required — run it with `npx` directly from your MCP client config (see below),
and npm will fetch the latest published version on each launch.

To install explicitly instead:

```bash
npm install -g angular-material-mcp
```

## Configure your MCP client

The server communicates over stdio, so any MCP client that spawns a local process works. Point
`ANGULAR_PROJECT_PATH` at the root of the Angular project whose `@angular/material` you want
introspected — the folder containing that project's `package.json` and `node_modules`.

### Claude Code

Add an entry to `.mcp.json` at the root of the Angular project (or wherever you keep your MCP
config):

```json
{
  "mcpServers": {
    "angular-material": {
      "command": "npx",
      "args": ["-y", "angular-material-mcp"],
      "env": {
        "ANGULAR_PROJECT_PATH": "/absolute/path/to/your/angular-project"
      }
    }
  }
}
```

Then run `/mcp` inside Claude Code to confirm the server is connected and see its 6 tools listed.

### Other MCP clients

Any client configuration format that supports `command`/`args`/`env` for a stdio server works the
same way — use `npx -y angular-material-mcp` (or the globally installed `angular-material-mcp`
binary) as the command, and set `ANGULAR_PROJECT_PATH` in its environment.

## Configuration

All configuration is via environment variables, all optional:

| Variable               | Default                                         | Values                           | Notes                                                                                                                                                   |
| ---------------------- | ----------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ANGULAR_PROJECT_PATH` | _(none — falls back to resolution chain below)_ | absolute or relative path        | Root of the Angular project to resolve `@angular/material`/`@angular/cdk` from.                                                                         |
| `LOG_LEVEL`            | `info`                                          | `debug`, `info`, `warn`, `error` | Controls stderr verbosity. `debug` also prints per-file extraction timings. All logging goes to stderr — stdout is reserved for the JSON-RPC transport. |
| `IMPORT_STYLE`         | `standalone`                                    | `standalone`, `ngmodule`         | Preferred import style for generated code in tool responses (can be overridden per-call on `get_component_api`).                                        |

If `ANGULAR_PROJECT_PATH` is unset, the server resolves `@angular/material` by trying, in order:
the current working directory, then walking up parent directories with a bounded depth. If none
of those contain a resolvable `@angular/material` install, the server logs a fix-instruction
message to stderr and exits with code 1 — there is deliberately no fallback/baseline data, since
serving stale API info would be worse than a clear error.

## Tools

| Tool                      | Input                           | Description                                                                                                     |
| ------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `list_components`         | `category?`                     | Lists all extracted Angular Material components/directives, optionally filtered by category.                    |
| `get_component_api`       | `componentName`, `importStyle?` | Full extracted API (selector, inputs, outputs, methods) plus curated gotchas/examples for one component.        |
| `search_components`       | `query`                         | Finds components matching a natural-language description of desired UI behavior, ranked by relevance.           |
| `get_composition_pattern` | `patternName`                   | Curated multi-component wiring pattern (e.g. `table-sort-paginator`) with ready-to-use template/component code. |
| `get_theming_guide`       | `topic`                         | Curated theming guide (setup code, explanation, gotchas) for a topic such as `initial-setup` or `dark-mode`.    |
| `get_schematics_usage`    | `schematicName`                 | Curated usage info for an Angular Material CLI schematic, such as `ng-add`.                                     |

All tools return typed JSON. Lookups that don't match a known name return `{ isError: true, message }`
rather than throwing, so a bad component/pattern/topic name never crashes the server.

## Troubleshooting

**Server exits immediately with a `@angular/material was not found` message.**
`ANGULAR_PROJECT_PATH` isn't pointing at (or an ancestor isn't) a directory with
`@angular/material` in `node_modules`. Run `npm install` in your Angular project first, then
double-check the path is absolute and correct.

**A client shows 0 tools or fails to connect.**
Check the client's MCP server logs — this server logs the resolved `@angular/material`/`@angular/cdk`
versions, project path, and import style to stderr on startup at `LOG_LEVEL=info` or above. Try
`LOG_LEVEL=debug` for per-file extraction timings if extraction seems slow or stuck.

**`cdk/*` lookups return "not found" even though other tools work.**
`@angular/cdk` is an optional second root — if it's not installed in your project,
Material-only tools keep working, but `get_component_api({ componentName: "cdk/..." })` calls will
fail until you install `@angular/cdk`.

See [`INSTALL_AND_VALIDATE.md`](./INSTALL_AND_VALIDATE.md) for a full walkthrough of installing
against a real project and exercising every tool through Claude Code.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the curated-data schema and how to add or edit
composition patterns, theming guides, schematics usage, and per-component overlays.

## Security

See [`SECURITY.md`](./SECURITY.md) for the threat model and how to report a vulnerability.

## License

MIT — see [`LICENSE`](./LICENSE).
