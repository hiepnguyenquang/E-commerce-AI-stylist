const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/*
 * Cấu hình ESLint chuẩn cho Next.js 14
 */
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "next/core-web-vitals",
    "prettier",
  ],
  plugins: ["@typescript-eslint", "react"],
  parser: "@typescript-eslint/parser",
  globals: {
    React: true,
    JSX: true,
  },
  env: {
    node: true,
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
    ".next/",
    "dist/",
  ],
  rules: {
    "react/react-in-jsx-scope": "off", // Next.js 14 không cần import React
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
