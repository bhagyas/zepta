'use strict';

const { parseArgs, CONFIG_FILENAME, COMMAND_ALIASES } = require('../zepta.js');

describe('parseArgs (FlowDeck-style CLI)', () => {
  const argv = (args) => ['node', 'zepta.js', ...args];

  test('parses build with -w -s -S (workspace, scheme, simulator)', () => {
    const p = parseArgs(argv(['build', '-w', 'MyApp.xcworkspace', '-s', 'MyApp', '-S', 'iPhone 16']));
    expect(p.command).toBe('build');
    expect(p.options.workspace).toBe('MyApp.xcworkspace');
    expect(p.options.scheme).toBe('MyApp');
    expect(p.options.simulator).toBe('iPhone 16');
  });

  test('parses build with long options', () => {
    const p = parseArgs(argv(['build', '--workspace', 'App.xcworkspace', '--scheme', 'App', '--simulator', 'iPhone 15']));
    expect(p.options.workspace).toBe('App.xcworkspace');
    expect(p.options.scheme).toBe('App');
    expect(p.options.simulator).toBe('iPhone 15');
  });

  test('parses -D device (My Mac)', () => {
    const p = parseArgs(argv(['build', '-w', 'App.xcworkspace', '-s', 'App', '-D', 'My Mac']));
    expect(p.options.device).toBe('My Mac');
    expect(p.options.simulator).toBeUndefined();
  });

  test('parses -D device (My Mac Catalyst)', () => {
    const p = parseArgs(argv(['build', '-D', 'My Mac Catalyst']));
    expect(p.options.device).toBe('My Mac Catalyst');
  });

  test('parses -C configuration (Debug/Release)', () => {
    const p = parseArgs(argv(['build', '-w', 'W', '-s', 'S', '-S', 'iPhone', '-C', 'Release']));
    expect(p.options.configuration).toBe('Release');
  });

  test('parses -d derived data path', () => {
    const p = parseArgs(argv(['build', '-d', '/custom/DerivedData']));
    expect(p.options.deriveddatapath).toBe('/custom/DerivedData');
  });

  test('parses init with -w -s -S', () => {
    const p = parseArgs(argv(['init', '-w', 'MyApp.xcworkspace', '-s', 'MyApp', '-S', 'iPhone 16']));
    expect(p.command).toBe('init');
    expect(p.options.workspace).toBe('MyApp.xcworkspace');
    expect(p.options.scheme).toBe('MyApp');
    expect(p.options.simulator).toBe('iPhone 16');
  });

  test('parses init with -w -s -D', () => {
    const p = parseArgs(argv(['init', '-w', 'App.xcworkspace', '-s', 'App', '-D', 'My Mac']));
    expect(p.command).toBe('init');
    expect(p.options.device).toBe('My Mac');
  });

  test('parses --json', () => {
    const p = parseArgs(argv(['context', '--json']));
    expect(p.options.json).toBe(true);
  });

  test('parses run --no-build', () => {
    const p = parseArgs(argv(['run', '--no-build']));
    expect(p.command).toBe('run');
    expect(p.options.nobuild).toBe(true);
  });

  test('parses run --log', () => {
    const p = parseArgs(argv(['run', '-l']));
    expect(p.options.log).toBe(true);
  });

  test('parses clean --all', () => {
    const p = parseArgs(argv(['clean', '--all']));
    expect(p.command).toBe('clean');
    expect(p.options.all).toBe(true);
  });

  test('parses clean --derived-data, --xcode-derived-data, --xcode-cache', () => {
    const p = parseArgs(argv(['clean', '--derived-data', '--xcode-cache']));
    expect(p.options.deriveddata).toBe(true);
    expect(p.options.xcodecache).toBe(true);
  });

  test('parses test with subcommand discover', () => {
    const p = parseArgs(argv(['test', 'discover']));
    expect(p.command).toBe('test');
    expect(p.subcommand).toBe('discover');
  });

  test('parses simulator list with -P iOS', () => {
    const p = parseArgs(argv(['simulator', 'list', '-P', 'iOS']));
    expect(p.command).toBe('simulator');
    expect(p.subcommand).toBe('list');
    expect(p.options.platform).toBe('iOS');
  });

  test('CONFIG_FILENAME is .zepta.json', () => {
    expect(CONFIG_FILENAME).toBe('.zepta.json');
  });

  test('parses --xcodebuild-options and --xcodebuild-env', () => {
    const p = parseArgs(argv(['build', '--xcodebuild-options=-quiet', '--xcodebuild-env=CI=true']));
    expect(p.options.xcodebuildoptions).toBe('-quiet');
    expect(p.options.xcodebuildenv).toBe('CI=true');
  });

  test('parses --launch-options and --launch-env', () => {
    const p = parseArgs(argv(['run', '--launch-options=-SkipOnboarding', '--launch-env=DEBUG=1']));
    expect(p.options.launchoptions).toBe('-SkipOnboarding');
    expect(p.options.launchenv).toBe('DEBUG=1');
  });

  test('parses test --only and --skip and --plan', () => {
    const p = parseArgs(argv(['test', '--only', 'MyTests/LoginTests', '--skip', 'SlowTests', '--plan', 'Smoke']));
    expect(p.options.only).toBe('MyTests/LoginTests');
    expect(p.options.skip).toBe('SlowTests');
    expect(p.options.plan).toBe('Smoke');
  });

  test('parses -P platform and -A available-only', () => {
    const p = parseArgs(argv(['simulator', 'list', '-P', 'iOS', '-A']));
    expect(p.options.platform).toBe('iOS');
    expect(p.options.availableonly).toBe(true);
  });

  test('command alias sim -> simulator', () => {
    const p = parseArgs(argv(['sim', 'list']));
    expect(p.command).toBe('simulator');
  });

  test('command alias dev -> device', () => {
    const p = parseArgs(argv(['dev', 'list']));
    expect(p.command).toBe('device');
  });

  test('command alias log -> logs', () => {
    const p = parseArgs(argv(['log', 'com.example.app']));
    expect(p.command).toBe('logs');
  });

  test('command alias up -> update', () => {
    const p = parseArgs(argv(['up', '--check']));
    expect(p.command).toBe('update');
  });

  test('parses --force and --help', () => {
    const p = parseArgs(argv(['init', '--force']));
    expect(p.options.force).toBe(true);
    const p2 = parseArgs(argv(['--help']));
    expect(p2.options.help).toBe(true);
  });
});
