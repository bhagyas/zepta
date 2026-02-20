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

describe('test command', () => {
  test('test discover --json returns object with tests array', () => {
    const r = runZepta(['test', 'discover', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data).toHaveProperty('tests');
    expect(Array.isArray(data.tests)).toBe(true);
    if (data.tests.length > 0) {
      expect(data.tests[0]).toHaveProperty('identifier');
      expect(data.tests[0]).toHaveProperty('target');
    }
  });

  test('test plans --json returns object with plans array', () => {
    const r = runZepta(['test', 'plans', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(data).toHaveProperty('plans');
    expect(Array.isArray(data.plans)).toBe(true);
    if (data.plans.length > 0) {
      expect(data.plans[0]).toHaveProperty('name');
      expect(data.plans[0]).toHaveProperty('reference');
    }
  });

  test('test without workspace/scheme/simulator exits non-zero', () => {
    const r = runZepta(['test']);
    expect(r.status).not.toBe(0);
  });

  test('test --examples exits 0 and prints examples', () => {
    const r = runZepta(['test', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta test/);
  });
});
