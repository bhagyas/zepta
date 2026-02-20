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

# Run specific tests with --only
zepta test --only MyTests/LoginTests
zepta test --only MyTests/LoginTests/testLogin

# Skip specific tests
zepta test --skip MyTests/SlowTests

# Run a specific test plan
zepta test --plan "Smoke.xctestplan"

# JSON output
zepta test --json
```

### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--workspace` | `-w` | Workspace or project path |
| `--scheme` | `-s` | Scheme name |
| `--simulator` | `-S` | Simulator name/UDID (required for iOS) |
| `--device` | `-D` | Device ("My Mac" for macOS) |
| `--configuration` | `-C` | Build configuration |
| `--only` | | Run only specific tests |
| `--skip` | | Skip specific tests |
| `--plan` | | Test plan name or path |
| `--json` | `-j` | Output NDJSON events |
| `--verbose` | `-v` | Show xcodebuild output |

### JSON output (NDJSON)

```json
{"type":"status","stage":"COMPILING","message":"Building for testing..."}
{"type":"status","stage":"TESTING","message":"Running tests on iPhone 16"}
{"type":"result","success":true,"operation":"test","totalTests":1,"passedTests":1,"failedTests":0,"skippedTests":0,"duration":5.2}
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
