# zepta

A fast terminal CLI for Xcode, iOS, and macOS workflows — build, run, test, and simulate without opening Xcode.

**Requirements:** Node.js, Xcode (including Command Line Tools). No extra dependencies at runtime.

## Install

```bash
npm install -g zepta
# or clone and link
npm link
```

## Usage

```bash
zepta <command> [options]
```


| Command                             | Description                                        |
| ----------------------------------- | -------------------------------------------------- |
| `context`                           | Show workspace, schemes, build configs, simulators |
| `build`                             | Build for simulator or device                      |
| `run`                               | Build, install, and launch the app                 |
| `test`                              | Run tests (`test discover`, `test plans`)          |
| `clean`                             | Clean build artifacts / derived data               |
| `logs`                              | Stream app logs by identifier                      |
| `project create`                    | Create a new project (stub)                        |
| `simulator list` / `simulator boot` | List or boot simulators                            |
| `device list` / `device install`    | List devices, install app                          |
| `ui simulator screen`               | Take simulator screenshot                          |
| `license`                           | License status                                     |
| `init`                              | Save settings to `.zepta.json`                     |


Common options: `-w`/`--workspace`, `-s`/`--scheme`, `-S` simulator, `-D` device, `-c`/`--config`, `--json`, `--examples`.

## Commercial alternative

**[Flowdeck](https://flowdeck.app)** is a commercial CLI and workflow tool for Xcode/iOS development. If you need a polished, supported product with more features, check it out.

## API compatibility & credits

This project **aims to be API-compatible** with Flowdeck’s CLI where practical, so scripts and tooling written for Flowdeck can work with zepta. The project is intended to **eventually evolve on its own**, with its own direction and feature set.

Thanks to the **Flowdeck author** for the inspiration and for showing what a great Xcode CLI can look like.

## Development

Run the test suite (Jest):

```bash
npm test
```

Tests cover CLI parsing, init/config, build/run/clean, simulator/device, and a full workflow: create empty project → init for iPhone 16 → run on simulator.

## Contributing

Contributions are welcome. Maintainers: see [Publishing](docs/publishing.md) for releasing to npm via GitHub Actions. Many commands are still stubs or partial (e.g. `project create`, `run` app path resolution, `test discover`/`plans`, `simulator`/`device` subcommands, `ui` accessibility). If you implement a missing feature or fix a bug, please open a **pull request**. 

## License

MIT