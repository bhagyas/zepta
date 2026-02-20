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

# Create simulator if missing (e.g. fresh Xcode install)
zepta build -w App.xcworkspace -s App -S "iPhone 16" --create-simulator

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
| `--create-simulator` | | Create simulator if not found (or prompt when TTY) |
| `--json` | `-j` | Output NDJSON events |
| `--verbose` | `-v` | Show build output |
| `--config` | `-c` | Load settings from JSON config file |
| `--xcodebuild-options` | | Extra xcodebuild arguments |
| `--xcodebuild-env` | | Xcodebuild environment variables |

## "The requested device could not be found"

If your config or flags point to a simulator that doesn’t exist or whose runtime was removed, zepta will report it before running xcodebuild, or xcodebuild may fail with that message. Fix it by:

- Running `zepta simulator list` to see available simulators.
- Running `zepta init` (interactive) to pick a valid workspace, scheme, and simulator/device.

## JSON output (NDJSON)

When `--json` is set, build emits structured NDJSON so CI and agents can parse failures without regex on raw xcodebuild output:

- **build_started** – Scheme and destination.
- **error** – For each compiler error/warning: `file`, `line`, `column`, `message`, `severity` (Swift/Clang format).
- **build_completed** – `success` (boolean), `duration` (seconds).

Example:

```json
{"type":"build_started","scheme":"MyApp","destination":"platform=iOS Simulator,name=iPhone 16"}
{"type":"error","file":"/path/ContentView.swift","line":42,"column":15,"message":"cannot convert value of type 'String' to expected argument type 'Int'","severity":"error"}
{"type":"build_completed","success":false,"duration":8.2}
```
