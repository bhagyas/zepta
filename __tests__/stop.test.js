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

describe('stop command', () => {
  test('stop without app id and without --all exits non-zero', () => {
    const r = runZepta(['stop']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Specify app identifier|--all/);
  });

  test('stop --all exits 0', () => {
    const r = runZepta(['stop', '--all']);
    expect(r.status).toBe(0);
  });

  test('stop --examples exits 0', () => {
    const r = runZepta(['stop', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta stop/);
  });
});
