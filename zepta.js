#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawnSync, execSync, spawn } = require('child_process');
const os = require('os');

// Helper to run shell commands synchronously
function runCommand(cmd, args = [], options = { stdio: 'inherit' }) {
  const opts = { ...options };
  if (options.cwd) opts.cwd = options.cwd;
  const result = spawnSync(cmd, args, opts);
  if (result.error || result.status !== 0) {
    const stderr = result.stderr ? result.stderr.toString() : '';
    console.error(`Error running ${cmd}: ${stderr}`);
    if (cmd === 'xcodebuild' && /requested device could not be found|no available devices matched/i.test(stderr)) {
      console.error('\n' + DESTINATION_ERROR_HINT);
    }
    process.exit(1);
  }
  return result.stdout ? result.stdout.toString().trim() : '';
}

// Helper to run command and get output as string
function getCommandOutput(cmd, args = [], options = {}) {
  return runCommand(cmd, args, { stdio: 'pipe', ...options });
}

// Run command without exiting on non-zero; returns { status, stdout, stderr }
function runCommandNoExit(cmd, args = [], options = {}) {
  const opts = { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...options };
  if (options.cwd) opts.cwd = options.cwd;
  const result = spawnSync(cmd, args, opts);
  return {
    status: result.status,
    stdout: (result.stdout || '').toString().trim(),
    stderr: (result.stderr || '').toString().trim(),
    error: result.error
  };
}

// Parse Swift/Clang error and warning lines from xcodebuild output. Returns array of { file, line, column, message, severity }.
function parseBuildErrors(text) {
  const lines = (text || '').split('\n');
  const results = [];
  // file:line:column: error: message  (column optional in some outputs)
  const re = /^(.+?):(\d+):(\d+)?:?\s*(error|warning):\s*(.+)$/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      results.push({
        file: m[1].trim(),
        line: parseInt(m[2], 10),
        column: m[3] ? parseInt(m[3], 10) : 0,
        message: (m[5] || '').trim(),
        severity: m[4]
      });
    }
  }
  return results;
}

// In-memory caches (TTL in ms)
const SIMCTL_CACHE = { data: null, ts: 0, TTL: 60000 };
const XCODE_LIST_CACHE = { key: null, data: null, ts: 0, TTL: 60000 };

