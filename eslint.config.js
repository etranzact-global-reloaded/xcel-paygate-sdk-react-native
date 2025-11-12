// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // Allow unresolved imports for peer dependencies and example app dependencies
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '^react$',
            '^react-native$',
            '^@react-navigation/',
            '^expo-',
            '^react-native-reanimated$',
            '^@/',
          ],
        },
      ],
    },
  },
]);
