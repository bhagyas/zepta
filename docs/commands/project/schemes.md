# Schemes

List schemes in a workspace or project.

## Examples

```bash
# List schemes (uses current directory or -w)
zepta project schemes -w App.xcworkspace

# List schemes as JSON
zepta project schemes -w App.xcworkspace --json
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--project` | `-p` | Project directory |
| `--workspace` | `-w` | Path to workspace or project |
| `--json` | `-j` | Output as JSON |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
[
  {
    "name": "MyApp",
    "category": "Apps",
    "isShared": true,
    "platform": "iOS"
  }
]
```

If not run from an Xcode project directory or `xcodebuild -list` fails, an empty array is returned.
