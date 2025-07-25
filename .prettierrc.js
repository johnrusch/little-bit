module.exports = {
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  semi: true,
  printWidth: 100,
  endOfLine: 'lf',
  arrowParens: 'avoid',
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200
      }
    }
  ]
};