module.exports = {
    globals: {
     'ts-jest': {
      tsConfig: 'tsconfig.json'
     }
    },
    moduleFileExtensions: [
     'ts',
     'js',
     'json'
    ],
    transform: {
     '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    testRegex: [
     'src/.*\.test\.ts'
    ],
    testEnvironment: 'node',
    globalSetup: './jest.global-setup.ts', // optional: will be called once before all tests are executed
   };
