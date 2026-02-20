# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- **Destination validation and clearer errors** – When the configured simulator or device is missing or unavailable, zepta now:
  - **Pre-validates** the simulator for `build` and `test`: if the simulator name/UDID is not found or the runtime is unavailable, zepta exits with a clear message before calling xcodebuild.
  - **Detects** the xcodebuild error "The requested device could not be found because no available devices matched the request" and appends a tip: run `zepta simulator list` to see available simulators, or `zepta init` to reconfigure.

## [0.1.0] - 2025-02-20

### Added

- **GitHub Actions publish** – Workflow to publish to npm on push of a version tag (`v*`). Runs tests first, uses `NPM_TOKEN` secret and npm provenance. See [Publishing](docs/publishing.md) for setup and best practices.

- **Interactive init** – `zepta init` can now prompt for missing values when run in a TTY. If you omit workspace, scheme, or simulator/device, zepta will discover options (e.g. `.xcworkspace`/`.xcodeproj` in the current directory, schemes for the chosen workspace, available simulators or devices) and let you choose via numbered selection. Non-interactive and `--json` usage is unchanged: all required options must be provided or the command exits with an error.
