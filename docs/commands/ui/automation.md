# UI automation

Capture and interact with the simulator (partial implementation).

zepta UI automation runs under `zepta ui simulator`. **Screen** (screenshot) is implemented; **record** and other commands are stubs that return "Not implemented."

## Common flags

- `--udid` or `-u` – Target a specific simulator (default: booted).
- `--json` or `-j` – Machine-readable output.
- `--output` – File path for screenshot or recording.

## Implemented commands

| Command | Purpose | Notes |
|---------|---------|--------|
| `ui simulator screen` | Screenshot | Saves PNG to `--output` or temp file. |
| `ui simulator screen --tree` | Accessibility tree | Stub; prints "not implemented". |

## Stub commands

These accept the same subcommand name and print "Not implemented":

- `record` – Record simulator video
- `session start` / `session stop`
- `find`, `tap`, `double-tap`, `type`, `swipe`, `scroll`, `back`, `pinch`, `rotate`
- `wait`, `assert visible` / `hidden` / `enabled` / `disabled` / `text`
- `erase`, `hide-keyboard`, `key`, `open-url`, `clear-state`, `button`, `touch down` / `touch up`

## Examples

```bash
# Take a screenshot (saved to file)
zepta ui simulator screen
zepta ui simulator screen --output /tmp/screen.png
zepta ui simulator screen --output /tmp/screen.png --json

# Request accessibility tree (stub)
zepta ui simulator screen --tree --json

# Stub commands
zepta ui simulator record
zepta ui simulator tap
```

## JSON output (screen)

```json
{"screenshot": "/path/to/screenshot.png"}
```

For full UI automation (tap, type, assertions, etc.), use Xcode or a commercial tool like FlowDeck.
