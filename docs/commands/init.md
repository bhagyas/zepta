# Init

Save project settings for streamlined CLI usage.

Save project settings (workspace, scheme, target, configuration) so you can run build/run/test/clean without repeating flags.

**Required (or chosen interactively):** `--workspace` and `--scheme`, and either `--simulator` or `--device`.

When you run `zepta init` from a project directory **without** all required options and stdin is a TTY (and you don’t pass `--json`), zepta will prompt you to choose missing values:

- **Workspace** – If omitted, zepta discovers `.xcworkspace` and `.xcodeproj` in the current directory and lets you pick one.
- **Scheme** – If omitted, zepta lists schemes for the chosen workspace and lets you pick one.
- **Simulator or device** – If both are omitted, zepta asks whether to use a simulator or device, then shows a numbered list to choose from.

Non-interactive usage (e.g. in scripts or with `--json`) is unchanged: you must pass all required options or the command exits with an error.

## Examples

```bash
# iOS Simulator
zepta init -w App.xcworkspace -s MyApp -S "iPhone 16"

# macOS target
zepta init -w App.xcworkspace -s MyApp -D "My Mac"

# Physical device
zepta init -w App.xcworkspace -s MyApp -D "John's iPhone"

# With build configuration
zepta init -w App.xcworkspace -s MyApp -S "iPhone 16" -C Debug

# Re-initialize (overwrite existing config)
zepta init -w App.xcworkspace -s MyApp -S "iPhone 16" --force

# JSON output for automation
zepta init -w App.xcworkspace -s MyApp -S "iPhone 16" --json

# Interactive: choose missing workspace, scheme, and simulator/device (when run in a TTY)
zepta init

# Interactive: only choose scheme and simulator (workspace already set)
zepta init -w App.xcworkspace
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Path to .xcworkspace or .xcodeproj (required) |
| `--scheme` | `-s` | Scheme name (required) |
| `--simulator` | `-S` | Simulator name or UDID |
| `--device` | `-D` | Device name or UDID ("My Mac" for macOS) |
| `--configuration` | `-C` | Build configuration (Debug/Release) |
| `--force` | `-f` | Overwrite existing .zepta.json |
| `--json` | `-j` | Output as JSON |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
{
  "success": true,
  "message": "Project initialized",
  "workspace": "App.xcworkspace",
  "scheme": "MyApp",
  "target": "iPhone 16",
  "targetType": "simulator",
  "configuration": "Debug"
}
```
