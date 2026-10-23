#!/usr/bin/env node
// Copies the starter (the repo root) into ./template, the folder the CLI copies from.
// Runs before `npm pack` / `npm publish` (prepack) and before the smoke test.
//
// What gets copied is an explicit list, not "everything minus some": a new file at the
// root (secrets, editor config, build output) never ends up in the template by accident.

import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { run } from "../src/scaffold.mjs"

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const starterDir = join(packageDir, "..", "..")
const templateDir = join(packageDir, "template")

/** Paths relative to the starter root. Add new top-level files here. */
const INCLUDE = [
  ".editorconfig",
  ".env.example",
  ".gitignore",
  ".husky",
  ".lintstagedrc.json",
  ".prettierignore",
  "README.md",
  "commitlint.config.js",
  "components.json",
  "eslint.config.js",
  "index.html",
  "openapi",
  "orval.config.ts",
  "package.json",
  "package-lock.json",
  "prettier.config.js",
  "public",
  "src",
  "tsconfig.json",
  "tsconfig.app.json",
  "tsconfig.node.json",
  "vite.config.ts",
]

await rm(templateDir, { recursive: true, force: true })
await mkdir(templateDir, { recursive: true })

for (const path of INCLUDE) {
  await cp(join(starterDir, path), join(templateDir, path), { recursive: true })
}

// npm never publishes a file named .gitignore (it would silently vanish from the package),
// so it travels as _gitignore and the CLI renames it back.
await rename(join(templateDir, ".gitignore"), join(templateDir, "_gitignore"))

// Config lines that exist only for working on this CLI inside the starter repo
// (ignore rules for packages/create-admin-starter/...) don't belong in generated projects.
for (const file of ["_gitignore", ".prettierignore", "eslint.config.js"]) {
  const path = join(templateDir, file)
  const content = await readFile(path, "utf8")
  await writeFile(
    path,
    content
      .split("\n")
      .filter((line) => !line.includes("create-admin-starter"))
      .join("\n")
  )
}

// The starter's own scripts for working on this CLI don't belong in generated projects.
const packageJsonPath = join(templateDir, "package.json")
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"))
packageJson.scripts = Object.fromEntries(
  Object.entries(packageJson.scripts).filter(([name]) => !name.startsWith("cli:"))
)
await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`)

// README sections about the CLI itself are wrapped in <!-- cli:start --> ... <!-- cli:end -->.
const readmePath = join(templateDir, "README.md")
const readme = await readFile(readmePath, "utf8")
await writeFile(
  readmePath,
  readme.replace(/\n?<!-- cli:start -->[\s\S]*?<!-- cli:end -->\n?/g, "\n")
)

// Removing lines can leave files prettier would now lay out differently (a shorter array fits
// on one line, a doubled blank line in the README): reformat with the starter's own prettier
// so `npm run check` passes in generated projects.
// The root .prettierignore skips template/, so use the template's own ignore file instead.
await run(
  "npx",
  [
    "prettier",
    "--write",
    "--log-level",
    "warn",
    "--ignore-path",
    join(templateDir, ".prettierignore"),
    join(templateDir, "eslint.config.js"),
    join(templateDir, "README.md"),
  ],
  { cwd: starterDir }
)

console.log(`Template synced: ${INCLUDE.length} entries → ${templateDir}`)
