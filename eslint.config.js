import defineEslint from '@antfu/eslint-config'

export default defineEslint({
  vue: false,
  react: true,
  ignores: [
    'out',
    'dist',
    'node_modules',
    '*.json',
  ],
  rules: {
    'ts/consistent-type-imports': 'off', // MUST be disabled! This rule breaks Nestjs DI by importing type instead of class
    'no-console': 'off', // console one ♥ >:)
    'style/object-curly-spacing': ['error', 'never'], // make all braces consistent
    'style/block-spacing': ['error', 'never'],
    'style/jsx-one-expression-per-line': ['error', {allow: 'literal'}], // "none"|"literal"|"single-child"|"non-jsx"
  },
})
