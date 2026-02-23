# Run

Build and launch an app on a simulator, device, or macOS.

`run` automates the full workflow: resolve simulator (or create it if missing), boot it, build for that destination, install the app, and launch. You can run with just a simulator name from your project root (workspace and scheme are auto-discovered), or after `zepta init` with no extra flags. If the simulator doesn't exist, zepta can create it automatically (see **Auto-create simulator** below).

## Examples

```bash
# One-liner from project root: build and run on iPhone 16 (workspace/scheme auto-discovered)
zepta run -S "iPhone 16"

# After init, run with saved settings
zepta run

# Run on a simulator (explicit workspace and scheme)
zepta run -w MyApp.xcworkspace -s MyApp -S "iPhone 16"

# Run on macOS
zepta run -D "My Mac"

# Skip build and launch existing app
zepta run --no-build

# Stream logs after launch
zepta run --log

# Pass launch arguments and env vars (use = for values with spaces)
zepta run --launch-options=-AppleLanguages
zepta run --launch-env=DEBUG=1

# Create simulator if missing (non-interactive: use first matching device type and runtime)
zepta run -S "iPhone 16" --create-simulator

# JSON output
zepta run --json
zepta run --print-command
zepta run --dry-run --json
```

## Auto-create simulator

If the simulator name (e.g. `-S "iPhone 16"`) is not found:

- **With `--create-simulator` or in a TTY:** zepta will create it via `xcrun simctl create` using a matching device type and an available iOS runtime, then continue.
- **Interactive (TTY, no `--json`):** you can choose which device type to create (if the name matches multiple or none exactly) and which iOS runtime to use.
- **Without `--create-simulator` and not a TTY:** zepta exits with "Simulator not found".

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Path to workspace or project |
| `--scheme` | `-s` | Scheme name |
| `--simulator` | `-S` | Simulator name/UDID |
| `--device` | `-D` | Device name/UDID ("My Mac" for macOS) |
| `--no-build` | | Skip build step and launch existing app |
| `--log` | `-l` | Stream logs after launch |
| `--json` | `-j` | Output NDJSON events |
| `--launch-options` | | App launch arguments |
| `--launch-env` | | App launch environment variables |
| `--create-simulator` | | Create simulator if not found (or prompt when TTY) |
| `--print-command` | | Print underlying `xcodebuild`/`simctl`/`devicectl` commands |
| `--dry-run` | | Compose build/launch commands but do not execute |
| `--config` | `-c` | Load settings from JSON config |

## JSON output (NDJSON)

```json
{"type":"status","stage":"LAUNCHING","message":"Launching on iPhone 16"}
{"type":"result","success":true,"operation":"run"}
```

With `--print-command` or `--dry-run`, run emits `command` events with the exact shell command strings it would execute.
