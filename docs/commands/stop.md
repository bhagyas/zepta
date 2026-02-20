# Stop

Stop a running app launched by zepta.

Use `stop` to terminate a running app by its bundle ID (or app ID from zepta's tracking).

## Examples

```bash
# Stop a specific app by bundle ID
zepta stop com.example.MyApp

# Stop all running apps tracked by zepta
zepta stop --all

# JSON output
zepta stop com.example.MyApp --json
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<app-id>` | App identifier (bundle ID or tracked ID) |

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--all` | `-a` | Stop all tracked apps |
| `--force` | `-f` | Force kill (stub; simctl may not support) |
| `--json` | `-j` | Output JSON |
| `--examples` | `-e` | Show usage examples |

## JSON output

```json
{"type":"result","stopped":"com.example.MyApp"}
```

Or for `--all`:

```json
{"type":"result","stopped":2}
```
