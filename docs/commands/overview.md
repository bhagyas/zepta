# Command overview

Complete command and option index for zepta CLI.

## Command structure

```bash
zepta <command> [subcommand] [options]
```

## Command index

### Core actions

| Command | Description |
|--------|-------------|
| `init` | Save project settings (workspace, scheme, target, configuration) |
| `context` | Inspect workspace, schemes, simulators, and build configs |
| `build` | Build for simulator, device, or macOS |
| `run` | Build and launch on simulator, device, or macOS |
| `test` | Run unit/UI tests |
| `test discover` | Discover tests (static parsing) |
| `test plans` | List test plans from scheme |
| `clean` | Clean scheme artifacts, zepta Derived Data, and Xcode cache |
| `logs` | Stream logs for a running app |
| `stop` | Stop a running app |
| `apps` | List apps launched by zepta |

### Project tools

| Command | Description |
|--------|-------------|
| `project create` | Create a new Xcode project (stub) |
| `project schemes` | List schemes |
| `project configs` | List build configurations |
| `project packages list` | List Swift packages (stub) |
| `project packages add` | Add package dependency (Swift package manifest mode) |
| `project packages link` | Link local package path (Swift package manifest mode) |
| `project packages remove` | Remove package dependency from `Package.swift` |
| `project packages resolve` | Resolve package dependencies via xcodebuild |
| `project packages update` | Force package dependency resolution/update |
| `project packages clear` | Clear SourcePackages cache (and global SwiftPM cache with `--all`) |
| `project sync-profiles` | Trigger provisioning profile sync via xcodebuild |

### Simulators

| Command | Description |
|--------|-------------|
| `simulator list` | List simulators |
| `simulator boot` | Boot a simulator |
| `simulator shutdown` | Shut down a simulator |
| `simulator screenshot` | Save screenshot from a simulator |
| `simulator erase` | Erase simulator content and settings |
| `simulator delete` | Delete simulator by name/UDID |
| `simulator prune` / `delete-unavailable` | Remove unavailable simulators |
| `simulator runtime list` | List runtimes from simctl |
| `simulator runtime available` | Compatibility alias (prints installed runtimes) |
| `simulator runtime create` | Add `.simruntime` image to simulator runtime storage |
| `simulator runtime delete` | Delete a runtime by identifier |
| `simulator runtime prune` | Delete runtimes not used in N days |
| `simulator device-types` | List simulator device types |
| `simulator location set/clear` | Set or clear simulated GPS location |
| `simulator media add` | Add media to simulator library |
| `simulator clear-cache` | Remove CoreSimulator cache |
| `simulator open` | Open Simulator.app |

### Devices

| Command | Description |
|--------|-------------|
| `device list` | List connected devices (includes My Mac / My Mac Catalyst) |
| `device install` | Install an app on a device |
| `device uninstall` | Remove an app from a device |
| `device launch` | Launch an app on a device |

### UI automation

| Command | Description |
|--------|-------------|
| `ui simulator screen` | Capture screenshot (and optionally accessibility tree stub) |
| `ui simulator record` | Record simulator video |
| `ui simulator open-url` | Open URL in simulator |
| `ui simulator key` / `hide-keyboard` | Send simulator key presses |
| `ui simulator wait` / `back` / `button` | Timing and navigation helpers |
| `ui simulator erase` / `clear-state` | Reset simulator content/settings |
| `ui simulator session start|stop|status` | Persist UI automation session metadata |
| `ui simulator assert ...` | Run assertion helpers for text/equality/file checks |
| Other `ui simulator *` | Tap, type, swipe, etc. (stubs) |

### Other

| Command | Description |
|--------|-------------|
| `license status` | Show license status (open source) |
| `license activate` / `deactivate` | Stubs (no activation required) |
| `update` | Update check (stub) |

## Global flags

| Flag | Description |
|------|-------------|
| `-h, --help` | Show help |
| `--version` | Show CLI version |
| `--changelog` | Print changelog path/URL |
| `--dry-run` | Compose command but skip execution (for supporting commands) |
| `--print-command` | Print the underlying command (xcodebuild/simctl) |

`--dry-run` and `--print-command` are supported on xcodebuild-backed flows (`build`, `test`, `run`, `project sync-profiles`, `project packages resolve|update`).

## Common options

| Option | Short | Description |
|--------|-------|-------------|
| `--project` | `-p` | Project directory |
| `--workspace` | `-w` | Path to .xcworkspace or .xcodeproj |
| `--scheme` | `-s` | Scheme name |
| `--configuration` | `-C` | Build configuration (Debug/Release) |
| `--simulator` | `-S` | Simulator name or UDID |
| `--device` | `-D` | Device name or UDID ("My Mac" for macOS) |
| `--derived-data-path` | `-d` | Derived data path |
| `--json` | `-j` | Output as JSON / NDJSON |
| `--examples` | `-e` | Show usage examples |

## Aliases

| Alias | Command |
|-------|---------|
| `sim` | `simulator` |
| `dev` | `device` |
| `log` | `logs` |
| `up` | `update` |

## JSON output

Commands that support `--json` output newline-delimited JSON (NDJSON) events for streaming commands (build, run, test, logs), or a single JSON object for query commands (context, init, simulator list, etc.).

## Environment variables

| Variable | Description |
|---------|-------------|
| `DEVELOPER_DIR` | Override Xcode installation path |
