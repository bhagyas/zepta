# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [0.2.0] - 2025-02-20

### Added

- **Auto-create simulator when missing** – If the requested simulator (e.g. `-S "iPhone 16"`) doesn't exist, zepta can create it via `xcrun simctl create` and then continue. Use `--create-simulator` to enable in non-interactive environments. When run in a TTY (and not `--json`), zepta will prompt to choose device type (if the name doesn't match exactly) and iOS runtime (if multiple are available). Works for `build`, `run`, and `test`. New subcommand: `zepta simulator create "iPhone 16"` to create a simulator explicitly.

- **Structured build output (`zepta build --json`)** – With `--json`, build now emits NDJSON: `build_started` (scheme, destination), one `error` object per compiler error/warning (file, line, column, message, severity), and `build_completed` (success, duration). CI and agents can parse failures without regex on raw xcodebuild output.

- **Structured test output (`zepta test --json`)** – Test command parses xcodebuild test output and emits real events: `test_passed` / `test_failed` per test (testName, duration) and a final `result` with actual totalTests, passedTests, failedTests, and duration.

- **Short test identifiers for `--only` and `--skip`** – You can use short forms like `LoginTests/testValidLogin` or `LoginTests`; zepta expands them to full identifiers by prefixing with `SchemeTests/` (e.g. `MyAppTests/LoginTests/testValidLogin`). Matches FlowDeck-style DX.

- **Caching for faster repeated commands** – Simulator list (`xcrun simctl list -j`) is cached in memory for 60s so multiple commands (build, run, context, simulator list) in the same session reuse one result. `xcodebuild -list` output is cached per (projectDir, workspace) with 60s TTL so `context` and scheme discovery are faster on repeated runs.

- **Run with just simulator: `zepta run -S "iPhone 16"`** – From a project root, you can run with only `-S` (simulator). Workspace and scheme are auto-discovered from the current directory (same logic as `zepta init`), so the full flow (list simulators → boot → xcodebuild → install → launch) is handled by one command. No need to pass `-w`/`-s` or run `zepta init` first when the project has a single workspace and scheme.

- **Test: setup empty project and run on iPhone 16 simulator** – New test in `project-create-and-build.test.js` that runs the full workflow: `zepta project create EmptyApp` → `zepta init` with iPhone 16 → `zepta run -S "iPhone 16"`. Verifies init config and that the run step is attempted (stub project causes build to fail; test asserts the workflow and output).

- **Destination validation and clearer errors** – When the configured simulator or device is missing or unavailable, zepta now:
  - **Pre-validates** the simulator for `build` and `test`: if the simulator name/UDID is not found or the runtime is unavailable, zepta exits with a clear message before calling xcodebuild.
  - **Detects** the xcodebuild error "The requested device could not be found because no available devices matched the request" and appends a tip: run `zepta simulator list` to see available simulators, or `zepta init` to reconfigure.

## [0.1.0] - 2025-02-20

### Added

- **GitHub Actions publish** – Workflow to publish to npm on push of a version tag (`v*`). Runs tests first, uses `NPM_TOKEN` secret and npm provenance. See [Publishing](docs/publishing.md) for setup and best practices.

- **Interactive init** – `zepta init` can now prompt for missing values when run in a TTY. If you omit workspace, scheme, or simulator/device, zepta will discover options (e.g. `.xcworkspace`/`.xcodeproj` in the current directory, schemes for the chosen workspace, available simulators or devices) and let you choose via numbered selection. Non-interactive and `--json` usage is unchanged: all required options must be provided or the command exits with an error.
