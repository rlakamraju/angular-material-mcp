import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../../src/types/config.js';

describe('loadConfig', () => {
  it('defaults to info/standalone with no angularProjectPath when env is empty', () => {
    expect(loadConfig({})).toEqual({ logLevel: 'info', importStyle: 'standalone' });
  });

  it('reads all three variables when set to valid values', () => {
    expect(
      loadConfig({
        ANGULAR_PROJECT_PATH: '/repo/my-app',
        LOG_LEVEL: 'debug',
        IMPORT_STYLE: 'ngmodule',
      }),
    ).toEqual({
      angularProjectPath: '/repo/my-app',
      logLevel: 'debug',
      importStyle: 'ngmodule',
    });
  });

  it('falls back to defaults on unrecognized LOG_LEVEL/IMPORT_STYLE values', () => {
    expect(
      loadConfig({
        LOG_LEVEL: 'verbose',
        IMPORT_STYLE: 'weird',
      }),
    ).toEqual({ logLevel: 'info', importStyle: 'standalone' });
  });

  it('treats an empty ANGULAR_PROJECT_PATH as unset', () => {
    expect(loadConfig({ ANGULAR_PROJECT_PATH: '' })).toEqual({
      logLevel: 'info',
      importStyle: 'standalone',
    });
  });
});
