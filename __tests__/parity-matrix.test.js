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

describe('FlowDeck parity matrix (command surface)', () => {
  test('help includes parity-critical command groups', () => {
    const r = runZepta(['--help']);
    expect(r.status).toBe(0);
    const out = r.stdout;
    [
      'project packages list|add|remove|link|resolve|update|clear',
      'project sync-profiles',
      'simulator screenshot|erase|delete|prune|runtime|location|media|device-types|clear-cache',
      'ui simulator screen|record|open-url|key|hide-keyboard|session|assert'
    ].forEach(token => expect(out).toContain(token));
  });

  test('parity subcommands are discoverable and return expected validation states', () => {
    const matrix = [
      { args: ['project', 'packages', 'add'], expectNonZero: true },
      { args: ['project', 'packages', 'remove'], expectNonZero: true },
      { args: ['project', 'packages', 'link'], expectNonZero: true },
      { args: ['project', 'sync-profiles'], expectNonZero: true },
      { args: ['simulator', 'runtime', 'list', '--json'], expectNonZero: false },
      { args: ['simulator', 'runtime', 'create'], expectNonZero: true },
      { args: ['simulator', 'runtime', 'delete'], expectNonZero: true },
      { args: ['simulator', 'location', 'set'], expectNonZero: true },
      { args: ['simulator', 'media', 'add'], expectNonZero: true },
      { args: ['ui', 'simulator', 'open-url'], expectNonZero: true },
      { args: ['ui', 'simulator', 'key'], expectNonZero: true },
      { args: ['ui', 'simulator', 'session', 'status', '--json'], expectNonZero: false },
      { args: ['ui', 'simulator', 'assert', 'text', '--actual', 'abc', '--contains', 'a', '--json'], expectNonZero: false }
    ];

    matrix.forEach(item => {
      const r = runZepta(item.args);
      if (item.expectNonZero) expect(r.status).not.toBe(0);
      else expect(r.status).toBe(0);
    });
  });
});
