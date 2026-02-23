# UI automation

Capture and interact with the simulator.

zepta UI automation runs under `zepta ui simulator`.

## Common flags

- `--udid` or `-u` – Target a specific simulator (default: booted).
- `--json` or `-j` – Machine-readable output.
- `--output` – File path for screenshot or recording.

## Implemented commands

| Command | Purpose | Notes |
|---------|---------|--------|
| `ui simulator screen` | Screenshot | Saves PNG to `--output` or temp file. |
| `ui simulator screen --tree` | Accessibility tree | Stub; prints "not implemented". |
| `ui simulator record` | Record video | Captures `.mov` for `--duration` seconds. |
| `ui simulator open-url` | Open URL | Uses `simctl openurl`. |
| `ui simulator key` | Press key | Uses `simctl keypress`. |
| `ui simulator hide-keyboard` | Hide keyboard | Sends `escape` keypress. |
| `ui simulator wait` | Delay execution | Waits N seconds. |
| `ui simulator back` | Back action | Sends Escape keypress. |
| `ui simulator button` | Hardware-style button action | Maps names like `home`, `lock`, `siri` to keypresses. |
| `ui simulator erase` / `clear-state` | Reset simulator state | Uses `simctl erase`. |
| `ui simulator session start|stop|status` | Session lifecycle | Persists session metadata to `~/.zepta-ui-session.json`. |
| `ui simulator assert` | Assertions | Supports `text`, `equals`, `file-exists`, `visible`, `hidden`, `enabled`, `disabled`. |

## Stub commands

These accept the same subcommand name and print "Not implemented":

- `find`, `tap`, `double-tap`, `type`, `swipe`, `scroll`, `back`, `pinch`, `rotate`
- `find`, `tap`, `double-tap`, `type`, `swipe`, `scroll`, `pinch`, `rotate`, `touch down` / `touch up`

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

# Open URL and keypress
zepta ui simulator open-url https://example.com
zepta ui simulator key home
zepta ui simulator hide-keyboard
zepta ui simulator wait 1.5
zepta ui simulator back
zepta ui simulator button home
zepta ui simulator erase

# Session handling
zepta ui simulator session start --name smoke
zepta ui simulator session status --json
zepta ui simulator session stop

# Assertions
zepta ui simulator assert text --actual "Welcome" --contains "Wel"
zepta ui simulator assert equals --actual "A" --expected "A"
zepta ui simulator assert file-exists /tmp/screen.png
```

## JSON output (screen)

```json
{"screenshot": "/path/to/screenshot.png"}
```

## Input modes

- Flag-based mode: pass values as args/flags (for example `open-url <url>`, `key <name>`, `assert ... --actual ...`).
- Interactive mode: when required values are omitted and running in a TTY without `--json`, zepta prompts for missing input where supported.
