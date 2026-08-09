/**
 * Hand-rolled semver comparison — deliberately not a dependency. We only ever need to compare
 * `@angular/material`/`@angular/cdk` versions read from an installed package's `package.json`,
 * not the full semver range grammar.
 */
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/;

export function parseVersion(version: string): SemVer {
  const match = VERSION_PATTERN.exec(version.trim());
  if (!match) {
    throw new Error(`Invalid semantic version: "${version}"`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  const prerelease = match[4];
  return prerelease !== undefined ? { major, minor, patch, prerelease } : { major, minor, patch };
}

function comparePrerelease(a: string | undefined, b: string | undefined): number {
  // No prerelease outranks a prerelease of the same major.minor.patch (1.0.0 > 1.0.0-beta).
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** Returns <0 if a<b, 0 if equal, >0 if a>b — comparing major, then minor, then patch, then prerelease. */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  if (va.patch !== vb.patch) return va.patch - vb.patch;
  return comparePrerelease(va.prerelease, vb.prerelease);
}

export function isVersionGte(version: string, minimum: string): boolean {
  return compareVersions(version, minimum) >= 0;
}

export function isVersionLt(version: string, minimum: string): boolean {
  return compareVersions(version, minimum) < 0;
}