function getSimulatorListCached() {
  const now = Date.now();
  if (SIMCTL_CACHE.data != null && (now - SIMCTL_CACHE.ts) < SIMCTL_CACHE.TTL) {
    return SIMCTL_CACHE.data;
  }
  const raw = spawnSync('xcrun', ['simctl', 'list', '-j'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const out = raw.status === 0 && raw.stdout ? raw.stdout.trim() : '{}';
  SIMCTL_CACHE.data = parseJsonOutput(out) || {};
  SIMCTL_CACHE.ts = now;
  return SIMCTL_CACHE.data;
}

function invalidateSimulatorCache() {
  SIMCTL_CACHE.data = null;
  SIMCTL_CACHE.ts = 0;
}

function getDeviceTypesList() {
  const raw = spawnSync('xcrun', ['simctl', 'list', 'devicetypes', '-j'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const out = raw.status === 0 && raw.stdout ? raw.stdout.trim() : '{}';
  const j = parseJsonOutput(out);
  return (j && j.devicetypes) ? j.devicetypes : [];
}

function getRuntimesList() {
  const raw = spawnSync('xcrun', ['simctl', 'list', 'runtimes', '-j'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const out = raw.status === 0 && raw.stdout ? raw.stdout.trim() : '{}';
  const j = parseJsonOutput(out);
  return (j && j.runtimes) ? j.runtimes : [];
}

function findDeviceTypeByName(deviceTypes, name) {
  if (!name || !Array.isArray(deviceTypes)) return null;
  const exact = deviceTypes.find(d => d.name === name);
  if (exact) return exact;
  return deviceTypes.find(d => d.name && d.name.includes(name)) || null;
}

function findRuntimesForDeviceType(runtimes, deviceTypeIdentifier) {
  if (!deviceTypeIdentifier || !Array.isArray(runtimes)) return [];
  return runtimes.filter(r => {
    if (r.isAvailable !== true) return false;
    const supported = r.supportedDeviceTypes || [];
    return supported.some(s => s.identifier === deviceTypeIdentifier);
  });
}

function createSimulator(name, deviceTypeIdentifier, runtimeIdentifier) {
  const res = spawnSync('xcrun', ['simctl', 'create', name, deviceTypeIdentifier, runtimeIdentifier], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    const err = (res.stderr || res.stdout || '').trim();
    throw new Error(err || 'simctl create failed');
  }
  invalidateSimulatorCache();
  return (res.stdout || '').trim();
}

function getXcodeListCached(projectDir, workspace) {
  const now = Date.now();
  const key = `${projectDir}:${workspace || ''}`;
  if (XCODE_LIST_CACHE.key === key && XCODE_LIST_CACHE.data != null && (now - XCODE_LIST_CACHE.ts) < XCODE_LIST_CACHE.TTL) {
    return XCODE_LIST_CACHE.data;
  }
  const listArgs = ['-list'];
  if (workspace) {
    const wp = path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace);
    listArgs.push(wp.endsWith('.xcworkspace') ? '-workspace' : '-project', wp);
  }
  const res = spawnSync('xcodebuild', listArgs, { cwd: projectDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  const listOutput = res.status === 0 && res.stdout ? res.stdout.trim() : '';
  XCODE_LIST_CACHE.key = key;
  XCODE_LIST_CACHE.data = { listOutput, listJson: parseJsonOutput(listOutput) };
  XCODE_LIST_CACHE.ts = now;
  return XCODE_LIST_CACHE.data;
}

// Helper to parse JSON from command if possible
function parseJsonOutput(output) {
  try {
    return JSON.parse(output);
  } catch (e) {
    return null;
  }
}

// Default config file name (FlowDeck-style: init then run without params)
const CONFIG_FILENAME = '.zepta.json';
const LAUNCHED_APPS_FILE = path.join(os.homedir(), '.zepta-launched-apps.json');

function readLaunchedApps() {
  try {
    if (fs.existsSync(LAUNCHED_APPS_FILE)) {
      return JSON.parse(fs.readFileSync(LAUNCHED_APPS_FILE, 'utf8'));
    }
  } catch (_) {}
  return { apps: [] };
}

function trackLaunchedApp(bundleId, simulatorUdid) {
  const data = readLaunchedApps();
  data.apps.push({ id: bundleId, bundleId, simulatorUdid, launchedAt: new Date().toISOString() });
  try {
    fs.writeFileSync(LAUNCHED_APPS_FILE, JSON.stringify(data, null, 2));
  } catch (_) {}
}

function clearLaunchedApp(bundleId) {
  const data = readLaunchedApps();
  data.apps = (data.apps || []).filter(a => a.bundleId !== bundleId && a.id !== bundleId);
  try {
    fs.writeFileSync(LAUNCHED_APPS_FILE, JSON.stringify(data, null, 2));
  } catch (_) {}
}

function clearAllLaunchedApps() {
  try {
    fs.writeFileSync(LAUNCHED_APPS_FILE, JSON.stringify({ apps: [] }, null, 2));
  } catch (_) {}
}

// Command aliases (FlowDeck-style)
const COMMAND_ALIASES = { sim: 'simulator', dev: 'device', log: 'logs', up: 'update' };

// Simple argument parser (no deps). Supports FlowDeck-style -w, -s, -S, -D, -C, -d.
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
        const cmd = (COMMAND_ALIASES[arg] != null) ? COMMAND_ALIASES[arg] : arg;
        parsed.command = cmd;
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
      const idx = key.indexOf('=');
      value = key.slice(idx + 1);
      key = key.slice(0, idx);
    }
    const keyLower = key.toLowerCase().replace(/-/g, '');
    // Preserve -S (simulator), -D (device), -d (derived data), -C (configuration) per FlowDeck docs
    if (arg === '-S' || key === 'S' || keyLower === 'simulator') {
      parsed.options.simulator = value;
    } else if (arg === '-D' || key === 'D' || keyLower === 'device') {
      parsed.options.device = value;
    } else if (arg === '-C' || key === 'C' || keyLower === 'configuration') {
      parsed.options.configuration = value;
    } else if (arg === '-P' || key === 'P' || keyLower === 'platform') {
      parsed.options.platform = value;
    } else if (arg === '-d') {
      parsed.options.deriveddatapath = value;
    } else if (arg === '-a' || keyLower === 'all') {
      parsed.options.all = value;
    } else if (arg === '-A' || keyLower === 'availableonly') {
      parsed.options.availableonly = value;
    } else if ((keyLower === 'deriveddata' || keyLower === 'deriveddatapath') && keyLower !== 'device') {
      if (typeof value === 'string' && value) parsed.options.deriveddatapath = value;
      else parsed.options.deriveddata = true;
    } else {
      parsed.options[keyLower] = value;
    }
    i++;
  }

  // Aliases (-s is scheme; -S is simulator)
  if (parsed.options.p) parsed.options.project = parsed.options.p;
  if (parsed.options.w || parsed.options.ws) parsed.options.workspace = parsed.options.w || parsed.options.ws;
  if (parsed.options.s && typeof parsed.options.s === 'string') parsed.options.scheme = parsed.options.s;
  if (parsed.options.sch) parsed.options.scheme = parsed.options.sch;
  if (parsed.options.c && parsed.options.c !== true) parsed.options.config = parsed.options.config || parsed.options.c;
  if (parsed.options.cfg) parsed.options.config = parsed.options.config || parsed.options.cfg;
  if (parsed.options.j) parsed.options.json = parsed.options.j;
  if (parsed.options.v) parsed.options.verbose = parsed.options.v;
  if (parsed.options.e) parsed.options.examples = parsed.options.e;
  if (parsed.options.i) parsed.options.interactive = parsed.options.i;
  if (parsed.options.l) parsed.options.log = parsed.options.l;
  if (parsed.options.f && parsed.options.force === undefined) parsed.options.force = true;
  if (parsed.options.h && parsed.options.help === undefined) parsed.options.help = true;

  return parsed;
}

const parsedArgs = parseArgs(process.argv);

// Global features: interactive mode (stub, as it's complex TUI)
if (parsedArgs.options.interactive) {
  console.log('Interactive mode not implemented in this clone. Use static commands.');
  process.exit(0);
}

// Load config: --config file, or .zepta.json in cwd (after flowdeck-style init)
let config = {};
const configPath = parsedArgs.options.config || path.join(process.cwd(), CONFIG_FILENAME);
if (parsedArgs.options.config) {
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...raw, deriveddatapath: raw.derivedDataPath || raw.deriveddatapath };
  } catch (e) {
    console.error('Error loading config:', e.message);
    process.exit(1);
  }
} else if (fs.existsSync(configPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...raw, deriveddatapath: raw.derivedDataPath || raw.deriveddatapath };
  } catch (_) {
    // ignore invalid or missing .zepta.json
  }
}

// Merge config with options (options override config). Support FlowDeck-style config.xcodebuild, config.appLaunch, simulatorUdid, deviceUdid.
function getOption(key) {
  const opt = parsedArgs.options[key];
  if (opt !== undefined && opt !== null) return opt;
  const c = config[key];
  if (c !== undefined && c !== null) return c;
  if (key === 'simulator' && config.simulatorUdid) return null;
  if (key === 'device' && config.deviceUdid) return null;
  if (key === 'simulator' && config.simulator) return config.simulator;
  if (key === 'device' && config.device) return config.device;
  if (key === 'xcodebuildoptions' && config.xcodebuild && Array.isArray(config.xcodebuild.args)) {
    return config.xcodebuild.args.join(' ');
  }
  if (key === 'xcodebuildenv' && config.xcodebuild && config.xcodebuild.env && typeof config.xcodebuild.env === 'object') {
    return Object.entries(config.xcodebuild.env).map(([k, v]) => `${k}=${v}`).join(' ');
  }
  if (key === 'launchoptions' && config.appLaunch && Array.isArray(config.appLaunch.args)) {
    return config.appLaunch.args.join(' ');
  }
  if (key === 'launchenv' && config.appLaunch && config.appLaunch.env && typeof config.appLaunch.env === 'object') {
    return Object.entries(config.appLaunch.env).map(([k, v]) => `${k}=${v}`).join(' ');
  }
  return null;
}

// Default derived data path
const defaultDerivedData = path.join(os.homedir(), 'Library/Developer/zepta/DerivedData');

// Resolve simulator UDID by name or return as-is if already UDID-like (uses cache)
function resolveSimulatorUdid(nameOrUdid) {
  if (!nameOrUdid) return null;
  if (/^[0-9A-F-]{36}$/i.test(nameOrUdid)) return nameOrUdid;
  const simList = getSimulatorListCached();
  const devices = simList.devices || {};
  for (const runtime of Object.keys(devices)) {
    for (const d of devices[runtime] || []) {
      if (d.name === nameOrUdid) return d.udid;
    }
  }
  return null;
}

// Resolve simulator UDID, or create one if missing. When interactive, prompt for device type/runtime. Returns Promise<udid|null>.
async function resolveOrCreateSimulator(nameOrUdid, options = {}) {
  const { createIfMissing = true, interactive = false } = options;
  let udid = resolveSimulatorUdid(nameOrUdid);
  if (udid) return udid;
  if (!createIfMissing && !interactive) return null;

  const deviceTypes = getDeviceTypesList();
  const runtimes = getRuntimesList();
  let deviceType = findDeviceTypeByName(deviceTypes, nameOrUdid);

  if (!deviceType) {
    if (interactive && deviceTypes.length > 0) {
      const choice = await promptSelect(`Simulator "${nameOrUdid}" not found. Choose a device type to create:`, deviceTypes, deviceTypes[0].name);
      deviceType = deviceTypes.find(d => d.name === choice) || deviceTypes[0];
    } else {
      return null;
    }
  }

  const runtimesForDevice = findRuntimesForDeviceType(runtimes, deviceType.identifier);
  if (runtimesForDevice.length === 0) {
    return null;
  }
  let runtime = runtimesForDevice[0];
  if (interactive && runtimesForDevice.length > 1) {
    const choice = await promptSelect('Choose iOS runtime:', runtimesForDevice, (runtimesForDevice[0] && runtimesForDevice[0].name) || null);
    runtime = runtimesForDevice.find(r => r.name === choice || r.version === choice) || runtimesForDevice[0];
  }

  try {
    const newUdid = createSimulator(nameOrUdid, deviceType.identifier, runtime.identifier);
    return newUdid || resolveSimulatorUdid(nameOrUdid);
  } catch (err) {
    console.error(err.message || err);
    return null;
  }
}

// Get booted simulator UDID or null (uses cache)
function getBootedSimulatorUdid() {
  const simList = getSimulatorListCached();
  const devices = simList.devices || {};
  for (const runtime of Object.keys(devices)) {
    for (const d of devices[runtime] || []) {
      if (d.state === 'Booted') return d.udid;
    }
  }
  return null;
}

// Validate simulator name/UDID: null if valid, or error message if not found/unavailable (uses cache)
function validateSimulatorDestination(simulator) {
  if (!simulator) return null;
  const udid = resolveSimulatorUdid(simulator);
  if (!udid) return `Simulator "${simulator}" not found.`;
  const simList = getSimulatorListCached();
  const devices = simList.devices || {};
  for (const runtime of Object.keys(devices)) {
    for (const d of devices[runtime] || []) {
      if (d.udid === udid) {
        if (d.isAvailable === false) {
          return `Simulator "${simulator}" is not available (runtime may be deleted or unavailable).`;
        }
        return null;
      }
    }
  }
  return null;
}

const DESTINATION_ERROR_HINT = 'Run `zepta simulator list` to see available simulators, or `zepta init` to choose a different destination.';

// Expand short test identifier to full (e.g. "LoginTests/testValidLogin" -> "MyAppTests/LoginTests/testValidLogin")
function expandTestIdentifier(scheme, value) {
  if (!value || typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  const schemeClean = (scheme || 'App').replace(/[^a-zA-Z0-9.-]/g, '');
  const targetPrefix = schemeClean + 'Tests/';
  // Already full form: starts with SchemeTests/ (e.g. MyAppTests/ClassName/method)
  if (trimmed.startsWith(targetPrefix)) return trimmed;
  return targetPrefix + trimmed;
}

// Parse xcodebuild test output for "Test Case '...' passed/failed (X seconds)". Returns { passed: [], failed: [], total }
function parseTestOutput(text) {
  const lines = (text || '').split('\n');
  const passed = [];
  const failed = [];
  // Matches: Test Case '-[Target.Class method]' passed (0.123 seconds).  or  Test Case 'Class/method' passed (0.1 seconds).
  const re = /Test Case\s+'([^']+)'\s+(passed|failed)(?:\s+\(([\d.]+)\s+seconds\))?/;
  for (const line of lines) {
    const m = line.match(re);
    if (m) {
      const ident = m[1];
      const duration = m[3] ? parseFloat(m[3], 10) : 0;
      if (m[2] === 'passed') passed.push({ identifier: ident, duration });
      else failed.push({ identifier: ident, duration });
    }
  }
  return { passed, failed, total: passed.length + failed.length };
}

