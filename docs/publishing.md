# Publishing to npm

zepta is published to npm via **GitHub Actions** when you push a version tag. This document describes the workflow and best practices.

## Best practices

1. **Trigger on version tags** – The workflow runs only when you push a tag matching `v*` (e.g. `v0.1.0`, `v1.0.0`). This avoids publishing on every push and keeps releases intentional.

2. **Run tests before publish** – CI installs dependencies, runs `npm test`, and only then runs `npm publish`. Broken builds are never published.

3. **Use an npm Automation token** – In [npm → Access Tokens](https://www.npmjs.com/settings/~/tokens), create a token with **Automation** or **Publish** type (not “Legacy”). Add it as a repository secret named `NPM_TOKEN` in GitHub (Settings → Secrets and variables → Actions).

4. **Explicit registry** – The workflow sets `registry-url` to `https://registry.npmjs.org` so publishing always goes to the public npm registry.

5. **Provenance** – The workflow enables [npm provenance](https://docs.npmjs.com/generating-provenance-statements) so consumers can verify the package was built from this repository.

6. **Version in one place** – Bump `version` in `package.json` before tagging. The tag should match that version with a `v` prefix (e.g. `package.json` `"1.0.0"` → tag `v1.0.0`).

7. **Don’t publish from forks** – The publish job only runs for tag pushes; keep `NPM_TOKEN` only in the main repo so forks cannot publish to your package name.

## How to release

1. Bump version in `package.json` (e.g. `0.1.0` → `0.2.0`).
2. Update `CHANGELOG.md` under a new `## [0.2.0]` section.
3. Commit and push:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release 0.2.0"
   git push
   ```
4. Create and push the tag:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
5. GitHub Actions will run tests and publish to npm. Check the **Actions** tab for status.

## Optional: dry run

To see what would be published without publishing:

```bash
npm publish --dry-run
```

You can also add a manual workflow that runs this in CI (e.g. on `workflow_dispatch`) if you want to verify the package tarball from a clean environment.
