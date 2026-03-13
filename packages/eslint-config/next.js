const js = require("@eslint/js")
const { FlatCompat } = require("@eslint/eslintrc")
const globals = require("globals")
const tseslint = require("typescript-eslint")
const prettier = require("eslint-config-prettier")
const nextPlugin = require("@next/eslint-plugin-next")

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  ...compat.extends("eslint-config-turbo"),
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        React: "writable",
        JSX: "writable",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["*.js"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["*.ts", "*.tsx"],
    rules: {
      "no-undef": "off",
    },
  },
  {
    ignores: [".*.js", "node_modules/", "dist/", "**/node_modules/", "**/dist/", ".next/"],
  },
]
