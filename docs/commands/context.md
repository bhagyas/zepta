# Context

Discover workspace, schemes, simulators, and build configs.

Use `context` to inspect a project and output all available build options.

## Examples

```bash
# Show project context (human readable)
zepta context

# JSON output for agents/automation
zepta context --json

# Point to a specific project directory
zepta context --project /path/to/project
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--project` | `-p` | Project directory |
| `--json` | `-j` | Output as JSON |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
{
  "workspace": "MyApp.xcworkspace",
  "schemes": [
    { "name": "MyApp", "category": "Apps", "platform": "iOS" }
  ],
  "buildConfigurations": ["Debug", "Release"],
  "derivedDataPath": "/Users/you/Library/Developer/zepta/DerivedData",
  "simulators": [
    {
      "name": "iPhone 16",
      "udid": "...",
      "platform": "iOS",
      "osVersion": "18.0",
      "state": "Shutdown",
      "isAvailable": true
    }
  ]
}
```
