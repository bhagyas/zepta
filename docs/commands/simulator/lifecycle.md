# Simulator lifecycle

Boot, shutdown, and open simulators.

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
