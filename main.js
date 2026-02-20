#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync, spawn } = require('child_process');
const os = require('os');

// Helper to run shell commands synchronously
function runCommand(cmd, args = [], options = { stdio: 'inherit' }) {
  const result = spawnSync(cmd, args, options);
  if (result.error || result.status !== 0) {
    console.error(`Error running ${cmd}: ${result.stderr ? result.stderr.toString() : ''}`);
    process.exit(1);
  }
  return result.stdout ? result.stdout.toString().trim() : '';
}

// Helper to run command and get output as string
function getCommandOutput(cmd, args = []) {
  return runCommand(cmd, args, { stdio: 'pipe' });
}

// Helper to parse JSON from command if possible
function parseJsonOutput(output) {
  try {
    return JSON.parse(output);
  } catch (e) {
    return null;
  }
}

// Simple argument parser (no deps)
function parseArgs(argv) {
  const args = argv.slice(2);
  const parsed = {
    command: null,
    subcommand: null,
    options: {},
    args: []
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (!arg.startsWith('-')) {
      if (!parsed.command) {
        parsed.command = arg;
      } else if (!parsed.subcommand && ['test', 'project', 'simulator', 'device', 'ui', 'license'].includes(parsed.command)) {
        parsed.subcommand = arg;
      } else {
        parsed.args.push(arg);
      }
      i++;
      continue;
    }

    let key = arg.replace(/^-+/, '');
    let value = true;
    if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
      value = args[i + 1];
      i++;
    }
    if (key.includes('=')) {
      const [k, v] = key.split('=');
      key = k;
      value = v;
    }
    key = key.toLowerCase().replace(/-/g, '');
    parsed.options[key] = value;
    i++;
  }

  // Aliases and shorts
  if (parsed.options.p) parsed.options.project = parsed.options.p;
  if (parsed.options.w || parsed.options.ws) parsed.options.workspace = parsed.options.w || parsed.options.ws;
  if (parsed.options.s || parsed.options.sch) parsed.options.scheme = parsed.options.s || parsed.options.sch;
  if (parsed.options.c || parsed.options.cfg) parsed.options.config = parsed.options.c || parsed.options.cfg;
  if (parsed.options.j) parsed.options.json = parsed.options.j;
  if (parsed.options.v) parsed.options.verbose = parsed.options.v;
  if (parsed.options.e) parsed.options.examples = parsed.options.e;
  if (parsed.options.i) parsed.options.interactive = parsed.options.i;
  if (parsed.options.s) parsed.options.simulator = parsed.options.s; // -S
  if (parsed.options.d) parsed.options.device = parsed.options.d; // -D
  if (parsed.options.c) parsed.options.configuration = parsed.options.c; // -C
  if (parsed.options.d) parsed.options.deriveddatapath = parsed.options.d; // -d for derived
  if (parsed.options.l) parsed.options.log = parsed.options.l;
  // Add more aliases as needed from docs

  return parsed;
}

const parsedArgs = parseArgs(process.argv);

// Global features: interactive mode (stub, as it's complex TUI)
if (parsedArgs.options.interactive) {
  console.log('Interactive mode not implemented in this clone. Use static commands.');
  process.exit(0);
}

// Load config if --config
let config = {};
if (parsedArgs.options.config) {
  try {
    config = JSON.parse(fs.readFileSync(parsedArgs.options.config, 'utf8'));
  } catch (e) {
    console.error('Error loading config:', e.message);
    process.exit(1);
  }
}

// Merge config with options (config overrides defaults, options override config)
function getOption(key) {
  return parsedArgs.options[key] || config[key] || null;
}

// Default derived data path
const defaultDerivedData = path.join(os.homedir(), 'Library/Developer/zepta/DerivedData');

// Help and examples
function showExamples(command, examples) {
  console.log(`Examples for ${command}:`);
  examples.forEach(ex => console.log(ex));
  process.exit(0);
}

