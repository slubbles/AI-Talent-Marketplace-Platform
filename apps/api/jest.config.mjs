/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@atm/shared$": "<rootDir>/../../packages/shared/src/index.ts"
  },
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "ESNext",
        moduleResolution: "Bundler",
        rootDir: ".",
        outDir: undefined,
        noEmit: true
      }
    }]
  },
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"]
};

export default config;
