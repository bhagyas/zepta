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

describe('simulator command', () => {
  test('simulator list --json returns array of objects with udid, name, platform', () => {
    const r = runZepta(['simulator', 'list', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty('udid');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('platform');
      expect(data[0]).toHaveProperty('osVersion');
      expect(data[0]).toHaveProperty('state');
      expect(data[0]).toHaveProperty('isAvailable');
    }
  });

  test('simulator list -P iOS returns output', () => {
    const r = runZepta(['simulator', 'list', '-P', 'iOS']);
    expect(r.status).toBe(0);
    expect(typeof r.stdout).toBe('string');
  });

  test('simulator boot without UDID exits non-zero', () => {
    const r = runZepta(['simulator', 'boot']);
    expect(r.status).not.toBe(0);
  });

  test('simulator open exits 0', () => {
    const r = runZepta(['simulator', 'open']);
    expect(r.status).toBe(0);
  });

  test('simulator shutdown without UDID exits non-zero', () => {
    const r = runZepta(['simulator', 'shutdown']);
    expect(r.status).not.toBe(0);
  });

  test('simulator erase without UDID exits non-zero', () => {
    const r = runZepta(['simulator', 'erase']);
    expect(r.status).not.toBe(0);
  });

  test('simulator delete without UDID exits non-zero', () => {
    const r = runZepta(['simulator', 'delete']);
    expect(r.status).not.toBe(0);
  });

  test('simulator runtime list --json returns array', () => {
    const r = runZepta(['simulator', 'runtime', 'list', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
  });

  test('simulator runtime create without path exits non-zero', () => {
    const r = runZepta(['simulator', 'runtime', 'create']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta simulator runtime create/);
  });

  test('simulator runtime delete without identifier exits non-zero', () => {
    const r = runZepta(['simulator', 'runtime', 'delete']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta simulator runtime delete/);
  });

  test('simulator device-types --json returns array', () => {
    const r = runZepta(['simulator', 'device-types', '--json']);
    expect(r.status).toBe(0);
    const data = JSON.parse(r.stdout.trim());
    expect(Array.isArray(data)).toBe(true);
  });

  test('simulator location set without coordinates exits non-zero', () => {
    const r = runZepta(['simulator', 'location', 'set']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta simulator location set/);
  });

  test('simulator media add without file exits non-zero', () => {
    const r = runZepta(['simulator', 'media', 'add']);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Usage: zepta simulator media add/);
  });

  test('simulator --examples exits 0', () => {
    const r = runZepta(['simulator', '--examples']);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/zepta simulator/);
  });
});
