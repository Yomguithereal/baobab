module.exports = {
  extends: [
    '@yomguithereal/eslint-config/es6'
  ].map(require.resolve),
  rules: {
    'no-loop-func': 0
  }
};
