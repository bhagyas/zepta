'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const zeptaPath = path.join(__dirname, '..', 'zepta.js');
const node = process.execPath;

function runZepta(args, cwd = process.cwd()) {
  return spawnSync(node, [zeptaPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env }
  });
}

describe('apps command', () => {
  test('apps --json returns JSON array', () => {
    const r = runZepta(['apps', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
  });

  test('apps (no args) exits 0', () => {
    const r = runZepta(['apps']);
    expect(r.status).toBe(0);
  });

  test('apps --examples exits 0', () => {
    const r = runZepta(['apps', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta apps/);
  });
});
