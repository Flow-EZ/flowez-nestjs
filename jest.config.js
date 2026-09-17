/** @type {import('jest').Config} */
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/packages/*/lib/**/*.spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'nodenext',
          moduleResolution: 'nodenext',
          target: 'ES2022',
          rootDir: '.',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          isolatedModules: true,
          esModuleInterop: true,
          strictNullChecks: true,
          types: ['jest', 'node'],
        },
      },
    ],
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    'packages/*/lib/**/*.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
  ],
};
