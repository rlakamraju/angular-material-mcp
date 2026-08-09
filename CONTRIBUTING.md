# Contributing

## Curated data

`src/data/` holds hand-written content that can't be derived by parsing `.d.ts` files:
composition patterns, theming guides, and schematics usage. Each subdirectory is a category, and
each `.json` file inside it is looked up by filename (minus `.json`) from a tool's input — e.g.
`get_theming_guide({ topic: "initial-setup" })` reads `src/data/theming/initial-setup.json`.

File names must be a plain token (letters, digits, `.`, `_`, `-`, no path separators) — this is
enforced by the tool handlers, not just a convention, since the name comes directly from
untrusted tool input.

Every file is validated against a Zod schema (`src/data/schemas.ts`) that mirrors the
corresponding TypeScript interface in `src/types/component-metadata.ts` /
`src/types/tool-responses.ts`. Schemas use `.strict()`, so an unknown field is a validation error,
not a silently-ignored typo.

### `src/data/compositions/*.json` — `CompositionPattern`

| field               | type       | notes                                                       |
| ------------------- | ---------- | ----------------------------------------------------------- |
| `name`              | `string`   | Should match the filename.                                  |
| `description`       | `string`   | One or two sentences on what the pattern does.              |
| `components`        | `string[]` | Component names (as used by `get_component_api`) involved.  |
| `standaloneImports` | `string[]` | Symbols to add to a standalone component's `imports` array. |
| `templateCode`      | `string`   | Complete, working HTML template.                            |
| `componentCode`     | `string`   | Complete, working standalone component TypeScript.          |
| `notes`             | `string[]` | Gotchas specific to wiring these components together.       |
| `version`           | `string`   | Angular Material version the example was written against.   |

### `src/data/theming/*.json` — `ThemingGuide`

| field           | type       | notes                                              |
| --------------- | ---------- | -------------------------------------------------- |
| `topic`         | `string`   | Should match the filename.                         |
| `version`       | `string`   | Angular Material version the guidance applies to.  |
| `approach`      | `string`   | One-paragraph summary of the recommended approach. |
| `setupCode`     | `string`   | Complete Sass/CSS setup snippet.                   |
| `explanation`   | `string`   | Longer-form explanation of how/why it works.       |
| `relatedTopics` | `string[]` | Other topic keys worth cross-referencing.          |
| `gotchas`       | `string[]` | Common mistakes.                                   |

### `src/data/schematics/*.json` — `SchematicInfo`

| field            | type                | notes                                           |
| ---------------- | ------------------- | ----------------------------------------------- |
| `name`           | `string`            | Should match the filename.                      |
| `command`        | `string`            | The base `ng ...` invocation.                   |
| `description`    | `string`            | What the schematic does.                        |
| `options`        | `SchematicOption[]` | See below.                                      |
| `generatedFiles` | `string[]`          | Files/config the schematic creates or modifies. |
| `example`        | `string`            | A full invocation with representative flags.    |

Each `SchematicOption` is `{ name, type, description, default? }`.

### Adding or editing a data file

1. Add or edit the `.json` file under the right category directory.
2. Run `npm run validate-data` — it walks every file under `src/data/**` and validates it against
   the schema for its category, exiting non-zero with the offending file path and field(s) on any
   violation.
3. Run `npm test` — tool tests exercise both the found-key and missing-key paths.

CI runs `validate-data` on every push/PR, so a malformed data file fails the build before it
reaches `npm test`.
