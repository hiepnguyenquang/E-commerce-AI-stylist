const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * Cấu hình ESLint chuẩn cho Internal React Components
 * Không chứa các luật riêng của Next.js
 */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "react"],
  parser: "@typescript-eslint/parser",
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    browser: true,
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
    react: {
      version: "detect",
    },
  },
  ignorePatterns: [
    // Bỏ qua các thư mục không cần thiết
    ".*.js",
    "node_modules/",
    "dist/",
  ],
  rules: {
    "react/react-in-jsx-scope": "off", 
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
