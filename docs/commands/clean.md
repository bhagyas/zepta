# Clean

Clean scheme artifacts, zepta Derived Data, and Xcode cache.

Use `clean` to remove build artifacts and caches. With no flags, it cleans scheme build artifacts when workspace/scheme are set (e.g. from init).

## Examples

```bash
# Clean scheme artifacts (after init)
zepta clean

# Clean zepta/Xcode Derived Data or Xcode cache
zepta clean --derived-data
zepta clean --xcode-derived-data
zepta clean --xcode-cache

# Clean everything
zepta clean --all

# With workspace and scheme
zepta clean -w MyApp.xcworkspace -s MyApp

# Verbose output
zepta clean --all --verbose

# JSON result
zepta clean --json
```

## Options

| Option | Description |
|--------|-------------|
| `--derived-data` | Delete zepta Derived Data |
| `--xcode-derived-data` | Delete Xcode Derived Data |
| `--xcode-cache` | Delete Xcode cache |
| `--all` | Clean scheme, zepta/Xcode Derived Data, and cache |
| `--workspace` | `-w` Workspace or project path |
| `--scheme` | `-s` Scheme name |
| `--derived-data-path` | `-d` Custom derived data path |
| `--config` | `-c` Load settings from JSON config |
| `--json` | `-j` Output JSON result |
| `--verbose` | `-v` Show clean output |
| `--examples` | `-e` Show usage examples |

## JSON output

```json
{"type":"result","success":true}
```
