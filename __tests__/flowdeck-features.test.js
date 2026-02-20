'use strict';

const {
  expandTestIdentifier,
  parseBuildErrors,
  parseTestOutput
} = require('../zepta.js');

describe('expandTestIdentifier', () => {
  test('returns full identifier unchanged when it starts with SchemeTests/', () => {
    expect(expandTestIdentifier('MyApp', 'MyAppTests/LoginTests/testValidLogin')).toBe('MyAppTests/LoginTests/testValidLogin');
    // OtherTests/ does not start with AppTests/, so it gets prefixed (user intent: run App's tests in OtherTests/Foo/bar)
    expect(expandTestIdentifier('App', 'AppTests/Foo/bar')).toBe('AppTests/Foo/bar');
  });

  test('prefixes short form with SchemeTests/', () => {
    expect(expandTestIdentifier('MyApp', 'LoginTests/testValidLogin')).toBe('MyAppTests/LoginTests/testValidLogin');
    expect(expandTestIdentifier('App', 'LoginTests')).toBe('AppTests/LoginTests');
  });

  test('handles empty or invalid scheme', () => {
    expect(expandTestIdentifier('', 'LoginTests/test')).toBe('AppTests/LoginTests/test');
    expect(expandTestIdentifier(null, 'Foo/bar')).toBe('AppTests/Foo/bar');
  });

  test('returns value unchanged for empty string', () => {
    expect(expandTestIdentifier('MyApp', '')).toBe('');
    expect(expandTestIdentifier('MyApp', null)).toBe(null);
  });
});

describe('parseBuildErrors', () => {
  test('parses Swift/Clang error lines', () => {
    const text = [
      '/path/ContentView.swift:42:15: error: cannot convert value of type \'String\' to expected argument type \'Int\'',
      '/path/App.swift:10:1: warning: unused variable'
    ].join('\n');
    const errors = parseBuildErrors(text);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatchObject({ file: '/path/ContentView.swift', line: 42, column: 15, severity: 'error', message: 'cannot convert value of type \'String\' to expected argument type \'Int\'' });
    expect(errors[1]).toMatchObject({ severity: 'warning' });
  });

  test('returns empty array for empty or no-match text', () => {
    expect(parseBuildErrors('')).toEqual([]);
    expect(parseBuildErrors('some random log')).toEqual([]);
  });
});

describe('parseTestOutput', () => {
  test('parses Test Case passed/failed lines', () => {
    const text = [
      "Test Case '-[MyAppTests.LoginTests testValidLogin]' passed (0.123 seconds).",
      "Test Case '-[MyAppTests.LoginTests testInvalidLogin]' failed (0.456 seconds)."
    ].join('\n');
    const out = parseTestOutput(text);
    expect(out.passed).toHaveLength(1);
    expect(out.passed[0].identifier).toContain('testValidLogin');
    expect(out.passed[0].duration).toBe(0.123);
    expect(out.failed).toHaveLength(1);
    expect(out.failed[0].identifier).toContain('testInvalidLogin');
    expect(out.total).toBe(2);
  });

  test('returns empty arrays for no matches', () => {
    const out = parseTestOutput('no test lines');
    expect(out.passed).toEqual([]);
    expect(out.failed).toEqual([]);
    expect(out.total).toBe(0);
  });
});
