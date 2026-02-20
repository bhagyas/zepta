# Device commands

Manage physical iOS, iPadOS, watchOS, tvOS, and visionOS devices.

zepta provides device management via `devicectl` (Xcode). The list command always includes virtual "My Mac" and "My Mac Catalyst" entries. Alias: `dev`.

## zepta device list

List connected physical devices and virtual macOS targets.

### Examples

```bash
zepta device list
zepta device list -P iOS
zepta device list --platform iOS
zepta device list -A
zepta device list --json
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--platform` | `-P` | Filter by platform |
| `--available-only` | `-A` | Show only available devices |
| `--json` | `-j` | Output as JSON |
| `--examples` | `-e` | Show usage examples |

### JSON output

```json
[
  {
    "name": "My Mac",
    "platform": "macOS",
    "isAvailable": true,
    "isVirtual": true,
    "description": "Build and run as native macOS app"
  },
  {
    "name": "My Mac Catalyst",
    "platform": "macOS",
    "isAvailable": true,
    "isVirtual": true,
    "description": "Build and run iOS app via Mac Catalyst"
  },
  {
    "udid": "00008030-001234567890ABCD",
    "name": "John's iPhone",
    "platform": "iOS",
    "osVersion": "18.1",
    "deviceType": "iPhone 16 Pro",
    "connectionType": "USB",
    "isAvailable": true,
    "isVirtual": false
  }
]
```

---

## zepta device install

Install an app bundle (.app) on a physical device.

### Examples

```bash
zepta device install <UDID> /path/to/MyApp.app
zepta device install <UDID> /path/to/MyApp.app --json
```

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | `-v` Show command output |
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |

---

## zepta device uninstall

Remove an installed app from a physical device.

### Examples

```bash
zepta device uninstall <UDID> com.example.MyApp
zepta device uninstall <UDID> com.example.MyApp --json
```

Requires `devicectl` support; may fall back to a message if not available.

---

## zepta device launch

Launch an installed app on a physical device.

### Examples

```bash
zepta device launch <UDID> com.example.MyApp
zepta device launch <UDID> com.example.MyApp --json
```

Use `zepta device list --json` to get device UDIDs.