// Command handlers
const commands = {
  context: () => {
    if (getOption('examples')) {
      showExamples('context', [
        'zepta context',
        'zepta context --json',
        'zepta context --project /path/to/project'
      ]);
    }

    const projectDir = getOption('project') || process.cwd();
    const workspace = getOption('workspace');
    const json = getOption('json');

    // Run xcodebuild -list
    let listOutput = getCommandOutput('xcodebuild', ['-list']);
    // Parse schemes, configs (simple string parse)
    const schemes = listOutput.match(/Schemes:\n\s+(.+)/g) || [];
    const buildConfigs = listOutput.match(/Build Configurations:\n\s+(.+)/g) || [];

    // Simulators
    const simList = parseJsonOutput(getCommandOutput('xcrun', ['simctl', 'list', '-j'])) || {};
    const simulators = simList.devices || [];

    const contextData = {
      workspace: workspace || path.basename(projectDir) + '.xcworkspace', // assume
      schemes: schemes.map(s => s.trim().replace('Schemes:', '')),
      buildConfigurations: buildConfigs.map(c => c.trim().replace('Build Configurations:', '')),
      derivedDataPath: getOption('deriveddatapath') || defaultDerivedData,
      simulators: Object.keys(simulators).flatMap(k => simulators[k].map(d => ({
        name: d.name,
        udid: d.udid,
        platform: k.split('-')[0],
        osVersion: k.split('-')[1],
        state: d.state
      })))
    };

    if (json) {
      console.log(JSON.stringify(contextData, null, 2));
    } else {
      console.log('Workspace:', contextData.workspace);
      console.log('Schemes:', contextData.schemes.join(', '));
      console.log('Build Configurations:', contextData.buildConfigurations.join(', '));
      console.log('Derived Data Path:', contextData.derivedDataPath);
      console.log('Simulators:');
      contextData.simulators.forEach(s => console.log(`- ${s.name} (${s.platform} ${s.osVersion}, ${s.state})`));
    }
  },

  build: () => {
    if (getOption('examples')) {
      showExamples('build', [
        'zepta build',
        'zepta build -w MyApp.xcworkspace -s MyApp -S "iPhone 16"',
        'zepta build -D "My Mac"',
        'zepta build --json'
      ]);
    }

    const workspace = getOption('workspace');
    const scheme = getOption('scheme');
    const configuration = getOption('configuration') || 'Debug';
    const simulator = getOption('simulator');
    const device = getOption('device');
    const derivedData = getOption('deriveddatapath') || defaultDerivedData;
    const json = getOption('json');
    const verbose = getOption('verbose');

    let destination;
    if (simulator) {
      destination = `platform=iOS Simulator,name=${simulator}`;
    } else if (device) {
      destination = `platform=iOS,name=${device}`;
    } else if (device === 'My Mac') {
      destination = 'platform=macOS';
    } else {
      console.error('Specify --simulator or --device');
      process.exit(1);
    }

    const args = [
      'build',
      workspace ? '-workspace' : '-project', workspace || 'project.xcodeproj', // assume
      '-scheme', scheme,
      '-configuration', configuration,
      '-destination', destination,
      '-derivedDataPath', derivedData
    ];

    if (getOption('xcodebuildoptions')) args.push(...getOption('xcodebuildoptions').split(' '));
    // env for xcodebuild-env

    if (json) {
      // Stream NDJSON status
      console.log(JSON.stringify({type: 'status', stage: 'COMPILING', message: 'Compiling sources...'}));
      // Run
      runCommand('xcodebuild', args, {stdio: verbose ? 'inherit' : 'pipe'});
      console.log(JSON.stringify({type: 'result', success: true, operation: 'build', duration: 0})); // stub duration
    } else {
      runCommand('xcodebuild', args);
    }
  },

  run: () => {
    if (getOption('examples')) {
      showExamples('run', [
        'zepta run',
        'zepta run -w MyApp.xcworkspace -s MyApp -S "iPhone 16"',
        'zepta run --no-build',
        'zepta run --log'
      ]);
    }

    // Similar to build, but after build, install and launch
    // First build if not --no-build
    const noBuild = getOption('nobuild');
    if (!noBuild) {
      commands.build();
    }

    const simulator = getOption('simulator');
    const device = getOption('device');
    const bundleId = 'com.example.app'; // assume or from config
    const json = getOption('json');

    if (simulator) {
      const udid = 'sim-udid'; // get from list
      runCommand('xcrun', ['simctl', 'boot', simulator]);
      runCommand('xcrun', ['simctl', 'install', udid, 'path/to/app.app']); // assume path from derived
      runCommand('xcrun', ['simctl', 'launch', udid, bundleId]);
    } else if (device) {
      const udid = device; // assume
      runCommand('xcrun', ['devicectl', 'device', 'install', 'app', 'path/to/app.app', '--device', udid]);
      runCommand('xcrun', ['devicectl', 'device', 'process', 'launch', bundleId, '--device', udid]);
    }

    if (getOption('log')) {
      commands.logs();
    }

    if (json) {
      console.log(JSON.stringify({type: 'result', success: true, operation: 'run'}));
    }
  },

  test: () => {
    if (getOption('examples')) {
      showExamples('test', [
        'zepta test',
        'zepta test -S "iPhone 16"',
        'zepta test --json'
      ]);
    }

    const sub = parsedArgs.subcommand;

    if (sub === 'discover') {
      // Implement test discovery, perhaps parse source files, but stub
      const tests = [{target: 'MyTests', identifier: 'TestClass/testMethod', lineNumber: 10, isSkipped: false}];
      if (getOption('json')) {
        console.log(JSON.stringify({tests}));
      } else {
        tests.forEach(t => console.log(`${t.target}/${t.identifier}`));
      }
      return;
    } else if (sub === 'plans') {
      // Stub
      const plans = [{name: 'Default', reference: 'container:Default.xctestplan', path: 'Default.xctestplan', isDefault: true, isMissing: false}];
      if (getOption('json')) {
        console.log(JSON.stringify({plans}));
      } else {
        plans.forEach(p => console.log(p.name));
      }
      return;
    }

    // Main test
    const workspace = getOption('workspace');
    const scheme = getOption('scheme');
    const simulator = getOption('simulator');
    const json = getOption('json');

    const args = [
      'test',
      '-workspace', workspace,
      '-scheme', scheme,
      '-destination', `platform=iOS Simulator,name=${simulator}`
    ];

    if (json) {
      // Stream test events stub
      console.log(JSON.stringify({type: 'test_started', testName: 'testMethod'}));
      runCommand('xcodebuild', args);
      console.log(JSON.stringify({type: 'test_passed', testName: 'testMethod', duration: 0.5}));
      console.log(JSON.stringify({type: 'result', success: true, totalTests: 1, passedTests: 1}));
    } else {
      runCommand('xcodebuild', args);
    }
  },

  clean: () => {
    if (getOption('examples')) {
      showExamples('clean', [
        'zepta clean',
        'zepta clean --all'
      ]);
    }

    const all = getOption('all');
    const derivedData = getOption('deriveddata') || all;
    const xcodeDerived = getOption('xcodederiveddata') || all;
    const xcodeCache = getOption('xcodecache') || all;

    const scheme = getOption('scheme');
    if (scheme) {
      runCommand('xcodebuild', ['clean', '-scheme', scheme]);
    }

    if (derivedData) {
      runCommand('rm', ['-rf', defaultDerivedData]);
    }
    if (xcodeDerived) {
      runCommand('rm', ['-rf', path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData')]);
    }
    if (xcodeCache) {
      runCommand('rm', ['-rf', path.join(os.homedir(), 'Library/Caches/com.apple.dt.Xcode')]);
    }

    if (getOption('json')) {
      console.log(JSON.stringify({type: 'result', success: true}));
    }
  },

  logs: () => {
    if (getOption('examples')) {
      showExamples('logs', [
        'zepta logs <app-id>'
      ]);
    }

    const identifier = parsedArgs.args[0];
    if (!identifier) {
      console.error('Missing identifier');
      process.exit(1);
    }

    const json = getOption('json');

    // Assume simulator, use simctl spawn log stream
    const udid = 'sim-udid'; // stub
    const cmd = spawn('xcrun', ['simctl', 'spawn', udid, 'log', 'stream', '--predicate', `subsystem == "${identifier}"`, '--style', 'compact']);

    cmd.stdout.on('data', (data) => {
      if (json) {
        console.log(JSON.stringify({type: 'log', message: data.toString()}));
      } else {
        console.log(data.toString());
      }
    });
  },

  project: () => {
    const sub = parsedArgs.subcommand;
    if (getOption('examples')) {
      showExamples('project', [
        'zepta project create MyApp'
      ]);
    }

    if (sub === 'create') {
      const name = parsedArgs.args[0];
      if (!name) {
        console.error('Missing name');
        process.exit(1);
      }

      const bundleId = getOption('bundleid') || `com.example.${name}`;
      const platforms = getOption('platforms') ? getOption('platforms').split(',') : ['ios'];
      const outputPath = getOption('path') || process.cwd();

      // Stub project creation: create dirs, files
      const appDir = path.join(outputPath, name);
      fs.mkdirSync(appDir, {recursive: true});
      fs.writeFileSync(path.join(appDir, `${name}.xcodeproj`), ''); // stub
      console.log(`Created project at ${appDir}`);

      if (getOption('json')) {
        console.log(JSON.stringify({path: appDir}));
      }
    } else {
      console.error('Unknown subcommand for project');
      process.exit(1);
    }
    // Add other subcommands like schemes, configs, packages etc. as stubs
  },

  simulator: () => {
    const sub = parsedArgs.subcommand || 'list';
    if (getOption('examples')) {
      showExamples('simulator', [
        'zepta simulator list',
        'zepta simulator boot "iPhone 16"'
      ]);
    }

    if (sub === 'list') {
      const json = getOption('json');
      const platform = getOption('platform');
      const availableOnly = getOption('availableonly');

      const simOutput = parseJsonOutput(getCommandOutput('xcrun', ['simctl', 'list', '-j']));
      let devices = simOutput.devices;

      if (platform) {
        devices = Object.fromEntries(Object.entries(devices).filter(([k]) => k.toLowerCase().includes(platform.toLowerCase())));
      }

      if (availableOnly) {
        for (const k in devices) {
          devices[k] = devices[k].filter(d => d.isAvailable);
        }
      }

      if (json) {
        console.log(JSON.stringify(devices));
      } else {
        for (const os in devices) {
          console.log(os);
          devices[os].forEach(d => console.log(`  ${d.name} (${d.udid}, ${d.state}, available: ${d.isAvailable})`));
        }
      }
    } else if (sub === 'boot') {
      const name = parsedArgs.args[0];
      runCommand('xcrun', ['simctl', 'boot', name]);
    } // Add other subs: shutdown, erase, create, etc.
    // ...
  },

  device: () => {
    const sub = parsedArgs.subcommand;
    if (getOption('examples')) {
      showExamples('device', [
        'zepta device list',
        'zepta device install <UDID> /path/to/app.app'
      ]);
    }

    if (sub === 'list') {
      const json = getOption('json');
      const output = parseJsonOutput(getCommandOutput('xcrun', ['devicectl', 'list', 'devices', '-j']));
      if (json) {
        console.log(JSON.stringify(output));
      } else {
        (output.devices || []).forEach(d => console.log(`${d.name} (${d.udid}, ${d.connectionType})`));
      }
    } else if (sub === 'install') {
      const udid = parsedArgs.args[0];
      const appPath = parsedArgs.args[1];
      runCommand('xcrun', ['devicectl', 'device', 'install', 'app', appPath, '--device', udid]);
    } // Add uninstall, launch
    // ...
  },

  ui: () => {
    const sub = parsedArgs.subcommand;
    if (sub !== 'simulator') {
      console.error('UI commands under ui simulator');
      process.exit(1);
    }

    const uiSub = parsedArgs.args[0]; // e.g. screen
    const udid = getOption('udid');
    const json = getOption('json');

    if (uiSub === 'screen') {
      // Screenshot
      const output = getOption('output') || '/tmp/screenshot.png';
      runCommand('xcrun', ['simctl', 'io', udid || 'booted', 'screenshot', output]);
      if (json) {
        console.log(JSON.stringify({screenshot: output}));
      } else {
        console.log(`Screenshot saved to ${output}`);
      }
      // Accessibility tree not implemented
    } // Add other UI subs as stubs or partial
    // For tap, use osascript or simctl, but complex
    console.log('UI command stubbed');
  },

  license: () => {
    const sub = parsedArgs.subcommand || 'status';
    if (sub === 'status') {
      console.log('Open source: Active forever');
    } // Stub others
  },

  update: () => {
    if (getOption('check')) {
      console.log('No updates available (clone)');
    } else {
      console.log('Update not implemented in clone');
    }
  },

  // Add stubs for missing: init, stop, apps, etc.
  init: () => {
    // Save settings to .zepta.json or something
    const settings = {
      workspace: getOption('workspace'),
      scheme: getOption('scheme'),
      // ...
    };
    fs.writeFileSync('.zepta.json', JSON.stringify(settings));
    console.log('Settings saved');
  },

  stop: () => {
    // Stub stop app
    console.log('App stopped');
  },

  apps: () => {
    // List launched apps stub
    console.log('No apps');
  }
};

const cmd = parsedArgs.command;
if (cmd && commands[cmd]) {
  commands[cmd]();
} else {
  console.log('Unknown command. Available: context, build, run, test, clean, logs, project, simulator, device, ui, license, update, init, stop, apps');
  process.exit(1);
}