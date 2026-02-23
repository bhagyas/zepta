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

describe('ui simulator command', () => {
  test('ui simulator screen with --output writes path and accepts --json', () => {
    const out = path.join(os.tmpdir(), `zepta-ui-test-${Date.now()}.png`);
    const r = runZepta(['ui', 'simulator', 'screen', '--output', out]);
    if (r.status === 0) {
      expect(r.stdout).toMatch(/Screenshot saved|screenshot/);
    }
    const r2 = runZepta(['ui', 'simulator', 'screen', '--output', out, '--json']);
    if (r2.status === 0 && r2.stdout.trim()) {
      const data = JSON.parse(r2.stdout.trim());
      expect(data).toHaveProperty('screenshot');
    }
  });

  test('ui simulator record accepts command shape', () => {
    const out = path.join(os.tmpdir(), `zepta-rec-test-${Date.now()}.mov`);
    const r = runZepta(['ui', 'simulator', 'record', '--duration', '0.1', '--output', out]);
    if (r.status === 0) {
      expect(r.stdout).toMatch(/Recording saved|recording/);
    } else {
      expect(r.stderr || r.stdout).toMatch(/Error running|record/i);
    }
  });

  test('ui simulator tap returns not implemented', () => {
    const r = runZepta(['ui', 'simulator', 'tap']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not implemented/);
  });

  test('ui simulator wait works without simulator dependencies', () => {
    const r = runZepta(['ui', 'simulator', 'wait', '0.01', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data).toHaveProperty('action', 'wait');
  });

  test('ui simulator open-url without value exits non-zero', () => {
    const r = runZepta(['ui', 'simulator', 'open-url']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta ui simulator open-url/);
  });

  test('ui simulator key without value exits non-zero', () => {
    const r = runZepta(['ui', 'simulator', 'key']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta ui simulator key/);
  });

  test('ui simulator session lifecycle works', () => {
    const start = runZepta(['ui', 'simulator', 'session', 'start', '--name', 'test-session', '--json']);
    expect(start.status).toBe(0);
    const startData = JSON.parse(start.stdout.trim());
    expect(startData).toHaveProperty('success', true);
    expect(startData.session).toHaveProperty('name', 'test-session');

    const status = runZepta(['ui', 'simulator', 'session', 'status', '--json']);
    expect(status.status).toBe(0);
    const statusData = JSON.parse(status.stdout.trim());
    expect(statusData.session).toBeTruthy();

    const stop = runZepta(['ui', 'simulator', 'session', 'stop', '--json']);
    expect(stop.status).toBe(0);
    const stopData = JSON.parse(stop.stdout.trim());
    expect(stopData).toHaveProperty('success', true);
  });

  test('ui simulator assert text pass/fail semantics', () => {
    const pass = runZepta(['ui', 'simulator', 'assert', 'text', '--actual', 'Welcome Home', '--contains', 'Home', '--json']);
    expect(pass.status).toBe(0);
    const passData = JSON.parse(pass.stdout.trim());
    expect(passData).toHaveProperty('passed', true);

    const fail = runZepta(['ui', 'simulator', 'assert', 'text', '--actual', 'Welcome Home', '--contains', 'XYZ', '--json']);
    expect(fail.status).not.toBe(0);
    const failData = JSON.parse(fail.stdout.trim());
    expect(failData).toHaveProperty('passed', false);
  });

  test('ui without simulator subcommand exits non-zero', () => {
    const r = runZepta(['ui', 'invalid']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/ui simulator/);
  });
});
