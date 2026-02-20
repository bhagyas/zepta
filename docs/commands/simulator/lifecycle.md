# Simulator lifecycle

Create, boot, shutdown, and open simulators.

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
