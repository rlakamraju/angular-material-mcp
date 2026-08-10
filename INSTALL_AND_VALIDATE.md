# Install & validate angular-material-mcp

A step-by-step walkthrough for installing `angular-material-mcp` against a real Angular Material
project and confirming every tool works through Claude Code. This is the manual pass referenced
by [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) Phase 16 and
[`RELEASE.md`](./RELEASE.md) step 5 — run it once against fixtures to sanity-check the setup, then
once for real before cutting a release.

## 0. Prerequisites

- Node.js `>= 20` (`node -v`)
- Claude Code installed and working (`claude --version`)
- A real Angular project with `@angular/material` installed in `node_modules`. If you don't have
  one handy:

  ```bash
  npm install -g @angular/cli
  ng new mat-test-app --standalone --routing=false --style=scss
  cd mat-test-app
  ng add @angular/material   # accept the prompts; pick any theme
  ```

  Note the absolute path to this project — you'll need it below.

## 1. Get the server running standalone first

Before wiring it into any MCP client, confirm the server itself starts and gates correctly. This
isolates "is the server broken" from "is the MCP client config broken."

From this repo:

```bash
npm install
npm run build
```

**Test the fail-fast gate** (no real project pointed at — this should fail loudly and clearly):

```bash
cd C:\  # anywhere with no @angular/material anywhere in its parent chain
node "d:\Raghu\SavvientsProjects\angular-material-mcp\dist\index.js"
```

Expected: exits with code 1 and a stderr message telling you to `npm install` an Angular project
or set `ANGULAR_PROJECT_PATH`. If you instead see it hang or exit 0, something regressed in the
resolver — stop and investigate before continuing.

**Test the happy path** against your real project:

```bash
$env:ANGULAR_PROJECT_PATH = "C:\path\to\mat-test-app"   # PowerShell
node "d:\Raghu\SavvientsProjects\angular-material-mcp\dist\index.js"
```

Expected stderr output (then it hangs, waiting on stdio — that's correct, it's a server):

```
angular-material-mcp v1.0.0 starting
  @angular/material: <your installed version> (resolved via env)
  @angular/cdk: <version> (resolved via env) OR "not installed — cdk/* lookups unavailable"
  project path: C:\path\to\mat-test-app
  import style: standalone
angular-material-mcp: server connected via stdio, ready for requests
```

Press `Ctrl+C`. It should print `Received SIGINT, shutting down` and
`angular-material-mcp: server stopped`, and exit — if it hangs for more than a couple seconds,
that's a bug.

## 2. Wire it into Claude Code

Add an `.mcp.json` at the root of `mat-test-app` (or wherever you run `claude` from):

