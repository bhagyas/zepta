# Build configurations

List build configurations (Debug, Release, and any custom configs).

## Examples

```bash
# List configurations
zepta project configs -w App.xcworkspace

# List as JSON
zepta project configs --json
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Path to workspace or project |
| `--project` | `-p` | Project directory |
| `--json` | `-j` | Output as JSON |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
["Debug", "Release"]
```

If not run from an Xcode project directory, returns `["Debug", "Release"]` as default.
