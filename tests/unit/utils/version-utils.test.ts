import { describe, expect, it } from 'vitest';

import {
  compareVersions,
  isVersionGte,
  isVersionLt,
  parseVersion,
} from '../../../src/utils/version-utils.js';

describe('parseVersion', () => {
  it('parses a plain major.minor.patch version', () => {
    expect(parseVersion('17.3.0')).toEqual({ major: 17, minor: 3, patch: 0 });
  });

  it('parses a version with a leading "v"', () => {
    expect(parseVersion('v18.0.1')).toEqual({ major: 18, minor: 0, patch: 1 });
  });

  it('parses a prerelease version', () => {
    expect(parseVersion('18.1.0-next.3')).toEqual({
      major: 18,
      minor: 1,
      patch: 0,
      prerelease: 'next.3',
    });
  });

  it('throws on an invalid version string', () => {
    expect(() => parseVersion('not-a-version')).toThrow(/Invalid semantic version/);
  });
});

describe('compareVersions', () => {
  it('orders by major first', () => {
    expect(compareVersions('18.0.0', '17.9.9')).toBeGreaterThan(0);
  });

  it('orders by minor when major is equal', () => {
    expect(compareVersions('17.3.0', '17.2.9')).toBeGreaterThan(0);
  });

  it('orders by patch when major and minor are equal', () => {
    expect(compareVersions('17.3.1', '17.3.0')).toBeGreaterThan(0);
  });

  it('treats equal versions as equal', () => {
    expect(compareVersions('17.3.0', '17.3.0')).toBe(0);
  });

  it('ranks a release above its own prerelease', () => {
    expect(compareVersions('18.0.0', '18.0.0-beta.1')).toBeGreaterThan(0);
    expect(compareVersions('18.0.0-beta.1', '18.0.0')).toBeLessThan(0);
  });
});

describe('isVersionGte / isVersionLt', () => {
  it('reports gte correctly at and above the boundary', () => {
    expect(isVersionGte('17.0.0', '17.0.0')).toBe(true);
    expect(isVersionGte('17.0.1', '17.0.0')).toBe(true);
    expect(isVersionGte('16.9.9', '17.0.0')).toBe(false);
  });

  it('reports lt correctly below the boundary', () => {
    expect(isVersionLt('16.9.9', '17.0.0')).toBe(true);
    expect(isVersionLt('17.0.0', '17.0.0')).toBe(false);
  });
});
