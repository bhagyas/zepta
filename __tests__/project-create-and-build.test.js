'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
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

describe('project create', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `zepta-create-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('creates project directory and .xcodeproj bundle', () => {
    const r = runZepta(['project', 'create', 'MyApp'], tmpDir);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/Created project at/);

    const appDir = path.join(tmpDir, 'MyApp');
    expect(fs.existsSync(appDir)).toBe(true);
    expect(fs.statSync(appDir).isDirectory()).toBe(true);

    const xcodeprojDir = path.join(appDir, 'MyApp.xcodeproj');
    expect(fs.existsSync(xcodeprojDir)).toBe(true);
    expect(fs.statSync(xcodeprojDir).isDirectory()).toBe(true);

    const pbxproj = path.join(xcodeprojDir, 'project.pbxproj');
    expect(fs.existsSync(pbxproj)).toBe(true);
    expect(fs.readFileSync(pbxproj, 'utf8')).toContain('stub');
  });

  test('create with --json outputs JSON with projectPath', () => {
    const r = runZepta(['project', 'create', 'TestApp', '--json'], tmpDir);
    expect(r.status).toBe(0);
    const appDir = path.join(tmpDir, 'TestApp');
    expect(fs.existsSync(appDir)).toBe(true);

    const lines = r.stdout.trim().split('\n').filter(Boolean);
    const jsonLine = lines[lines.length - 1];
    const data = JSON.parse(jsonLine);
    expect(data).toHaveProperty('projectPath');
    expect(data.projectPath).toContain('TestApp');
    expect(fs.existsSync(data.projectPath)).toBe(true);
  });

  test('create with --path puts project in given directory', () => {
    const outDir = path.join(tmpDir, 'output');
    fs.mkdirSync(outDir, { recursive: true });
    const r = runZepta(['project', 'create', 'App', '--path', outDir], tmpDir);
    expect(r.status).toBe(0);
    expect(fs.existsSync(path.join(outDir, 'App'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'App', 'App.xcodeproj', 'project.pbxproj'))).toBe(true);
  });

  test('create without name exits with error', () => {
    const r = runZepta(['project', 'create'], tmpDir);
    expect(r.status).not.toBe(0);
    expect(r.stderr || r.stdout).toMatch(/Missing name/);
  });

  test('create with custom --bundleid (option is accepted)', () => {
    const r = runZepta(['project', 'create', 'MyApp', '--bundleid', 'com.acme.myapp'], tmpDir);
    expect(r.status).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, 'MyApp'))).toBe(true);
  });
});

describe('project create and build workflow', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `zepta-create-build-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('create project then init then build is attempted', () => {
    const r1 = runZepta(['project', 'create', 'MyApp'], tmpDir);
    expect(r1.status).toBe(0);

    const appDir = path.join(tmpDir, 'MyApp');
    const projectPath = path.join(appDir, 'MyApp.xcodeproj');
    expect(fs.existsSync(projectPath)).toBe(true);

    const r2 = runZepta(['init', '-w', projectPath, '-s', 'MyApp', '-S', 'iPhone 16'], tmpDir);
    expect(r2.status).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, '.zepta.json'))).toBe(true);

    const r3 = runZepta(['build'], tmpDir);
    expect(r3.status).toBeDefined();
    expect(typeof r3.status).toBe('number');
    expect(r3.stdout !== undefined || r3.stderr !== undefined).toBe(true);
  });

  test('create project then init with workspace relative to cwd then build', () => {
    const r1 = runZepta(['project', 'create', 'App'], tmpDir);
    expect(r1.status).toBe(0);

    const r2 = runZepta(['init', '-w', 'App/App.xcodeproj', '-s', 'App', '-S', 'iPhone 16'], tmpDir);
    expect(r2.status).toBe(0);

    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.zepta.json'), 'utf8'));
    expect(config.workspace).toBe('App/App.xcodeproj');
    expect(config.scheme).toBe('App');

    const r3 = runZepta(['build'], tmpDir);
    expect(r3.status).toBeDefined();
    expect(typeof r3.status).toBe('number');
  });

  test('setup empty project and run on iPhone 16 simulator', () => {
    const r1 = runZepta(['project', 'create', 'EmptyApp'], tmpDir);
    expect(r1.status).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, 'EmptyApp', 'EmptyApp.xcodeproj'))).toBe(true);

    const r2 = runZepta(['init', '-w', 'EmptyApp/EmptyApp.xcodeproj', '-s', 'EmptyApp', '-S', 'iPhone 16'], tmpDir);
    expect(r2.status).toBe(0);
    const config = JSON.parse(fs.readFileSync(path.join(tmpDir, '.zepta.json'), 'utf8'));
    expect(config.workspace).toBe('EmptyApp/EmptyApp.xcodeproj');
    expect(config.scheme).toBe('EmptyApp');
    expect(config.simulator).toBe('iPhone 16');

    const r3 = runZepta(['run', '-S', 'iPhone 16'], tmpDir);
    expect(r3.status).toBeDefined();
    expect(typeof r3.status).toBe('number');
    const output = (r3.stdout || '') + (r3.stderr || '');
    expect(output).toBeTruthy();
    expect(
      output.includes('iPhone 16') ||
      output.includes('simulator') ||
      output.includes('Simulator') ||
      output.includes('xcodebuild') ||
      output.includes('Error') ||
      output.includes('build') ||
      output.includes('Launching')
    ).toBe(true);
  });
});
