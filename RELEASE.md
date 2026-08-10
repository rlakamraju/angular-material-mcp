# Release process

Releases are cut manually — there is no changesets/semantic-release automation. Follow this
checklist in order; each step assumes the previous one passed.

## Checklist

1. **Confirm `main` is clean and green.**

   ```bash
   git status
   git pull
   npm ci
   npm run lint && npm run format:check && npm run typecheck && npm run validate-data
   npm test
   npm run build
   ```

   All of the above must exit 0 before continuing.

2. **Bump the version.** Decide the new version per semver (breaking / feature / fix), then:

   ```bash
   npm version <major|minor|patch> --no-git-tag-version
   ```

   This updates `package.json` and `package-lock.json` but does not create a git commit or tag —
   we do that explicitly below so the changelog update lands in the same commit.

3. **Update `CHANGELOG.md`.** Add a new `## [x.y.z] - YYYY-MM-DD` section at the top (below the
   header) following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) conventions —
   `Added` / `Changed` / `Fixed` / `Removed` as applicable — and add the new version's link
   reference at the bottom of the file.

4. **Build and sanity-check the package contents.**

   ```bash
   npm run build
   npm pack --dry-run
   ```

   Confirm the file list is exactly `dist/**`, `README.md`, `LICENSE` (plus `package.json`,
   which npm always includes) — nothing from `src/`, `tests/`, or internal docs. Also confirm
   `dist/index.js`'s first line is `#!/usr/bin/env node`.

5. **Smoke-test the packed tarball against a real project**, not just fixtures:

   ```bash
   npm pack
   # in a scratch directory with a real Angular + @angular/material project:
   npm install --no-save /path/to/angular-material-mcp-x.y.z.tgz
   ANGULAR_PROJECT_PATH=/path/to/that/project npx angular-material-mcp
   ```

   It should log the startup banner (own version, detected `@angular/material`/`@angular/cdk`
   versions, project path, import style) and stay running, waiting on stdio. `Ctrl+C` should exit
   cleanly (code 0) within a couple seconds. Delete the local `.tgz` afterward.

   For the full manual tool-by-tool verification through an actual MCP client, follow
   [`INSTALL_AND_VALIDATE.md`](./INSTALL_AND_VALIDATE.md).

6. **Commit the version bump and changelog together.**

   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: release vX.Y.Z"
   ```

7. **Tag and push.**

   ```bash
   git tag vX.Y.Z
   git push origin main
   git push origin vX.Y.Z
   ```

8. **Publish to npm.**

   ```bash
   npm publish --access public
   ```

   `files` in `package.json` (`dist`, `README.md`, `LICENSE`) is the only content published —
   double-check `npm pack --dry-run` output one more time if anything changed since step 4.

9. **Create the GitHub release** from tag `vX.Y.Z`, pasting the new `CHANGELOG.md` section as the
   release notes.

## Rolling back a bad publish

npm does not allow re-publishing the same version. If a published version is broken:

- `npm deprecate angular-material-mcp@x.y.z "<reason>"` to warn consumers.
- Fix forward with a new patch version through this same checklist — do not attempt to unpublish
  unless there's a security or legal reason (`npm unpublish` is restricted to a 72-hour window
  and breaks anyone who already installed that version).
