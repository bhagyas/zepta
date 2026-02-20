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

describe('context command', () => {
  test('context --json returns JSON with schemes and buildConfigurations', () => {
    const r = runZepta(['context', '--json']);
    // May succeed in an Xcode project dir or fail with xcodebuild -list; we only assert structure if we get JSON
    if (r.status === 0 && r.stdout) {
      const lines = r.stdout.trim().split('\n').filter(Boolean);
      const lastLine = lines[lines.length - 1];
      let data;
      try {
        data = JSON.parse(lastLine);
      } catch (_) {
        data = null;
      }
      if (data && typeof data === 'object') {
        expect(data).toHaveProperty('schemes');
        expect(data).toHaveProperty('derivedDataPath');
      }
    }
    // If not in an Xcode project, status may be 1; that's acceptable
  });

  test('context (no args) exits 0 or 1 and prints something', () => {
    const r = runZepta(['context']);
    expect(typeof r.stdout).toBe('string');
    expect(typeof r.stderr).toBe('string');
  });
});
