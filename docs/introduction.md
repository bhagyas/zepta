# CLI Introduction

A fast terminal CLI for Xcode, iOS, and macOS workflows — build, run, test, and simulate without opening Xcode.

## Why zepta?

- **Terminal-first** – Build, run, and test directly from your terminal
- **CI/CD ready** – JSON output mode for automation pipelines
- **AI agent compatible** – Designed to work with AI assistants and scripts
- **API-compatible** – Aims for parity with FlowDeck CLI where practical

## Key features

- **Build & run** – Compile and launch iOS/macOS apps on simulators or devices
- **Test execution** – Run unit and UI tests with detailed results
- **Simulator management** – Boot, shutdown, and list iOS simulators
- **Device support** – List and install on physical Apple devices
- **Log streaming** – Real-time log streaming from running apps
- **JSON output** – Machine-readable output for automation
- **Project discovery** – Context, schemes, and build configurations
- **Project creation** – Generate new Xcode project stubs with `zepta project create`

## Requirements

- **macOS** (Node.js and Xcode with Command Line Tools)
- **Node.js** – To run zepta
- **Xcode** – For building and running apps

## Quick start

```bash
# Install zepta
npm install -g zepta

# CD to your iOS/macOS project
cd ~/myApp

# Discover project structure
zepta context --json

# Initialize (interactive: choose workspace, scheme, simulator when run in a terminal)
zepta init
# Or with all options: zepta init -w MyApp.xcworkspace -s MyApp -S "iPhone 16"

# Run commands without parameters (uses saved settings)
zepta build
zepta run
zepta test
zepta clean
```

## Static CLI usage (recommended for agents)

1. Discover project structure: `zepta context --json`
2. Initialize: `zepta init -w <workspace> -s <scheme> -S "<simulator>"` (or `-D "<device>"` for macOS/device)
3. Run: `zepta build`, `zepta run`, `zepta test`, `zepta clean` use saved settings from `.zepta.json`

## Getting help

```bash
zepta --help
zepta --version
zepta <command> --examples
```

See [Commands Overview](commands/overview.md) for the full command index.
