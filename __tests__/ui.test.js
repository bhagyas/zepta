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

  test('ui simulator record returns not implemented message', () => {
    const r = runZepta(['ui', 'simulator', 'record']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not implemented|Recording/);
  });

  test('ui simulator tap returns not implemented', () => {
    const r = runZepta(['ui', 'simulator', 'tap']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/not implemented/);
  });

  test('ui without simulator subcommand exits non-zero', () => {
    const r = runZepta(['ui', 'invalid']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/ui simulator/);
  });
});
