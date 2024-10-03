module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/dist/', '/node_modules/', '/public/'],
  collectCoverageFrom: [
    'src/render/components/**/*.ts(x)?',
    'src/render/contexts/**/*.ts(x)?',
    'src/render/hooks/**/*.ts(x)?',
    'src/render/pages/**/*.ts(x)?',
    'src/render/providers/**/*.ts(x)?',
    '!src/render/**/index.ts',
    '!src/render/main.tsx',
    '!src/render/vite-env.d.ts'
  ],
  modulePaths: ['<rootDir>/src/'],
  setupFilesAfterEnv: ['<rootDir>/.jest/setup.ts'],
  transform: {
    '^.+\\.tsx?$': 'babel-jest'
  },
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/render/$1'
  },
  coverageThreshold: {
    global: {
      statements: -10,
      branches: 100,
      functions: 100,
      lines: 100
    }
  }
}
