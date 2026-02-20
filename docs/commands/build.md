# Build

Build the project for simulator, device, or macOS.

After running `zepta init`, you can call `zepta build` with no extra flags.

## Examples

```bash
# After init, build using saved settings
zepta build

# Build for iOS simulator
zepta build -w MyApp.xcworkspace -s MyApp -S "iPhone 16"

# Build for macOS
zepta build -w MyApp.xcworkspace -s MyApp -D "My Mac"

# Build for a physical device
zepta build -w MyApp.xcworkspace -s MyApp -D "John's iPhone"

# Release configuration
zepta build -C Release

# JSON output for automation
zepta build --json

# Verbose output (show xcodebuild output)
zepta build -v

# Extra xcodebuild arguments (use = to avoid parsing issues)
zepta build --xcodebuild-options=-quiet
zepta build --xcodebuild-env=CI=true

# Load settings from config file
zepta build --config .zepta.json
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Path to workspace or project |
| `--scheme` | `-s` | Scheme name |
| `--configuration` | `-C` | Build configuration (Debug/Release) |
| `--simulator` | `-S` | Simulator name/UDID |
| `--device` | `-D` | Device name/UDID ("My Mac" for macOS) |
| `--derived-data-path` | `-d` | Derived data path |
| `--json` | `-j` | Output NDJSON events |
| `--verbose` | `-v` | Show build output |
| `--config` | `-c` | Load settings from JSON config file |
| `--xcodebuild-options` | | Extra xcodebuild arguments |
| `--xcodebuild-env` | | Xcodebuild environment variables |

## JSON output (NDJSON)

When `--json` is set, build emits one JSON object per line:

```json
{"type":"status","stage":"COMPILING","message":"Compiling sources..."}
{"type":"result","success":true,"operation":"build","duration":12.5}
```
