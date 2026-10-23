/** @type {import("prettier").Config} */
export default {
  semi: false,
  singleQuote: false,
  trailingComma: "es5",
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/index.css",
  tailwindFunctions: ["cn", "cva"],
}
