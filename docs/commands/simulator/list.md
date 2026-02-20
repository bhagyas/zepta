# Simulator list

List available simulators.

List available simulators, optionally filtered by platform. Output can be a flat JSON array (FlowDeck-style) or human-readable.

## Examples

```bash
# List all simulators
zepta simulator list

# Filter by platform
zepta simulator list -P iOS
zepta simulator list --platform iOS

# Show only available simulators
zepta simulator list -A
zepta simulator list --available-only

# JSON output (flat array)
zepta simulator list --json
```

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--platform` | `-P` | Filter by platform (iOS, tvOS, watchOS, visionOS) |
| `--available-only` | `-A` | Show only available simulators |
| `--json` | `-j` | Output as JSON array |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
[
  {
    "udid": "12345678-1234-1234-1234-123456789ABC",
    "name": "iPhone 16 Pro",
    "platform": "iOS",
    "osVersion": "18.0",
    "state": "Shutdown",
    "isAvailable": true,
    "deviceTypeIdentifier": "com.apple.CoreSimulator.SimDeviceType.iPhone-16-Pro",
    "runtimeIdentifier": "com.apple.CoreSimulator.SimRuntime.iOS-18-0"
  }
]
```
