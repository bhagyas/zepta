# Logs

Stream real-time logs from a running app.

Stream logs for an app launched by zepta. The identifier can be a bundle ID or app ID. Requires a booted simulator.

## Examples

```bash
# Stream logs for a bundle ID
zepta logs com.example.MyApp

# JSON output (NDJSON)
zepta logs com.example.MyApp --json
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<identifier>` | App identifier (bundle ID or app ID) |

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--json` | `-j` | Output as NDJSON |
| `--examples` | `-e` | Show usage examples |

## JSON output (NDJSON)

When `--json` is set, each log line is a JSON object:

```json
{"type":"log","message":"..."}
```

Logs are supported for simulator and macOS launches. For physical devices, use Console.app or Xcode.
