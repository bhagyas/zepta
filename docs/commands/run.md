# Run

Build and launch an app on a simulator, device, or macOS.

`run` builds (unless skipped) and launches your app on the selected target. After `zepta init`, you can run without extra flags.

## Examples

```bash
# After init, run with saved settings
zepta run

# Run on a simulator
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

# JSON output
zepta run --json
```

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
| `--config` | `-c` | Load settings from JSON config |

## JSON output (NDJSON)

```json
{"type":"status","stage":"LAUNCHING","message":"Launching on iPhone 16"}
{"type":"result","success":true,"operation":"run"}
```
