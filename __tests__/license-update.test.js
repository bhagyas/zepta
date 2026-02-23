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

describe('license command', () => {
  test('license status exits 0 and prints active', () => {
    const r = runZepta(['license', 'status']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Open source|Active|forever/);
  });

  test('license status --json returns object with status', () => {
    const r = runZepta(['license', 'status', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data).toHaveProperty('status');
  });

  test('license activate exits 0 with message', () => {
    const r = runZepta(['license', 'activate']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/open source|no license|activation/);
  });

  test('license deactivate exits 0', () => {
    const r = runZepta(['license', 'deactivate']);
    expect(r.status).toBe(0);
  });
});

describe('update command', () => {
  test('update --check exits 0', () => {
    const r = runZepta(['update', '--check']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/No updates|clone/);
  });

  test('update exits 0', () => {
    const r = runZepta(['update']);
    expect(r.status).toBe(0);
  });

  test('update --json returns JSON', () => {
    const r = runZepta(['update', '--check', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data).toHaveProperty('updateAvailable');
  });

  test('global --changelog exits 0 and prints changelog path or URL', () => {
    const r = runZepta(['--changelog']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/CHANGELOG\.md|github\.com/);
  });
});
