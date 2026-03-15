/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: { "@/*": ["./*"] },
        baseUrl: "."
      }
    }]
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@atm/shared$": "<rootDir>/../../packages/shared/src/index.ts"
  },
  testMatch: ["<rootDir>/**/*.test.ts", "<rootDir>/**/*.test.tsx"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"]
};

export default config;
