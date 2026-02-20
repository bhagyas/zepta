# Create project

Create a new Xcode project (stub structure).

Creates a directory and a minimal .xcodeproj bundle. Multi-platform options are accepted and stored in JSON output.

## Examples

```bash
# Create an iOS project in the current directory
zepta project create MyApp

# Create the project in a specific directory
zepta project create MyApp --path ~/Projects

# Multi-platform
zepta project create MyApp --platforms ios,macos

# Custom bundle identifier
zepta project create MyApp --bundle-id com.acme.MyApp

# JSON output for automation
zepta project create MyApp --json
```

## Arguments

| Argument | Description |
|----------|-------------|
| `<name>` | App name (e.g. MyApp) |

## Options

| Option | Short | Description |
|--------|-------|-------------|
| `--bundle-id` | `-b` | Bundle identifier (default: com.example.<name>) |
| `--platforms` | | Comma-separated: ios, macos, visionos (default: ios) |
| `--path` | `-o` | Output directory (default: current directory) |
| `--json` | `-j` | Output as JSON |

## JSON output

```json
{
  "success": true,
  "projectPath": "/Users/me/Projects/MyApp",
  "xcodeproj": "/Users/me/Projects/MyApp/MyApp.xcodeproj",
  "bundleIdentifier": "com.example.MyApp",
  "platforms": ["ios"]
}
```
