module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ["@typescript-eslint"],
  extends: [
    // 'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    // ecmaFeatures: {
    //   experimentalObjectRestSpread: true,
    // },
  },
  env: {
    node: true,
    es6: true,
    es2017: true,
    // browser: true,
    // jest: true
  },

  // add your custom rules here
  rules: {
    'no-duplicate-imports': 'warn'
  }
}
