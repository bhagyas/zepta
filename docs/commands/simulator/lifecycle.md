# Simulator lifecycle

Create, boot, shutdown, erase, delete, and open simulators.

## zepta simulator create

Create a simulator with the given name (e.g. "iPhone 16") if it doesn't exist. Uses `xcrun simctl create` with a matching device type and an available iOS runtime. When run in a TTY (and not `--json`), prompts to choose device type if the name doesn't match exactly, and to choose iOS runtime if multiple are available.

### Examples

```bash
zepta simulator create "iPhone 16"
zepta simulator create "iPhone 16 Pro" --json
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | `-j` Output JSON with udid and name |

---

## zepta simulator boot

Boot a simulator so it is ready to run apps. Accepts UDID or simulator name (e.g. "iPhone 16").

### Examples

```bash
zepta simulator boot <UDID>
zepta simulator boot "iPhone 16"
zepta simulator boot <UDID> --json
```

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | `-v` Show command output |
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |

---

## zepta simulator shutdown

Shut down a running simulator.

### Examples

```bash
zepta simulator shutdown <UDID>
zepta simulator shutdown "iPhone 16"
zepta simulator shutdown <UDID> --json
```

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | `-v` Show command output |
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |

---

## zepta simulator erase

Erase simulator content/settings.

- Flag-driven: pass `<UDID|name>` directly.
- Interactive: if omitted in a TTY session (without `--json`), zepta prompts you to pick a simulator.

### Examples

```bash
zepta simulator erase <UDID>
zepta simulator erase "iPhone 16"
zepta simulator erase --json
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |

---

## zepta simulator delete

Delete a simulator.

- Flag-driven: pass `<UDID|name>` directly.
- Interactive: if omitted in a TTY session (without `--json`), zepta prompts you to pick a simulator.

### Examples

```bash
zepta simulator delete <UDID>
zepta simulator delete "iPhone 16"
zepta simulator delete --json
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |

---

## zepta simulator prune

Delete unavailable simulators.

### Examples

```bash
zepta simulator prune
zepta simulator delete-unavailable
zepta simulator prune --json
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | `-j` Output JSON |

---

## zepta simulator runtime

List simulator runtimes.

### Examples

```bash
zepta simulator runtime list
zepta simulator runtime list --json
zepta simulator runtime available -P iOS --json
zepta simulator runtime create --path /path/to/iOS.simruntime
zepta simulator runtime delete com.apple.CoreSimulator.SimRuntime.iOS-18-0
zepta simulator runtime prune --days 30 --dry-run
```

### Options

| Option | Description |
|--------|-------------|
| `-P`, `--platform` | Platform filter (`iOS`, `tvOS`, `watchOS`) |
| `-A`, `--available-only` | Only include available runtimes |
| `--path` | Runtime disk image path for `runtime create` |
| `--move` | Move runtime image after successful add (`runtime create`) |
| `--async` | Return immediately after starting add (`runtime create`) |
| `--identifier` | Runtime identifier for `runtime delete` |
| `--days` | Days threshold for `runtime prune` |
| `--dry-run` | Preview runtime deletion for delete/prune |
| `--json` | `-j` Output JSON |

---

## zepta simulator location

Set or clear simulator location.

- Flag-driven: pass coordinates and optional `--udid`.
- Interactive: if coordinates are omitted in a TTY session (without `--json`), zepta prompts for latitude/longitude.

### Examples

```bash
zepta simulator location set 37.3349 -122.0090
zepta simulator location set --latitude 37.3349 --longitude -122.0090 --udid booted
zepta simulator location clear --udid booted
```

### Options

| Option | Description |
|--------|-------------|
| `--udid`, `-u` | Simulator UDID or name (default: `booted`) |
| `--latitude` | Latitude for `location set` |
| `--longitude` | Longitude for `location set` |
| `--json` | `-j` Output JSON |

---

## zepta simulator media add

Add one or more media files to a simulator photo library.

- Flag-driven: pass media file path(s) directly.
- Interactive: if omitted in a TTY session (without `--json`), zepta prompts for a path.

### Examples

```bash
zepta simulator media add /tmp/photo.jpg
zepta simulator media add /tmp/photo1.jpg /tmp/photo2.jpg --udid booted
zepta simulator media add --path /tmp/photo.jpg --json
```

### Options

| Option | Description |
|--------|-------------|
| `--udid`, `-u` | Simulator UDID or name (default: `booted`) |
| `--path` | Single media file path |
| `--json` | `-j` Output JSON |

---

## zepta simulator device-types

List simulator device types.

### Examples

```bash
zepta simulator device-types
zepta simulator device-types -P iPhone --json
```

### Options

| Option | Description |
|--------|-------------|
| `-P`, `--platform` | Product family filter |
| `--json` | `-j` Output JSON |

---

## zepta simulator screenshot

Capture a screenshot from a simulator.

### Examples

```bash
zepta simulator screenshot
zepta simulator screenshot "iPhone 16" --output /tmp/iphone16.png
zepta simulator screenshot --json
```

### Options

| Option | Description |
|--------|-------------|
| `--output` | Screenshot file path |
| `--json` | `-j` Output JSON |

---

## zepta simulator open

Open Simulator.app.

### Examples

```bash
zepta simulator open
zepta simulator open --json
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | `-j` Output JSON |
| `--examples` | `-e` Show usage examples |
