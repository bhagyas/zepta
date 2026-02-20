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

describe('device command', () => {
  test('device list --json returns array including virtual Mac entries', () => {
    const r = runZepta(['device', 'list', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
    const names = data.map(d => d.name);
    expect(names).toContain('My Mac');
    expect(names).toContain('My Mac Catalyst');
  });

  test('device list exits 0', () => {
    const r = runZepta(['device', 'list']);
    expect(r.status).toBe(0);
  });

  test('device install without UDID and path exits non-zero', () => {
    const r = runZepta(['device', 'install']);
    expect(r.status).not.toBe(0);
  });

  test('device uninstall without args exits non-zero', () => {
    const r = runZepta(['device', 'uninstall']);
    expect(r.status).not.toBe(0);
  });

  test('device launch without args exits non-zero', () => {
    const r = runZepta(['device', 'launch']);
    expect(r.status).not.toBe(0);
  });

  test('device --examples exits 0', () => {
    const r = runZepta(['device', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta device/);
  });
});
