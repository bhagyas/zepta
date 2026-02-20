# Update

Check for updates (stub).

zepta is distributed via npm. Use `npm update -g zepta` to update. The built-in `update` command is a stub.

## Examples

```bash
zepta update
zepta update --check
zepta update --check --json
```

## Options

| Option | Description |
|--------|-------------|
| `--check` | Only check for updates; do not install |
| `--json` | Output JSON |
| `--examples` | `-e` Show usage examples |

## JSON output (update --check)

```json
{"updateAvailable":false,"message":"No updates available (clone)"}
```

To update zepta, run:

```bash
npm update -g zepta
```
