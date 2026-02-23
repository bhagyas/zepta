# Swift packages

Manage Swift Package Manager dependencies.

`project packages` supports cache and dependency resolution workflows that map to `xcodebuild` and SwiftPM cache locations.

## Examples

```bash
zepta project packages list
zepta project packages list --json
zepta project packages resolve -w App.xcworkspace -s App
zepta project packages update -w App.xcworkspace -s App --json
zepta project packages clear
zepta project packages clear --all
zepta project packages add https://github.com/apple/swift-argument-parser.git --from 1.5.0
zepta project packages link ../LocalKit
zepta project packages remove swift-argument-parser
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `list` | List packages (stub; may return empty) |
| `add` | Add dependency via `swift package add-dependency` |
| `link` | Add local path dependency via `swift package add-dependency --path` |
| `remove` | Remove dependency entry from `Package.swift` by URL/name/identity |
| `resolve` | Run `xcodebuild -resolvePackageDependencies` |
| `update` | Run package resolution update |
| `clear` | Remove package caches (`DerivedData/SourcePackages`; add `--all` for global SwiftPM cache) |

## Options

| Option | Description |
|--------|-------------|
| `-w`, `--workspace` | Workspace/project for resolve/update |
| `-s`, `--scheme` | Scheme for resolve/update |
| `--manifest` | Path to `Package.swift` (default: `./Package.swift`) |
| `--url` | Package URL/input (for add/remove) |
| `--path` | Local package path (for add/link) |
| `--from`, `--exact`, `--up-to-next-major`, `--up-to-next-minor`, `--branch`, `--revision` | Version requirement flags for `add` |
| `--name`, `--identity` | Removal token aliases for `remove` |
| `--all` | With `clear`, include global SwiftPM cache |
| `--json` | Output JSON |
| `--examples` | Show usage examples |

## Input modes

- Flag-based mode: pass URL/path/token directly as arguments or flags.
- Interactive mode: when required inputs are missing and running in a TTY without `--json`, zepta prompts for the missing value.
