// File-system and process helpers. No prompts here, so the smoke test can call them directly.

import { spawn } from "node:child_process"
import { cp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises"
import { basename, join, resolve } from "node:path"

/** npm package-name rules that matter for a new folder: lowercase, url-safe, ≤ 214 chars. */
export function validatePackageName(name) {
  if (!name) return "Tên không được để trống."
  if (name.length > 214) return "Tên quá dài (tối đa 214 ký tự)."
  if (!/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name)) {
    return "Chỉ dùng chữ thường, số, '-', '.', '_' (ví dụ: my-admin)."
  }
  return undefined
}

/** "./apps/My Admin" → "my-admin" */
export function toPackageName(targetDir) {
  return basename(resolve(targetDir))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-~._]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-._]+|-+$/g, "")
}

/** "my-admin" → "My Admin" (default display name). */
export function toTitle(packageName) {
  return packageName
    .replace(/^@.*\//, "")
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ")
}

/** The package manager that launched us (`npm create`, `pnpm create`...), defaulting to npm. */
export function detectPackageManager() {
  const agent = process.env.npm_config_user_agent ?? ""
  for (const name of ["pnpm", "yarn", "bun"]) {
    if (agent.startsWith(name)) return name
  }
  return "npm"
}

export async function isEmptyDir(path) {
  try {
    const entries = await readdir(path)
    return entries.every((entry) => entry === ".git" || entry === ".DS_Store")
  } catch (error) {
    if (error.code === "ENOENT") return true
    throw error
  }
}

async function editFile(path, edit) {
  const content = await readFile(path, "utf8")
  await writeFile(path, edit(content))
}

/**
 * Copies the template into `targetDir` and makes it the user's project:
 * names, title, env files, lockfile for the chosen package manager.
 */
export async function scaffold({ templateDir, targetDir, packageName, appName, packageManager }) {
  await cp(templateDir, targetDir, { recursive: true, force: true })
  await rename(join(targetDir, "_gitignore"), join(targetDir, ".gitignore"))

  await editFile(join(targetDir, "package.json"), (content) => {
    const packageJson = JSON.parse(content)
    packageJson.name = packageName
    packageJson.version = "0.1.0"
    return `${JSON.stringify(packageJson, null, 2)}\n`
  })

  // Characters that would break the HTML title or the .env line are dropped.
  const safeTitle = appName.replace(/[<>&"]/g, "")
  await editFile(join(targetDir, "index.html"), (content) =>
    content.replace(/<title>.*<\/title>/, `<title>${safeTitle}</title>`)
  )
  await editFile(join(targetDir, ".env.example"), (content) =>
    content.replace(/^VITE_APP_NAME=.*$/m, `VITE_APP_NAME=${safeTitle}`)
  )
  await editFile(join(targetDir, "README.md"), (content) =>
    content.replace(/^# .*$/m, `# ${safeTitle}`)
  )

  // Ready to run: the same values as the example, which point at the mock API.
  await cp(join(targetDir, ".env.example"), join(targetDir, ".env.local"))

  // package-lock.json only helps npm; other managers would warn about it.
  if (packageManager !== "npm") await rm(join(targetDir, "package-lock.json"), { force: true })
}

/** Runs a command; resolves with its output, rejects with the output attached. */
export function run(command, args, { cwd, env } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      shell: process.platform === "win32",
    })
    let output = ""
    child.stdout?.on("data", (chunk) => (output += chunk))
    child.stderr?.on("data", (chunk) => (output += chunk))
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolvePromise(output)
      else
        reject(
          Object.assign(new Error(`${command} ${args.join(" ")} exited with ${code}`), { output })
        )
    })
  })
}

/** True when `git commit` can work (user.name and user.email are set). */
export async function hasGitIdentity(cwd) {
  try {
    await run("git", ["config", "user.name"], { cwd })
    await run("git", ["config", "user.email"], { cwd })
    return true
  } catch {
    return false
  }
}
