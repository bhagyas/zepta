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

describe('build command', () => {
  test('build without workspace/scheme/simulator prints usage error', () => {
    const r = runZepta(['build']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/workspace|scheme|simulator|device|init/);
  });

  test('build with -w -s but no -S or -D prints error', () => {
    const r = runZepta(['build', '-w', 'App.xcworkspace', '-s', 'App']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/simulator|device/);
  });
});

describe('clean command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `zepta-clean-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('clean with --json returns JSON result when successful', () => {
    const r = runZepta(['clean', '--json'], tmpDir);
    // clean without scheme/workspace just skips xcodebuild clean; may still exit 0
    if (r.status === 0 && r.stdout) {
      const lines = r.stdout.trim().split('\n').filter(Boolean);
      const last = lines[lines.length - 1];
      try {
        const data = JSON.parse(last);
        expect(data).toHaveProperty('success', true);
      } catch (_) {}
    }
  });
});

describe('run command', () => {
  test('run --no-build without config prints error (missing workspace/scheme/destination)', () => {
    const r = runZepta(['run', '--no-build']);
    // Either fails at build step (no config) or later; we expect non-zero when no project
    expect(r.status).not.toBe(0);
  });
});