```json
{
  "mcpServers": {
    "angular-material": {
      "command": "node",
      "args": ["d:/Raghu/SavvientsProjects/angular-material-mcp/dist/index.js"],
      "env": {
        "ANGULAR_PROJECT_PATH": "C:/path/to/mat-test-app",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

Once this package is published to npm, replace `command`/`args` with the npx form documented in
[`README.md`](./README.md):

```json
{
  "mcpServers": {
    "angular-material": {
      "command": "npx",
      "args": ["-y", "angular-material-mcp"],
      "env": { "ANGULAR_PROJECT_PATH": "C:/path/to/mat-test-app" }
    }
  }
}
```

Launch Claude Code from that directory (`cd mat-test-app && claude`), then run:

```
/mcp
```

**Expected**: `angular-material` shows as connected, with 6 tools listed:
`list_components`, `get_component_api`, `search_components`, `get_composition_pattern`,
`get_theming_guide`, `get_schematics_usage`.

If it shows 0 tools or a connection error, check `LOG_LEVEL=debug` in the env block above and
re-run — the resolved versions/paths in the startup banner will usually point at the problem
(see the Troubleshooting section of [`README.md`](./README.md)).

## 3. Validate each tool with a real prompt

Type these directly into Claude Code's chat, one at a time. Each entry lists what tool call you
should see it make and what a correct response looks like.

### `list_components`

> **Prompt**: "Using the angular-material MCP server, list all Angular Material components in
> the `data-table` category."

Expect a `list_components` call with `category: "data-table"`, returning entries including
`table`, `paginator`, `sort` with their `className`/`description`/`composedWith`.

### `get_component_api`

> **Prompt**: "Using the angular-material MCP server, show me the full API for the `table`
> component — inputs, outputs, and any gotchas."

Expect a `get_component_api` call with `componentName: "table"`, returning non-empty `inputs`
(e.g. `dataSource`), `outputs`, `methods`, and (since curated content exists for `table`)
non-empty `gotchas`/`minimalExample`.

Also try a miss: **"What's the API for a component called `frobnicator`?"** — expect
`isError: true` with a message suggesting `list_components`/`search_components`, not a crash.

### `search_components`

> **Prompt**: "Using the angular-material MCP server, search for a dropdown that filters options
> as the user types."

Expect a `search_components` call with that query, and `autocomplete` ranked above unrelated
components like `select` in the `results`.

### `get_composition_pattern`

> **Prompt**: "Using the angular-material MCP server, get the composition pattern for wiring a
> table with sort and pagination."

Expect a `get_composition_pattern` call, likely `patternName: "table-sort-paginator"`, returning
complete `templateCode`/`componentCode` — paste both into `mat-test-app` and confirm `ng build`
(or `ng serve`) doesn't error.

### `get_theming_guide`

> **Prompt**: "Using the angular-material MCP server, how do I set up a custom Angular Material
> theme from scratch?"

Expect a `get_theming_guide` call, likely `topic: "initial-setup"` or `"custom-theme"`, returning
non-empty `setupCode` and `explanation`.

### `get_schematics_usage`

> **Prompt**: "Using the angular-material MCP server, how do I use `ng add @angular/material`?"

Expect a `get_schematics_usage` call with `schematicName: "ng-add"`, returning the `command`,
`options`, and an `example` invocation.

### `@angular/cdk` (only if `@angular/cdk` is installed in `mat-test-app`)

> **Prompt**: "Using the angular-material MCP server, show me the API for `cdk/drag-drop`."

Expect `get_component_api` with `componentName: "cdk/drag-drop"` to resolve successfully. If CDK
isn't installed, expect a clear "not found" `isError`, not a crash — and confirm the other 5 tools
still work fine (CDK absence must never break Material-only tools).

## 4. Confirm the "why" behind a couple of edge cases

- **Restart Claude Code after `npm uninstall @angular/material` in `mat-test-app`.** `/mcp`
  should show the server failing to connect / erroring at startup rather than silently serving
  stale data — there's deliberately no fallback dataset.
- **Ask a component question with `LOG_LEVEL=debug` set.** Check the server's stderr (visible via
  Claude Code's MCP logs / `claude --debug`) for per-file extraction timings on the first call,
  and confirm the second identical call is served from cache (no repeated timings).

## 5. Sign-off checklist

- [ ] Fail-fast gate exits 1 with a clear message when no `@angular/material` is resolvable.
- [ ] Happy-path startup banner shows correct versions/path/import style.
- [ ] `Ctrl+C` / `SIGTERM` shuts down cleanly within ~2s, logging "server stopped".
- [ ] `/mcp` in Claude Code shows all 6 tools connected.
- [ ] Each of the 6 tools returns a correct, non-placeholder response for at least one real input.
- [ ] At least one "not found" input per lookup tool returns `isError: true` without crashing.
- [ ] `cdk/*` behaves correctly whether or not `@angular/cdk` is installed.
- [ ] At least one `get_composition_pattern` example was pasted into a real project and built.

Once every box is checked against a real project, the "all 6 tools verified once against a real
Angular Material project and Claude Code's `/mcp`" success criterion for Phase 16 is satisfied.
