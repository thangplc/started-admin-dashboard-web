#!/usr/bin/env node
// End-to-end check of the CLI: sync the template, generate a project into a temp folder
// with the real CLI, install it, then run the generated project's own check + build.
// A template that only works inside this repo fails here, not in someone's new project.

import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { run } from "../src/scaffold.mjs"

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const workDir = await mkdtemp(join(tmpdir(), "create-admin-starter-"))
const projectDir = join(workDir, "smoke-app")
const keep = process.argv.includes("--keep")

const step = async (label, fn) => {
  const started = Date.now()
  process.stdout.write(`• ${label}... `)
  try {
    await fn()
    console.log(`ok (${((Date.now() - started) / 1000).toFixed(1)}s)`)
  } catch (error) {
    console.log("FAILED")
    if (error.output) console.error(error.output.split("\n").slice(-40).join("\n"))
    throw error
  }
}

try {
  await step("sync template", () => run("node", ["scripts/sync-template.mjs"], { cwd: packageDir }))

  await step("generate project", () =>
    run(
      "node",
      [
        join(packageDir, "index.mjs"),
        "smoke-app",
        "--yes",
        "--no-git",
        "--pm",
        "npm",
        "--name",
        "Smoke Admin",
      ],
      {
        cwd: workDir,
      }
    )
  )

  await step("generated files", async () => {
    const read = (path) => readFileSync(join(projectDir, path), "utf8")
    assert.ok(existsSync(join(projectDir, ".gitignore")), ".gitignore restored")
    assert.ok(!existsSync(join(projectDir, "_gitignore")), "_gitignore renamed")
    assert.ok(existsSync(join(projectDir, ".env.local")), ".env.local created")
    const packageJson = JSON.parse(read("package.json"))
    assert.equal(packageJson.name, "smoke-app")
    assert.equal(packageJson.version, "0.1.0")
    assert.ok(
      !Object.keys(packageJson.scripts).some((name) => name.startsWith("cli:")),
      "no cli: scripts"
    )
    assert.match(read("index.html"), /<title>Smoke Admin<\/title>/)
    assert.match(read(".env.example"), /^VITE_APP_NAME=Smoke Admin$/m)
    assert.match(read("README.md"), /^# Smoke Admin$/m)
    assert.doesNotMatch(read("README.md"), /cli:start|create-admin-starter/)
    assert.ok(existsSync(join(projectDir, "node_modules")), "dependencies installed")
  })

  await step("npm run check (typecheck + lint + format)", () =>
    run("npm", ["run", "check"], { cwd: projectDir })
  )
  await step("npm run build", () => run("npm", ["run", "build"], { cwd: projectDir }))

  console.log(`\nSmoke test passed.${keep ? ` Project kept at ${projectDir}` : ""}`)
} finally {
  if (!keep) await rm(workDir, { recursive: true, force: true })
}