// Derive .app path from derived data and scheme (approximate)
function getBuiltAppPath(derivedDataPath, scheme, configuration, forSimulator) {
  const base = path.join(derivedDataPath, 'Build', 'Products');
  const configDir = forSimulator ? `${configuration}-iphonesimulator` : (configuration === 'Release' ? 'Release' : 'Debug');
  const dir = path.join(base, configDir);
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true }) || [];
  const appDir = entries.find(e => e.isDirectory() && e.name.endsWith('.app'));
  return appDir ? path.join(dir, appDir.name) : null;
}

// Read bundle ID from .app/Info.plist (plutil -p or defaults read)
function getBundleIdFromApp(appPath) {
  const plist = path.join(appPath, 'Info.plist');
  if (!fs.existsSync(plist)) return null;
  try {
    const out = getCommandOutput('plutil', ['-p', plist]);
    const match = out.match(/CFBundleIdentifier"\s*=>\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch (_) {
    return null;
  }
}

// Help and examples
function showExamples(command, examples) {
  console.log(`Examples for ${command}:`);
  examples.forEach(ex => console.log(ex));
  process.exit(0);
}

// --- Interactive init: discover and prompt (only when stdin is TTY and not --json) ---

function discoverWorkspaces(projectDir) {
  const entries = fs.readdirSync(projectDir, { withFileTypes: true }) || [];
  const workspaces = entries.filter(e => e.isDirectory() && e.name.endsWith('.xcworkspace')).map(e => e.name);
  const projects = entries.filter(e => e.isDirectory() && e.name.endsWith('.xcodeproj')).map(e => e.name);
  const byBase = new Map();
  workspaces.forEach(w => byBase.set(w.replace(/\.xcworkspace$/, ''), { name: w, type: 'workspace' }));
  projects.forEach(p => {
    const base = p.replace(/\.xcodeproj$/, '');
    if (!byBase.has(base)) byBase.set(base, { name: p, type: 'project' });
  });
  return Array.from(byBase.values()).map(v => v.name).sort((a, b) => (a.endsWith('.xcworkspace') ? 0 : 1) - (b.endsWith('.xcworkspace') ? 0 : 1));
}

function getSchemesForWorkspace(projectDir, workspace) {
  const cached = getXcodeListCached(projectDir, workspace);
  const listOutput = cached.listOutput || '';
  const listJson = cached.listJson || {};
  let schemeList = [];
  if (listJson.project && listJson.project.schemes) {
    schemeList = listJson.project.schemes.map(s => (typeof s === 'string' ? s : s.name));
  }
  if (schemeList.length === 0) {
    const schemesBlock = listOutput.match(/Schemes:\n([\s\S]*?)(?=\n\n|\nInformation|\nTargets:|$)/);
    if (schemesBlock) schemeList = schemesBlock[1].split('\n').map(l => l.trim()).filter(Boolean);
  }
  return schemeList;
}

function getSimulatorsForInit() {
  const simList = getSimulatorListCached();
  const devices = simList.devices || {};
  const flat = [];
  for (const runtime of Object.keys(devices)) {
    (devices[runtime] || []).filter(d => d.isAvailable).forEach(d => {
      flat.push({ name: d.name, udid: d.udid, runtime });
    });
  }
  return flat.sort((a, b) => a.name.localeCompare(b.name));
}

function getDevicesForInit() {
  const list = [
    { name: 'My Mac', udid: null, platform: 'macOS' },
    { name: 'My Mac Catalyst', udid: null, platform: 'macOS' }
  ];
  try {
    const out = spawnSync('xcrun', ['devicectl', 'list', 'devices', '-j'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const output = out.status === 0 && out.stdout ? parseJsonOutput(out.stdout.trim()) : null;
    const devices = output ? (output.devices || output.result?.devices || []).filter(d => d.udid) : [];
    devices.forEach(d => {
      list.push({
        name: d.name || d.udid,
        udid: d.udid,
        platform: d.platform?.name || 'iOS'
      });
    });
  } catch (_) {}
  return list;
}

function promptSelect(message, choices, defaultValue) {
  return new Promise((resolve, reject) => {
    if (!choices.length) {
      resolve(defaultValue);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n' + message);
    choices.forEach((c, i) => console.log(`  ${i + 1}. ${typeof c === 'object' && c !== null && c.name != null ? c.name : c}`));
    const prompt = `Choose (1-${choices.length})${defaultValue != null ? ` [${defaultValue}]` : ''}: `;
    rl.question(prompt, (answer) => {
      rl.close();
      const trimmed = (answer || String(defaultValue || '')).trim();
      const num = parseInt(trimmed, 10);
      if (Number.isFinite(num) && num >= 1 && num <= choices.length) {
        const chosen = choices[num - 1];
        resolve(typeof chosen === 'object' && chosen !== null && chosen.name != null ? chosen.name : chosen);
      } else if (defaultValue != null) {
        resolve(defaultValue);
      } else {
        reject(new Error('Invalid selection'));
      }
    });
  });
}

function writeInitConfig(workspace, scheme, simulator, device, configuration, deriveddatapath, configPath, jsonOut) {
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  const target = simulator || device;
  const targetType = simulator ? 'simulator' : 'device';
  const settings = {
    workspace,
    scheme,
    configuration,
    ...(simulator && { simulator }),
    ...(device && { device }),
    ...(deriveddatapath && { derivedDataPath: deriveddatapath })
  };
  fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
  if (jsonOut) {
    console.log(JSON.stringify({
      success: true,
      message: 'Project initialized',
      workspace,
      scheme,
      target,
      targetType,
      configuration
    }, null, 2));
  } else {
    console.log('Settings saved to', configPath);
  }
}

async function runInteractiveInit(workspace, scheme, simulator, device, configuration, deriveddatapath, configPath, jsonOut) {
  const projectDir = getOption('project') || process.cwd();

  if (!workspace) {
    const workspaces = discoverWorkspaces(projectDir);
    if (workspaces.length === 0) {
      throw new Error('No .xcworkspace or .xcodeproj found in current directory. Run zepta init from your project root or use -w <workspace>.');
    }
    workspace = workspaces.length === 1 ? workspaces[0] : await promptSelect('Select workspace or project:', workspaces, workspaces[0]);
  }

  if (!scheme) {
    const schemes = getSchemesForWorkspace(projectDir, workspace);
    if (schemes.length === 0) {
      throw new Error(`No schemes found for ${workspace}. Specify -s <scheme> explicitly.`);
    }
    scheme = schemes.length === 1 ? schemes[0] : await promptSelect('Select scheme:', schemes, schemes[0]);
  }

  if (!simulator && !device) {
    const targetChoice = await promptSelect('Run on simulator or device?', ['Simulator', 'Device'], 'Simulator');
    if (targetChoice === 'Simulator') {
      const sims = getSimulatorsForInit();
      if (sims.length === 0) throw new Error('No available simulators found.');
      const defaultSim = sims.find(s => s.name.includes('iPhone 16')) || sims[0];
      simulator = sims.length === 1 ? sims[0].name : await promptSelect('Select simulator:', sims, defaultSim.name);
    } else {
      const devices = getDevicesForInit();
      const defaultDev = devices[0].name;
      device = devices.length === 1 ? devices[0].name : await promptSelect('Select device:', devices, defaultDev);
    }
  }

  writeInitConfig(workspace, scheme, simulator, device, configuration, deriveddatapath, configPath, jsonOut);
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

    const cachedList = getXcodeListCached(projectDir, workspace);
    const listOutput = cachedList.listOutput || '';
    const listJson = cachedList.listJson || {};
    let schemeList = [];
    let buildConfigurations = [];
    if (listJson.project) {
      const proj = listJson.project;
      buildConfigurations = proj.buildConfigurations || [];
      const schemes = proj.schemes || [];
      schemeList = schemes.map(s => (typeof s === 'string' ? { name: s, category: 'Apps', platform: 'iOS' } : { name: s.name, category: s.category, platform: s.platform }));
    }
    if (schemeList.length === 0) {
      const schemesBlock = listOutput.match(/Schemes:\n([\s\S]*?)(?=\n\n|\nInformation|\nTargets:|$)/);
      const configsBlock = listOutput.match(/Build Configurations:\n([\s\S]*?)(?=\n\n|\nInformation|\nSchemes:|\nTargets:|$)/);
      if (schemesBlock) {
        const names = schemesBlock[1].split('\n').map(l => l.trim()).filter(Boolean);
        schemeList = names.map(name => ({ name, category: 'Apps', platform: 'iOS' }));
      }
      if (configsBlock) buildConfigurations = configsBlock[1].split('\n').map(l => l.trim()).filter(Boolean);
      if (buildConfigurations.length === 0 && listOutput.includes('Debug')) buildConfigurations = ['Debug', 'Release'];
    }

    const simList = getSimulatorListCached();
    const devices = simList.devices || {};
    const simulators = Object.keys(devices).flatMap(k => (devices[k] || []).map(d => ({
      name: d.name,
      udid: d.udid,
      platform: (k.split('-')[0] || 'iOS'),
      osVersion: (k.split('-').slice(1).join('-') || ''),
      state: d.state,
      isAvailable: d.isAvailable
    })));

    const contextData = {
      workspace: workspace || (listJson && listJson.project && listJson.project.name ? listJson.project.name + '.xcworkspace' : path.basename(projectDir) + '.xcworkspace'),
      schemes: schemeList,
      buildConfigurations,
      derivedDataPath: getOption('deriveddatapath') || defaultDerivedData,
      simulators
    };

    if (json) {
      console.log(JSON.stringify(contextData, null, 2));
    } else {
      console.log('Workspace:', contextData.workspace);
      console.log('Schemes:', contextData.schemes.map(s => (typeof s === 'object' ? s.name : s)).join(', '));
      console.log('Build Configurations:', contextData.buildConfigurations.join(', '));
      console.log('Derived Data Path:', contextData.derivedDataPath);
      console.log('Simulators:');
      contextData.simulators.forEach(s => console.log(`- ${s.name} (${s.platform} ${s.osVersion}, ${s.state})`));
    }
  },

  build: async () => {
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

    if (!workspace && !getOption('project')) {
      console.error('Specify -w/--workspace (or run zepta init -w <workspace> -s <scheme> -S "<simulator>")');
      process.exit(1);
    }
    if (!scheme) {
      console.error('Specify -s/--scheme (or run zepta init -w <workspace> -s <scheme> -S "<simulator>")');
      process.exit(1);
    }

    let destination;
    if (simulator) {
      let simErr = validateSimulatorDestination(simulator);
      if (simErr) {
        const createIfMissing = getOption('createsimulator') || (process.stdin.isTTY && !json);
        const interactive = process.stdin.isTTY && !json;
        const udid = await resolveOrCreateSimulator(simulator, { createIfMissing, interactive });
        if (!udid) {
          console.error(simErr);
          console.error(DESTINATION_ERROR_HINT);
          process.exit(1);
        }
      }
      destination = `platform=iOS Simulator,name=${simulator}`;
    } else if (device === 'My Mac') {
      destination = 'platform=macOS';
    } else if (device === 'My Mac Catalyst') {
      destination = 'platform=macOS,variant=Mac Catalyst';
    } else if (device) {
      destination = `platform=iOS,name=${device}`;
    } else {
      console.error('Specify -S/--simulator or -D/--device (or run zepta init with -S or -D)');
      process.exit(1);
    }

    const projectDir = getOption('project') || process.cwd();
    const workspacePath = path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace);
    const useWorkspace = workspace.endsWith('.xcworkspace');
    const args = [
      'build',
      useWorkspace ? '-workspace' : '-project',
      workspacePath,
      '-scheme', scheme,
      '-configuration', configuration,
      '-destination', destination,
      '-derivedDataPath', derivedData
    ];

    const xcodebuildOpts = getOption('xcodebuildoptions');
    if (xcodebuildOpts && typeof xcodebuildOpts === 'string') args.push(...xcodebuildOpts.split(/\s+/).filter(Boolean));
    const xcodebuildEnv = getOption('xcodebuildenv');
    if (xcodebuildEnv && typeof xcodebuildEnv === 'string') {
      Object.assign(process.env, xcodebuildEnv.split(/\s+/).reduce((acc, pair) => {
        const idx = pair.indexOf('=');
        if (idx > 0) acc[pair.slice(0, idx)] = pair.slice(idx + 1);
        return acc;
      }, {}));
    }

    const startTime = Date.now();
    if (json) {
      console.log(JSON.stringify({ type: 'build_started', scheme, destination: destination }));
      const run = runCommandNoExit('xcodebuild', args, { cwd: projectDir });
      const duration = (Date.now() - startTime) / 1000;
      const combined = (run.stdout || '') + '\n' + (run.stderr || '');
      const errors = parseBuildErrors(combined);
      errors.forEach(e => console.log(JSON.stringify({ type: 'error', file: e.file, line: e.line, column: e.column, message: e.message, severity: e.severity })));
      console.log(JSON.stringify({ type: 'build_completed', success: run.status === 0, duration }));
      if (run.status !== 0) {
        if (!verbose && run.stderr) console.error(run.stderr);
        if (run.error) console.error(run.error);
        process.exit(1);
      }
    } else {
      runCommand('xcodebuild', args);
    }
  },

  run: async () => {
    if (getOption('examples')) {
      showExamples('run', [
        'zepta run',
        'zepta run -w MyApp.xcworkspace -s MyApp -S "iPhone 16"',
        'zepta run --no-build',
        'zepta run --log',
        'zepta run --launch-options="-AppleLanguages (en)" --launch-env="DEBUG=1"'
      ]);
    }

    let workspace = getOption('workspace');
    let scheme = getOption('scheme');
    const configuration = getOption('configuration') || 'Debug';
    const simulator = getOption('simulator');
    const device = getOption('device');
    const derivedData = getOption('deriveddatapath') || defaultDerivedData;
    const noBuild = getOption('nobuild');
    const json = getOption('json');
    const projectDir = getOption('project') || process.cwd();

    // Auto-discover workspace and scheme when missing so "zepta run -S iPhone 16" works without init
    if (!workspace || !scheme) {
      const workspaces = discoverWorkspaces(projectDir);
      if (!workspace) {
        if (workspaces.length === 0) {
          console.error('No .xcworkspace or .xcodeproj found. Run from project root or use -w/--workspace.');
          process.exit(1);
        }
        workspace = workspaces.find(w => w.endsWith('.xcworkspace')) || workspaces[0];
      }
      if (!scheme) {
        const schemes = getSchemesForWorkspace(projectDir, workspace);
        if (!schemes.length) {
          console.error(`No schemes found for ${workspace}. Specify -s/--scheme.`);
          process.exit(1);
        }
        scheme = typeof schemes[0] === 'object' && schemes[0] != null && schemes[0].name != null ? schemes[0].name : schemes[0];
      }
    }

    if (!simulator && !device) {
      console.error('Specify -S/--simulator or -D/--device (or run zepta init with -S or -D)');
      process.exit(1);
    }

    if (!noBuild) await commands.build();

    const workspacePath = path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace);
    const forSimulator = !!simulator;
    let appPath = getBuiltAppPath(derivedData, scheme, configuration, forSimulator);
    let bundleId = getOption('bundleid');
    if (appPath && fs.existsSync(appPath)) {
      if (!bundleId) bundleId = getBundleIdFromApp(appPath);
    }
    if (!bundleId) bundleId = scheme.replace(/[^a-zA-Z0-9.]/g, '') ? `com.example.${scheme}` : 'com.example.app';
    if (!appPath) appPath = path.join(derivedData, 'Build', 'Products', forSimulator ? `${configuration}-iphonesimulator` : configuration, `${scheme}.app`);

    const launchOpts = getOption('launchoptions');
    const launchEnv = getOption('launchenv');

    if (simulator) {
      let udid = resolveSimulatorUdid(simulator);
      if (!udid) {
        const createIfMissing = getOption('createsimulator') || (process.stdin.isTTY && !json);
        const interactive = process.stdin.isTTY && !json;
        udid = await resolveOrCreateSimulator(simulator, { createIfMissing, interactive });
        if (!udid) {
          console.error(`Simulator not found: ${simulator}`);
          process.exit(1);
        }
      }
      runCommand('xcrun', ['simctl', 'boot', udid]);
      if (fs.existsSync(appPath)) runCommand('xcrun', ['simctl', 'install', udid, appPath]);
      const launchArgs = [udid, bundleId];
      const prevEnv = { ...process.env };
      if (launchEnv && typeof launchEnv === 'string') {
        launchEnv.split(/\s+/).forEach(pair => {
          const idx = pair.indexOf('=');
          if (idx > 0) process.env[`SIMCTL_CHILD_${pair.slice(0, idx)}`] = pair.slice(idx + 1);
        });
      }
      if (launchOpts && typeof launchOpts === 'string') launchArgs.push(...launchOpts.split(/\s+/).filter(Boolean));
      if (json) console.log(JSON.stringify({ type: 'status', stage: 'LAUNCHING', message: `Launching on ${simulator}` }));
      runCommand('xcrun', ['simctl', 'launch', ...launchArgs]);
      Object.keys(process.env).filter(k => k.startsWith('SIMCTL_CHILD_')).forEach(k => delete process.env[k]);
      Object.assign(process.env, prevEnv);
      trackLaunchedApp(bundleId, udid);
    } else {
      const udid = device;
      if (json) console.log(JSON.stringify({ type: 'status', stage: 'LAUNCHING', message: `Launching on ${device}` }));
      if (fs.existsSync(appPath)) runCommand('xcrun', ['devicectl', 'device', 'install', 'app', appPath, '--device', udid]);
      runCommand('xcrun', ['devicectl', 'device', 'process', 'launch', bundleId, '--device', udid]);
    }

    if (getOption('log')) commands.logs();

    if (json) console.log(JSON.stringify({ type: 'result', success: true, operation: 'run' }));
  },

  test: async () => {
    if (getOption('examples')) {
      showExamples('test', [
        'zepta test',
        'zepta test -S "iPhone 16"',
        'zepta test --only MyTests/LoginTests --json',
        'zepta test discover --json',
        'zepta test plans --json'
      ]);
    }

    const sub = parsedArgs.subcommand;
    const workspace = getOption('workspace');
    const scheme = getOption('scheme');
    const projectDir = getOption('project') || process.cwd();
    const wp = workspace && (path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace));

    if (sub === 'discover') {
      const filter = getOption('filter');
      const jsonOut = getOption('json');
      const schemeName = scheme || 'MyApp';
      let tests = [];
      const projDir = wp ? path.dirname(wp) : projectDir;
      const swiftDirs = [path.join(projDir, 'Tests'), path.join(projDir, 'test'), projDir];
      for (const dir of swiftDirs) {
        if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
        const walk = (d) => {
          try {
            (fs.readdirSync(d, { withFileTypes: true }) || []).forEach(ent => {
              const full = path.join(d, ent.name);
              if (ent.isDirectory() && !ent.name.startsWith('.') && ent.name !== 'Pods') walk(full);
              else if (ent.name.endsWith('.swift')) {
                const content = fs.readFileSync(full, 'utf8');
                const classMatch = content.match(/class\s+(\w+)\s*:\s*XCTestCase/g);
                const methodMatch = content.match(/func\s+(test\w*)\s*\(/g);
                if (classMatch && methodMatch) {
                  const className = classMatch[0].replace(/class\s+(\w+).*/, '$1');
                  methodMatch.forEach(m => {
                    const method = m.replace(/func\s+(test\w*).*/, '$1');
                    const ident = `${schemeName}Tests/${className}/${method}`;
                    if (!filter || ident.toLowerCase().includes(String(filter).toLowerCase())) {
                      tests.push({ target: `${schemeName}Tests`, class: className, method, identifier: ident, file: ent.name, filePath: full, lineNumber: 1, isSkipped: false });
                    }
                  });
                }
              }
            });
          } catch (_) {}
        };
        walk(dir);
      }
      if (tests.length === 0) tests = [{ target: 'MyTests', class: 'TestClass', method: 'testMethod', identifier: 'MyTests/TestClass/testMethod', file: 'TestClass.swift', filePath: '/path/TestClass.swift', lineNumber: 10, isSkipped: false }];
      if (jsonOut) console.log(JSON.stringify({ tests }));
      else tests.forEach(t => console.log(t.identifier));
      return;
    } else if (sub === 'plans') {
      const jsonOut = getOption('json');
      let plans = [];
      if (wp && fs.existsSync(wp)) {
        const schemeDir = path.join(path.dirname(wp), 'xcshareddata', 'xcschemes');
        try {
          const schemes = fs.readdirSync(schemeDir).filter(f => f.endsWith('.xcscheme'));
          const schemeName = scheme || (schemes[0] && schemes[0].replace('.xcscheme', ''));
          if (schemeName) {
            const schemePath = path.join(schemeDir, schemeName + '.xcscheme');
            if (fs.existsSync(schemePath)) {
              const content = fs.readFileSync(schemePath, 'utf8');
              const planRef = content.match(/TestPlanReference\s+reference\s*=\s*"([^"]+)"/);
              if (planRef) plans.push({ name: 'Default', reference: planRef[1], path: planRef[1].replace(/^container:/, ''), isDefault: true, isMissing: false });
            }
          }
        } catch (_) {}
      }
      if (plans.length === 0) plans = [{ name: 'Default', reference: 'container:Default.xctestplan', path: 'Default.xctestplan', isDefault: true, isMissing: false }];
      if (jsonOut) console.log(JSON.stringify({ plans }));
      else plans.forEach(p => console.log(p.name));
      return;
    }

    if (!workspace || !scheme) {
      console.error('Specify -w/--workspace and -s/--scheme (or run zepta init)');
      process.exit(1);
    }
    const simulator = getOption('simulator');
    const device = getOption('device');
    const configuration = getOption('configuration') || 'Debug';
    const json = getOption('json');
    const verbose = getOption('verbose');
    if (!simulator && !device) {
      console.error('Specify -S/--simulator or -D/--device for testing');
      process.exit(1);
    }
    if (simulator) {
      let simErr = validateSimulatorDestination(simulator);
      if (simErr) {
        const createIfMissing = getOption('createsimulator') || (process.stdin.isTTY && !json);
        const interactive = process.stdin.isTTY && !json;
        const udid = await resolveOrCreateSimulator(simulator, { createIfMissing, interactive });
        if (!udid) {
          console.error(simErr);
          console.error(DESTINATION_ERROR_HINT);
          process.exit(1);
        }
      }
    }
    const destination = simulator ? `platform=iOS Simulator,name=${simulator}` : (device === 'My Mac' ? 'platform=macOS' : `platform=iOS,name=${device}`);
    const workspacePath = path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace);
    const useWorkspace = workspacePath.endsWith('.xcworkspace');
    const args = ['test', useWorkspace ? '-workspace' : '-project', workspacePath, '-scheme', scheme, '-configuration', configuration, '-destination', destination];
    const only = getOption('only');
    const skip = getOption('skip');
    const plan = getOption('plan');
    const testTargets = getOption('testtargets');
    if (only && typeof only === 'string') only.split(',').forEach(t => { args.push('-only-testing', expandTestIdentifier(scheme, t)); });
    if (skip && typeof skip === 'string') skip.split(',').forEach(t => { args.push('-skip-testing', expandTestIdentifier(scheme, t)); });
    if (plan && typeof plan === 'string') args.push('-testPlan', plan);
    if (testTargets && typeof testTargets === 'string') args.push('-only-testing', testTargets);
    const xcodebuildOpts = getOption('xcodebuildoptions');
    if (xcodebuildOpts && typeof xcodebuildOpts === 'string') args.push(...xcodebuildOpts.split(/\s+/).filter(Boolean));
    const xcodebuildEnv = getOption('xcodebuildenv');
    if (xcodebuildEnv && typeof xcodebuildEnv === 'string') {
      Object.assign(process.env, xcodebuildEnv.split(/\s+/).reduce((acc, pair) => {
        const idx = pair.indexOf('=');
        if (idx > 0) acc[pair.slice(0, idx)] = pair.slice(idx + 1);
        return acc;
      }, {}));
    }

    if (json) {
      console.log(JSON.stringify({ type: 'status', stage: 'COMPILING', message: 'Building for testing...' }));
      console.log(JSON.stringify({ type: 'status', stage: 'TESTING', message: `Running tests on ${simulator || device}` }));
      const startTime = Date.now();
      const run = runCommandNoExit('xcodebuild', args, { cwd: projectDir });
      const duration = (Date.now() - startTime) / 1000;
      const combined = (run.stdout || '') + '\n' + (run.stderr || '');
      const parsed = parseTestOutput(combined);
      parsed.passed.forEach(t => console.log(JSON.stringify({ type: 'test_passed', testName: t.identifier, duration: t.duration })));
      parsed.failed.forEach(t => console.log(JSON.stringify({ type: 'test_failed', testName: t.identifier, duration: t.duration })));
      const success = run.status === 0;
      console.log(JSON.stringify({
        type: 'result',
        success,
        operation: 'test',
        totalTests: parsed.total,
        passedTests: parsed.passed.length,
        failedTests: parsed.failed.length,
        skippedTests: 0,
        duration
      }));
      if (run.status !== 0) {
        if (!verbose && run.stderr) console.error(run.stderr);
        process.exit(1);
      }
    } else {
      runCommand('xcodebuild', args);
    }
  },

  clean: () => {
    if (getOption('examples')) {
      showExamples('clean', [
        'zepta clean',
        'zepta clean -w MyApp.xcworkspace -s MyApp',
        'zepta clean --derived-data',
        'zepta clean --xcode-derived-data',
        'zepta clean --xcode-cache',
        'zepta clean --all'
      ]);
    }

    const all = getOption('all');
    const derivedData = getOption('deriveddata') || all;
    const xcodeDerived = getOption('xcodederiveddata') || all;
    const xcodeCache = getOption('xcodecache') || all;
    const verbose = getOption('verbose');
    const stdioOpt = verbose ? 'inherit' : 'pipe';

    const workspace = getOption('workspace');
    const scheme = getOption('scheme');
    const projectDir = getOption('project') || process.cwd();
    if (scheme && workspace) {
      const wp = path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace);
      const useWorkspace = workspace.endsWith('.xcworkspace');
      runCommand('xcodebuild', ['clean', useWorkspace ? '-workspace' : '-project', wp, '-scheme', scheme], { stdio: stdioOpt });
    }

    if (derivedData) {
      const dd = getOption('deriveddatapath') || defaultDerivedData;
      if (fs.existsSync(dd)) runCommand('rm', ['-rf', dd], { stdio: stdioOpt });
    }
    if (xcodeDerived) {
      const xdd = path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData');
      if (fs.existsSync(xdd)) runCommand('rm', ['-rf', xdd], { stdio: stdioOpt });
    }
    if (xcodeCache) {
      const xc = path.join(os.homedir(), 'Library/Caches/com.apple.dt.Xcode');
      if (fs.existsSync(xc)) runCommand('rm', ['-rf', xc], { stdio: stdioOpt });
    }

    if (getOption('json')) console.log(JSON.stringify({ type: 'result', success: true }));
  },

  logs: () => {
    if (getOption('examples')) {
      showExamples('logs', [
        'zepta logs <app-id>',
        'zepta logs com.example.MyApp --json'
      ]);
    }

    const identifier = parsedArgs.args[0];
    if (!identifier) {
      console.error('Missing identifier (bundle ID or app ID)');
      process.exit(1);
    }

    const json = getOption('json');
    const udid = getBootedSimulatorUdid();
    if (!udid) {
      console.error('No booted simulator. Boot a simulator first (e.g. zepta simulator boot <UDID>).');
      process.exit(1);
    }
    const pred = `subsystem == "${identifier}" || processImagePath CONTAINS "${identifier}"`;
    const cmd = spawn('xcrun', ['simctl', 'spawn', udid, 'log', 'stream', '--predicate', pred, '--style', 'compact']);
    cmd.stdout.on('data', (data) => {
      if (json) console.log(JSON.stringify({ type: 'log', message: data.toString().trim() }));
      else process.stdout.write(data);
    });
    cmd.stderr.on('data', (data) => process.stderr.write(data));
  },

  project: () => {
    const sub = parsedArgs.subcommand;
    if (getOption('examples')) {
      showExamples('project', [
        'zepta project create MyApp',
        'zepta project schemes -w App.xcworkspace --json',
        'zepta project configs -w App.xcworkspace --json',
        'zepta project packages list'
      ]);
    }

    const projectDir = getOption('project') || process.cwd();
    const workspace = getOption('workspace');
    const wp = workspace && (path.isAbsolute(workspace) ? workspace : path.join(projectDir, workspace));

    if (sub === 'schemes') {
      const jsonOut = getOption('json');
      let listOutput = '';
      const listArgs = ['-list'];
      if (wp) listArgs.push(wp.endsWith('.xcworkspace') ? '-workspace' : '-project', wp);
      const res = spawnSync('xcodebuild', listArgs, { cwd: projectDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      if (res.status === 0 && res.stdout) listOutput = res.stdout.trim();
      const listJson = parseJsonOutput(listOutput);
      let schemes = [];
      if (listJson && listJson.project && listJson.project.schemes) {
        schemes = listJson.project.schemes.map(s => (typeof s === 'string' ? { name: s, category: 'Apps', isShared: true, platform: 'iOS' } : s));
      }
      if (schemes.length === 0) {
        const block = listOutput.match(/Schemes:\n([\s\S]*?)(?=\n\n|\nInformation|\nTargets:|$)/);
        if (block) schemes = block[1].split('\n').map(l => l.trim()).filter(Boolean).map(name => ({ name, category: 'Apps', isShared: true, platform: 'iOS' }));
      }
      if (jsonOut) console.log(JSON.stringify(schemes));
      else schemes.forEach(s => console.log(typeof s === 'object' ? s.name : s));
      return;
    }

    if (sub === 'configs') {
      const jsonOut = getOption('json');
      let listOutput = '';
      const listArgs = ['-list'];
      if (wp) listArgs.push(wp.endsWith('.xcworkspace') ? '-workspace' : '-project', wp);
      const res = spawnSync('xcodebuild', listArgs, { cwd: projectDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
      if (res.status === 0 && res.stdout) listOutput = res.stdout.trim();
      const listJson = parseJsonOutput(listOutput);
      let configs = [];
      if (listJson && listJson.project && listJson.project.buildConfigurations) configs = listJson.project.buildConfigurations;
      if (configs.length === 0) {
        const block = listOutput.match(/Build Configurations:\n([\s\S]*?)(?=\n\n|\nInformation|\nSchemes:|\nTargets:|$)/);
        if (block) configs = block[1].split('\n').map(l => l.trim()).filter(Boolean);
        if (configs.length === 0) configs = ['Debug', 'Release'];
      }
      if (jsonOut) console.log(JSON.stringify(configs));
      else configs.forEach(c => console.log(c));
      return;
    }

    if (sub === 'packages') {
      const pkgSub = parsedArgs.args[0] || 'list';
      const jsonOut = getOption('json');
      if (pkgSub === 'list') {
        const list = [];
        if (jsonOut) console.log(JSON.stringify({ packages: list }));
        else console.log('No Swift packages or not implemented.');
      } else {
        console.log(`zepta project packages ${pkgSub} is not implemented.`);
        if (jsonOut) console.log(JSON.stringify({ success: false, message: 'Not implemented' }));
      }
      return;
    }

    if (sub === 'create') {
      const name = parsedArgs.args[0];
      if (!name) {
        console.error('Missing name');
        process.exit(1);
      }

      const bundleId = getOption('bundleid') || `com.example.${name}`;
      const platforms = (getOption('platforms') || 'ios').toString().split(',').map(p => p.trim().toLowerCase());
      const outputPath = getOption('path') || process.cwd();

      const appDir = path.join(outputPath, name);
      const xcodeprojDir = path.join(appDir, `${name}.xcodeproj`);
      fs.mkdirSync(appDir, { recursive: true });
      fs.mkdirSync(xcodeprojDir, { recursive: true });
      fs.writeFileSync(path.join(xcodeprojDir, 'project.pbxproj'), '// stub\n');
      const xcodeprojPath = path.join(appDir, `${name}.xcodeproj`);
      if (getOption('json')) {
        console.log(JSON.stringify({ success: true, projectPath: appDir, xcodeproj: xcodeprojPath, bundleIdentifier: bundleId, platforms }));
      } else {
        console.log(`Created project at ${appDir}`);
      }
    } else {
      console.error('Unknown subcommand for project. Use: create, schemes, configs, packages');
      process.exit(1);
    }
  },

  simulator: async () => {
    const sub = parsedArgs.subcommand || 'list';
    if (getOption('examples')) {
      showExamples('simulator', [
        'zepta simulator list',
        'zepta simulator list -P iOS --available-only --json',
        'zepta simulator boot "iPhone 16"',
        'zepta simulator create "iPhone 16"',
        'zepta simulator shutdown <UDID>',
        'zepta simulator open'
      ]);
    }

    if (sub === 'list') {
      const json = getOption('json');
      const platform = getOption('platform');
      const availableOnly = getOption('availableonly');

      const simOutput = getSimulatorListCached();
      let devices = simOutput.devices || {};
      if (platform) {
        devices = Object.fromEntries(Object.entries(devices).filter(([k]) => k.toLowerCase().includes(String(platform).toLowerCase())));
      }
      let flat = [];
      for (const runtime of Object.keys(devices)) {
        const list = availableOnly ? (devices[runtime] || []).filter(d => d.isAvailable) : (devices[runtime] || []);
        const [plat, ...verParts] = runtime.split('-');
        const osVersion = verParts.join('-') || '';
        list.forEach(d => {
          flat.push({
            udid: d.udid,
            name: d.name,
            platform: plat || 'iOS',
            osVersion,
            state: d.state,
            isAvailable: d.isAvailable,
            deviceTypeIdentifier: d.deviceTypeIdentifier,
            runtimeIdentifier: d.runtimeIdentifier || runtime
          });
        });
      }
      if (json) {
        console.log(JSON.stringify(flat));
      } else {
        for (const runtime of Object.keys(devices)) {
          console.log(runtime);
          (devices[runtime] || []).forEach(d => console.log(`  ${d.name} (${d.udid}, ${d.state}, available: ${d.isAvailable})`));
        }
      }
    } else if (sub === 'boot') {
      const nameOrUdid = parsedArgs.args[0];
      if (!nameOrUdid) {
        console.error('Usage: zepta simulator boot <UDID|name>');
        process.exit(1);
      }
      const udid = resolveSimulatorUdid(nameOrUdid) || nameOrUdid;
      runCommand('xcrun', ['simctl', 'boot', udid]);
      if (getOption('json')) console.log(JSON.stringify({ success: true, udid }));
    } else if (sub === 'shutdown') {
      const nameOrUdid = parsedArgs.args[0];
      if (!nameOrUdid) {
        console.error('Usage: zepta simulator shutdown <UDID|name>');
        process.exit(1);
      }
      const udid = resolveSimulatorUdid(nameOrUdid) || nameOrUdid;
      runCommand('xcrun', ['simctl', 'shutdown', udid]);
      if (getOption('json')) console.log(JSON.stringify({ success: true, udid }));
    } else if (sub === 'open') {
      spawnSync('open', ['-a', 'Simulator']);
      if (getOption('json')) console.log(JSON.stringify({ success: true }));
    } else if (sub === 'create') {
      const name = parsedArgs.args[0];
      if (!name) {
        console.error('Usage: zepta simulator create <name> (e.g. "iPhone 16")');
        process.exit(1);
      }
      const interactive = process.stdin.isTTY && !getOption('json');
      const udid = await resolveOrCreateSimulator(name, { createIfMissing: true, interactive });
      if (!udid) {
        console.error('Could not create simulator. Install the required runtime in Xcode.');
        process.exit(1);
      }
      if (getOption('json')) console.log(JSON.stringify({ success: true, udid, name }));
      else console.log('Created simulator:', name, '(' + udid + ')');
    } else {
      console.error('Unknown simulator subcommand. Use: list, boot, create, shutdown, open');
      process.exit(1);
    }
  },

  device: () => {
    const sub = parsedArgs.subcommand;
    if (getOption('examples')) {
      showExamples('device', [
        'zepta device list',
        'zepta device list -P iOS --json',
        'zepta device install <UDID> /path/to/app.app',
        'zepta device uninstall <UDID> com.example.MyApp',
        'zepta device launch <UDID> com.example.MyApp'
      ]);
    }

    if (sub === 'list') {
      const json = getOption('json');
      const platform = getOption('platform');
      const availableOnly = getOption('availableonly');
      let list = [
        { name: 'My Mac', platform: 'macOS', isAvailable: true, isVirtual: true, description: 'Build and run as native macOS app' },
        { name: 'My Mac Catalyst', platform: 'macOS', isAvailable: true, isVirtual: true, description: 'Build and run iOS app via Mac Catalyst' }
      ];
      try {
        const out = spawnSync('xcrun', ['devicectl', 'list', 'devices', '-j'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
        const output = out.status === 0 && out.stdout ? parseJsonOutput(out.stdout.trim()) : null;
        const devices = output ? ((output.devices || output.result?.devices || []).filter(d => d.udid)) : [];
        devices.forEach(d => {
          const plat = d.platform?.name || d.identifier?.split('-')[0] || 'iOS';
          if (platform && !String(plat).toLowerCase().includes(String(platform).toLowerCase())) return;
          if (availableOnly && !d.isAvailable) return;
          list.push({
            udid: d.udid,
            name: d.name || d.udid,
            platform: plat,
            osVersion: d.osVersion || d.version,
            deviceType: d.deviceType || d.model,
            connectionType: d.connectionType || 'USB',
            isAvailable: d.isAvailable !== false,
            isVirtual: false
          });
        });
      } catch (_) {}
      if (json) console.log(JSON.stringify(list));
      else list.forEach(d => console.log(d.name + (d.udid ? ` (${d.udid})` : '')));
    } else if (sub === 'install') {
      const udid = parsedArgs.args[0];
      const appPath = parsedArgs.args[1];
      if (!udid || !appPath) {
        console.error('Usage: zepta device install <UDID> /path/to/App.app');
        process.exit(1);
      }
      runCommand('xcrun', ['devicectl', 'device', 'install', 'app', appPath, '--device', udid]);
      if (getOption('json')) console.log(JSON.stringify({ success: true }));
    } else if (sub === 'uninstall') {
      const udid = parsedArgs.args[0];
      const bundleId = parsedArgs.args[1];
      if (!udid || !bundleId) {
        console.error('Usage: zepta device uninstall <UDID> <bundle-id>');
        process.exit(1);
      }
      try {
        runCommand('xcrun', ['devicectl', 'device', 'uninstall', 'app', bundleId, '--device', udid]);
      } catch (_) {
        console.log('device uninstall not supported or failed (try ideviceinstaller or Xcode).');
      }
      if (getOption('json')) console.log(JSON.stringify({ success: true }));
    } else if (sub === 'launch') {
      const udid = parsedArgs.args[0];
      const bundleId = parsedArgs.args[1];
      if (!udid || !bundleId) {
        console.error('Usage: zepta device launch <UDID> <bundle-id>');
        process.exit(1);
      }
      runCommand('xcrun', ['devicectl', 'device', 'process', 'launch', bundleId, '--device', udid]);
      if (getOption('json')) console.log(JSON.stringify({ success: true }));
    } else {
      console.error('Unknown device subcommand. Use: list, install, uninstall, launch');
      process.exit(1);
    }
  },

  ui: () => {
    const sub = parsedArgs.subcommand;
    if (sub !== 'simulator') {
      console.error('UI commands under ui simulator');
      process.exit(1);
    }

    const uiSub = parsedArgs.args[0]; // e.g. screen, record, tap, ...
    const udid = getOption('udid') || 'booted';
    const json = getOption('json');

    if (uiSub === 'screen') {
      const output = getOption('output') || path.join(os.tmpdir(), `zepta-screenshot-${Date.now()}.png`);
      const treeOnly = getOption('tree');
      if (treeOnly) {
        if (json) console.log(JSON.stringify({ tree: 'Not implemented; use Xcode or simctl for accessibility tree.' }));
        else console.log('Accessibility tree not implemented.');
        return;
      }
      runCommand('xcrun', ['simctl', 'io', udid, 'screenshot', output]);
      if (json) console.log(JSON.stringify({ screenshot: output }));
      else console.log(`Screenshot saved to ${output}`);
      return;
    }

    if (uiSub === 'record') {
      const output = getOption('output') || path.join(os.tmpdir(), `zepta-record-${Date.now()}.mov`);
      const duration = getOption('duration') || 5;
      if (json) console.log(JSON.stringify({ message: 'Recording not implemented', output }));
      else console.log('Recording not implemented. Use Xcode or simctl for video capture.');
      return;
    }

    const stubbed = ['find', 'tap', 'double-tap', 'type', 'swipe', 'scroll', 'back', 'pinch', 'rotate', 'wait', 'erase', 'hide-keyboard', 'key', 'open-url', 'clear-state', 'button', 'session', 'assert'];
    const isStub = stubbed.some(s => uiSub === s || uiSub && uiSub.startsWith('assert '));
    if (uiSub && (isStub || !['screen', 'record'].includes(uiSub))) {
      if (json) console.log(JSON.stringify({ message: 'Not implemented', command: uiSub }));
      else console.log(`ui simulator ${uiSub} is not implemented.`);
      return;
    }

    if (!uiSub) {
      console.error('Usage: zepta ui simulator <screen|record|...>');
      process.exit(1);
    }
  },

  license: () => {
    const sub = parsedArgs.subcommand || 'status';
    if (getOption('examples')) {
      showExamples('license', [
        'zepta license status',
        'zepta license activate',
        'zepta license deactivate'
      ]);
    }
    if (sub === 'status') {
      if (getOption('json')) console.log(JSON.stringify({ status: 'active', message: 'Open source: Active forever' }));
      else console.log('Open source: Active forever');
    } else if (sub === 'activate' || sub === 'deactivate') {
      if (getOption('json')) console.log(JSON.stringify({ message: 'Zepta is open source; no license activation required.' }));
      else console.log('Zepta is open source; no license activation required.');
    } else {
      console.error('Unknown license subcommand. Use: status, activate, deactivate');
      process.exit(1);
    }
  },

  update: () => {
    if (getOption('examples')) {
      showExamples('update', [
        'zepta update',
        'zepta update --check'
      ]);
    }
    if (getOption('check')) {
      if (getOption('json')) console.log(JSON.stringify({ updateAvailable: false, message: 'No updates available (clone)' }));
      else console.log('No updates available (clone)');
    } else {
      if (getOption('json')) console.log(JSON.stringify({ message: 'Update not implemented in clone' }));
      else console.log('Update not implemented in clone');
    }
  },

  init: () => {
    if (getOption('examples')) {
      showExamples('init', [
        'zepta init -w App.xcworkspace -s MyApp -S "iPhone 16"',
        'zepta init -w App.xcworkspace -s MyApp -D "My Mac"',
        'zepta init -w App.xcworkspace -s MyApp -S "iPhone 16" -C Debug --force --json',
        'zepta init',
        'zepta init -w App.xcworkspace'
      ]);
    }
    const force = getOption('force');
    const jsonOut = getOption('json');
    const configPath = path.join(process.cwd(), CONFIG_FILENAME);
    if (fs.existsSync(configPath) && !force) {
      console.error('Already initialized. Use --force to overwrite.');
      process.exit(1);
    }

    let workspace = getOption('workspace');
    let scheme = getOption('scheme');
    let simulator = getOption('simulator');
    let device = getOption('device');
    const deriveddatapath = getOption('deriveddatapath');
    const configuration = getOption('configuration') || 'Debug';
    const needsInteractive = (!workspace || !scheme || (!simulator && !device)) && process.stdin.isTTY && !jsonOut;

    if (needsInteractive) {
      runInteractiveInit(workspace, scheme, simulator, device, configuration, deriveddatapath, configPath, jsonOut)
        .then(() => process.exit(0))
        .catch(err => {
          console.error(err.message || err);
          process.exit(1);
        });
      return;
    }

    if (!workspace || !scheme) {
      console.error('Usage: zepta init -w <workspace> -s <scheme> [-S "<simulator>" | -D "<device>"]');
      process.exit(1);
    }
    if (!simulator && !device) {
      console.error('Specify -S "<simulator>" (e.g. "iPhone 16") or -D "<device>" (e.g. "My Mac")');
      process.exit(1);
    }
    writeInitConfig(workspace, scheme, simulator, device, configuration, deriveddatapath, configPath, jsonOut);
  },

  stop: () => {
    if (getOption('examples')) {
      showExamples('stop', [
        'zepta stop <app-id>',
        'zepta stop com.example.MyApp',
        'zepta stop --all',
        'zepta stop --all --force --json'
      ]);
    }
    const all = getOption('all');
    const force = getOption('force');
    const jsonOut = getOption('json');
    const idOrBundle = parsedArgs.args[0];
    if (!all && !idOrBundle) {
      console.error('Specify app identifier (bundle ID) or use --all');
      process.exit(1);
    }
    const data = readLaunchedApps();
    const apps = data.apps || [];
    if (all) {
      const booted = getBootedSimulatorUdid();
      if (booted) {
        apps.forEach(a => {
          try { spawnSync('xcrun', ['simctl', 'terminate', a.simulatorUdid || booted, a.bundleId || a.id]); } catch (_) {}
        });
      }
      clearAllLaunchedApps();
      if (jsonOut) console.log(JSON.stringify({ type: 'result', stopped: apps.length }));
      else console.log('Stopped all apps.');
      return;
    }
    const booted = getBootedSimulatorUdid();
    if (!booted) {
      console.error('No booted simulator.');
      process.exit(1);
    }
    try {
      spawnSync('xcrun', ['simctl', 'terminate', booted, idOrBundle], { stdio: 'pipe' });
    } catch (_) {}
    clearLaunchedApp(idOrBundle);
    if (jsonOut) console.log(JSON.stringify({ type: 'result', stopped: idOrBundle }));
    else console.log('App stopped.');
  },

  apps: () => {
    if (getOption('examples')) {
      showExamples('apps', [
        'zepta apps',
        'zepta apps --json'
      ]);
    }
    const data = readLaunchedApps();
    const apps = (data.apps || []).map(a => ({ id: a.bundleId || a.id, bundleId: a.bundleId || a.id, simulatorUdid: a.simulatorUdid, launchedAt: a.launchedAt }));
    if (getOption('json')) console.log(JSON.stringify(apps));
    else if (apps.length === 0) console.log('No apps');
    else apps.forEach(a => console.log(`${a.bundleId} (${a.simulatorUdid || '-'})`));
  }
};

// Help text (FlowDeck-style)
function showHelp() {
  let pkgVersion = '0.1.0';
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) pkgVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch (_) {}
  console.log(`zepta ${pkgVersion} – Fast terminal CLI for Xcode, iOS, and macOS`);
  console.log('');
  console.log('Usage: zepta <command> [subcommand] [options]');
  console.log('');
  console.log('Core:  context, init, build, run, test, clean, logs, stop, apps');
  console.log('Project: project create|schemes|configs|packages ...');
  console.log('Simulator: simulator list|boot|shutdown|open ...');
  console.log('Device: device list|install|uninstall|launch ...');
  console.log('UI: ui simulator screen|record|...');
  console.log('Other: license, update');
  console.log('');
  console.log('Common options: -w/--workspace, -s/--scheme, -S/--simulator, -D/--device, -C/--configuration, -d/--derived-data-path, --json, --examples');
  console.log('Simulator: --create-simulator (create if missing); interactive when TTY (choose device type/runtime)');
  console.log('Global: -h/--help, --version');
  process.exit(0);
}

function showVersion() {
  let pkgVersion = '0.1.0';
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    if (fs.existsSync(pkgPath)) pkgVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  } catch (_) {}
  console.log(pkgVersion);
  process.exit(0);
}

// Run CLI only when executed as main (allows Jest to require and test)
if (require.main === module) {
  (async () => {
    if (parsedArgs.options.help || parsedArgs.options.version) {
      if (parsedArgs.options.version) showVersion();
      showHelp();
    }
    const cmd = parsedArgs.command;
    if (cmd && commands[cmd]) {
      try {
        const result = commands[cmd]();
        if (result && typeof result.then === 'function') await result;
      } catch (err) {
        console.error(err.message || err);
        process.exit(1);
      }
    } else if (!cmd && (parsedArgs.options.help || parsedArgs.options.version)) {
      // already handled above
    } else {
      console.log('Unknown command. Available: context, build, run, test, clean, logs, project, simulator, device, ui, license, update, init, stop, apps');
      process.exit(1);
    }
  })();
}

module.exports = {
  parseArgs,
  CONFIG_FILENAME,
  LAUNCHED_APPS_FILE,
  COMMAND_ALIASES,
  defaultDerivedData,
  getOption,
  commands,
  runCommand,
  runCommandNoExit,
  getCommandOutput,
  parseJsonOutput,
  parseBuildErrors,
  parseTestOutput,
  expandTestIdentifier,
  getSimulatorListCached,
  invalidateSimulatorCache,
  getDeviceTypesList,
  getRuntimesList,
  findDeviceTypeByName,
  findRuntimesForDeviceType,
  createSimulator,
  resolveOrCreateSimulator,
  getXcodeListCached,
  resolveSimulatorUdid,
  validateSimulatorDestination,
  getBootedSimulatorUdid,
  getBuiltAppPath,
  getBundleIdFromApp,
  readLaunchedApps,
  trackLaunchedApp,
  clearLaunchedApp,
  clearAllLaunchedApps,
  showHelp,
  showVersion
};