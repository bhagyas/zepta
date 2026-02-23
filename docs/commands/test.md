# Test commands

Run and discover unit and UI tests.

## zepta test

Run unit and UI tests.

### Examples

```bash
# After zepta init, run tests with saved settings
zepta test

# Run all tests (without init)
zepta test -w MyApp.xcworkspace -s MyScheme -S "iPhone 16"

# Run on macOS
zepta test -D "My Mac"

# Run specific tests with --only (full or short form)
zepta test --only MyAppTests/LoginTests/testLogin
zepta test --only LoginTests/testValidLogin
zepta test --only LoginTests

# Skip specific tests (short form: prefix with SchemeTests/ automatically)
zepta test --skip SlowTests
zepta test --skip MyAppTests/SlowTests

# Run a specific test plan
zepta test --plan "Smoke.xctestplan"

# JSON output
zepta test --json
zepta test --dry-run --json
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Workspace or project path |
| `--scheme` | `-s` | Scheme name |
| `--simulator` | `-S` | Simulator name/UDID (required for iOS) |
| `--device` | `-D` | Device ("My Mac" for macOS) |
| `--configuration` | `-C` | Build configuration |
| `--only` | | Run only specific tests (short form: `LoginTests/testValidLogin` is expanded to `SchemeTests/LoginTests/testValidLogin`) |
| `--skip` | | Skip specific tests (same short-form expansion as `--only`) |
| `--plan` | | Test plan name or path |
| `--create-simulator` | | Create simulator if not found (or prompt when TTY) |
| `--json` | `-j` | Output NDJSON events |
| `--verbose` | `-v` | Show xcodebuild output |
| `--xcodebuild-options` | | Extra xcodebuild arguments |
| `--xcodebuild-env` | | Xcodebuild environment variables |
| `--print-command` | | Print the exact `xcodebuild` command |
| `--dry-run` | | Compose command but do not execute test run |

### JSON output (NDJSON)

With `--json`, zepta parses xcodebuild test output and emits real test events:

- **status** – Building/running stage.
- **test_passed** / **test_failed** – Per test: `testName`, `duration` (seconds).
- **result** – `success`, `totalTests`, `passedTests`, `failedTests`, `duration`.

```json
{"type":"status","stage":"COMPILING","message":"Building for testing..."}
{"type":"status","stage":"TESTING","message":"Running tests on iPhone 16"}
{"type":"test_passed","testName":"-[MyAppTests.LoginTests testValidLogin]","duration":0.12}
{"type":"test_failed","testName":"-[MyAppTests.LoginTests testInvalidLogin]","duration":0.05}
{"type":"result","success":false,"operation":"test","totalTests":2,"passedTests":1,"failedTests":1,"skippedTests":0,"duration":5.2}
```

---

## zepta test discover

Discover tests by parsing Swift source files (or return stub data).

### Examples

```bash
zepta test discover
zepta test discover -w MyApp.xcworkspace -s MyScheme --json
zepta test discover --filter Login
```

### Options

| Option | Description |
|--------|-------------|
| `--filter` | Filter tests by name (case-insensitive) |
| `--json` | Output as JSON |

### JSON output

```json
{
  "tests": [
    {
      "target": "MyAppTests",
      "class": "LoginTests",
      "method": "testValidLogin",
      "identifier": "MyAppTests/LoginTests/testValidLogin",
      "file": "LoginTests.swift",
      "filePath": "/path/to/LoginTests.swift",
      "lineNumber": 1,
      "isSkipped": false
    }
  ]
}
```

---

## zepta test plans

List test plans referenced by the scheme.

### Examples

```bash
zepta test plans
zepta test plans -w App.xcworkspace -s MyScheme --json
```

### JSON output

```json
{
  "plans": [
    {
      "name": "Default",
      "reference": "container:Default.xctestplan",
      "path": "Default.xctestplan",
      "isDefault": true,
      "isMissing": false
    }
  ]
}
```
