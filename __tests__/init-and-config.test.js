'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const zeptaPath = path.join(__dirname, '..', 'zepta.js');
const node = process.execPath;

function runZepta(args, cwd = process.cwd()) {
  return spawnSync(node, [zeptaPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env }
  });
}

describe('init and config (FlowDeck-style workflow)', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `zepta-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('init creates .zepta.json with workspace, scheme, simulator', () => {
    const r = runZepta(['init', '-w', 'MyApp.xcworkspace', '-s', 'MyApp', '-S', 'iPhone 16'], tmpDir);
    expect(r.status).toBe(0);
    const configPath = path.join(tmpDir, '.zepta.json');
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.workspace).toBe('MyApp.xcworkspace');
    expect(config.scheme).toBe('MyApp');
    expect(config.simulator).toBe('iPhone 16');
  });

  test('init with -D device saves device', () => {
    const r = runZepta(['init', '-w', 'App.xcworkspace', '-s', 'App', '-D', 'My Mac'], tmpDir);
    expect(r.status).toBe(0);
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.zepta.json'), 'utf8'));
    expect(config.device).toBe('My Mac');
  });

  test('init without -S or -D exits with error', () => {
    const r = runZepta(['init', '-w', 'App.xcworkspace', '-s', 'App'], tmpDir);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Specify -S|simulator|device/);
  });

  test('init without workspace or scheme exits with error', () => {
    const r = runZepta(['init', '-S', 'iPhone 16'], tmpDir);
    expect(r.status).not.toBe(0);
  });

  test('init --force overwrites existing config', () => {
    runZepta(['init', '-w', 'App.xcworkspace', '-s', 'App', '-S', 'iPhone 16'], tmpDir);
    const r = runZepta(['init', '-w', 'Other.xcworkspace', '-s', 'Other', '-S', 'iPhone 15', '--force'], tmpDir);
    expect(r.status).toBe(0);
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.zepta.json'), 'utf8'));
    expect(config.workspace).toBe('Other.xcworkspace');
    expect(config.scheme).toBe('Other');
  });

  test('init --json outputs JSON result', () => {
    const r = runZepta(['init', '-w', 'App.xcworkspace', '-s', 'App', '-S', 'iPhone 16', '--json'], tmpDir);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data.success).toBe(true);
    expect(data.workspace).toBe('App.xcworkspace');
    expect(data.scheme).toBe('App');
    expect(data.targetType).toBe('simulator');
  });
});
