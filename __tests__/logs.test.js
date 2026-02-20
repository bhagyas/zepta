'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const zeptaPath = path.join(__dirname, '..', 'zepta.js');
const node = process.execPath;

function runZepta(args, cwd = process.cwd()) {
  return spawnSync(node, [zeptaPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env },
    timeout: 2000
  });
}

describe('logs command', () => {
  test('logs without identifier exits non-zero', () => {
    const r = runZepta(['logs']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Missing identifier|app-id|bundle ID/);
  });

  test('logs --examples exits 0', () => {
    const r = runZepta(['logs', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta logs/);
  });
});
