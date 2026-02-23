# Sync profiles

Trigger Xcode provisioning profile synchronization for a workspace/project and scheme.

This command runs an `xcodebuild` build with `-allowProvisioningUpdates` and `-allowProvisioningDeviceRegistration`.

## Examples

```bash
zepta project sync-profiles -w App.xcworkspace -s App
zepta project sync-profiles -w App.xcworkspace -s App -C Release --json
zepta project sync-profiles -w App.xcworkspace -s App --destination "generic/platform=iOS"
zepta project sync-profiles -w App.xcworkspace -s App --print-command --dry-run --json
```

## Options

| Option | Description |
|--------|-------------|
| `-w`, `--workspace` | Workspace or project path (required) |
| `-s`, `--scheme` | Scheme name (required) |
| `-C`, `--configuration` | Build configuration (`Debug` by default) |
| `--destination` | Xcode build destination (default: `generic/platform=iOS`) |
| `--xcodebuild-options` | Extra `xcodebuild` arguments |
| `--xcodebuild-env` | Xcodebuild environment variables |
| `--print-command` | Print exact `xcodebuild` command |
| `--dry-run` | Compose command but skip execution |
| `--json` | Output JSON |
| `--examples` | Show usage examples |
