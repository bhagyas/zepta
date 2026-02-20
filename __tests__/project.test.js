'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const fs = require('fs');
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

describe('project schemes', () => {
  test('project schemes --json returns array (may be empty outside Xcode project)', () => {
    const r = runZepta(['project', 'schemes', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('project configs', () => {
  test('project configs --json returns array of strings', () => {
    const r = runZepta(['project', 'configs', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) expect(typeof data[0]).toBe('string');
  });
});

describe('project create', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `zepta-project-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('project create with --platforms and --json outputs FlowDeck-style JSON', () => {
    const r = runZepta(['project', 'create', 'ProjApp', '--platforms', 'ios,macos', '--json'], tmpDir);
    expect(r.status).toBe(0);
    const lines = r.stdout.trim().split('\n').filter(Boolean);
    const data = JSON.parse(lines[lines.length - 1]);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('projectPath');
    expect(data).toHaveProperty('xcodeproj');
    expect(data).toHaveProperty('bundleIdentifier');
    expect(data).toHaveProperty('platforms');
    expect(Array.isArray(data.platforms)).toBe(true);
  });
});

describe('project packages', () => {
  test('project packages list exits 0', () => {
    const r = runZepta(['project', 'packages', 'list']);
    expect(r.status).toBe(0);
  });
});
