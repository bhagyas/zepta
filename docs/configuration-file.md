# Configuration file

Define build settings in JSON for reproducible, portable builds.

Instead of passing parameters on the command line, you can use a JSON configuration file. zepta reads `.zepta.json` from the current directory when you don't pass `--config`, or you can pass an explicit path with `--config`.

## Using a config file

```bash
zepta build --config path/to/config.json
zepta run --config path/to/config.json
zepta test --config path/to/config.json
```

Or run from a directory that contains `.zepta.json` (e.g. after `zepta init`); zepta will load it automatically.

## Config file structure

```json
{
  "workspace": "MyApp.xcworkspace",
  "scheme": "MyApp",
  "configuration": "Debug",
  "platform": "iOS",
  "version": "18.0",
  "deviceUdid": "00008030-001234567890ABCD",
  "simulatorUdid": "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
  "simulator": "iPhone 16",
  "device": "My Mac",
  "derivedDataPath": "~/Library/Developer/zepta/DerivedData",
  "xcodebuild": {
    "args": ["-enableCodeCoverage", "YES"],
    "env": {
      "CI": "true"
    }
  },
  "appLaunch": {
    "args": ["-SkipOnboarding"],
    "env": {
      "DEBUG_MODE": "1"
    }
  }
}
```

## Field reference

| Field | Type | Description |
|-------|------|-------------|
| `workspace` | string | Path to .xcworkspace or .xcodeproj (relative to project root) |
| `scheme` | string | Scheme name to build |
| `configuration` | string | Build configuration (Debug/Release or custom) |
| `platform` | string | Target platform (iOS, macOS, etc.) |
| `version` | string | OS version (e.g. 18.0) |
| `deviceUdid` | string | Physical device UDID |
| `simulatorUdid` | string | Simulator UDID |
| `simulator` | string | Simulator name (e.g. "iPhone 16") |
| `device` | string | Device name (e.g. "My Mac") |
| `derivedDataPath` | string | Custom derived data directory |
| `xcodebuild` | object | `args` (array) and `env` (object) for xcodebuild |
| `appLaunch` | object | `args` and `env` passed to the app at launch (run only) |

## Target resolution

zepta uses this order to decide where to build/run:

1. **Device** – If `device` or `deviceUdid` is set (e.g. "My Mac" or physical UDID)
2. **Simulator** – If `simulator` or `simulatorUdid` is set
3. **macOS** – If device is "My Mac" or "My Mac Catalyst"

## CLI override

Command-line parameters override config file values:

```bash
# Config has configuration "Debug"; this builds Release
zepta build --config config.json -C Release
```

## File location

- Default: `.zepta.json` in the current directory (created by `zepta init`).
- Explicit: any path passed via `--config` or `-c`.
