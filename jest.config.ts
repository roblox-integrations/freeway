import type {Config} from 'jest'

export default async (): Promise<Config> => {
  return {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*(\\.e2e-spec|\\.spec)\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': '@swc/jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
  }
}
