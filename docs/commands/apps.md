# Apps

List apps launched by zepta.

Lists apps that zepta has launched (tracked in `~/.zepta-launched-apps.json`).

## Examples

```bash
zepta apps
zepta apps --json
```

## Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON array |
| `--examples` | Show usage examples |

## JSON output

```json
[
  {
    "id": "com.example.MyApp",
    "bundleId": "com.example.MyApp",
    "simulatorUdid": "...",
    "launchedAt": "2025-02-20T12:00:00.000Z"
  }
]
```

If no apps have been launched by zepta, the array is empty.
