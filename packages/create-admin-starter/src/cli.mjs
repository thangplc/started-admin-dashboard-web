import { existsSync, readFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import * as p from "@clack/prompts"
import pc from "picocolors"

import {
  detectPackageManager,
  hasGitIdentity,
  isEmptyDir,
  run,
  scaffold,
  toPackageName,
  toTitle,
  validatePackageName,
} from "./scaffold.mjs"

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const templateDir = join(packageDir, "template")
const { version } = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"))

const HELP = `
${pc.bold("create-admin-starter")} ${pc.dim(`v${version}`)}

Tạo dự án admin mới từ Admin Starter.

${pc.bold("Cách dùng")}
  npm create admin-starter@latest [thư-mục] [-- các tuỳ chọn]

${pc.bold("Tuỳ chọn")}
  -n, --name <tên>     Tên hiển thị của app (mặc định: theo tên thư mục)
      --pm <tên>       npm | pnpm | yarn | bun (mặc định: trình đang chạy lệnh)
      --no-install     Không cài dependency
      --no-git         Không chạy git init
  -y, --yes            Không hỏi, dùng mặc định cho mọi câu
  -f, --force          Ghi vào thư mục đã có file
  -h, --help           Hiện hướng dẫn này
  -v, --version        Hiện phiên bản
`

const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"]

/** Stops cleanly on Ctrl+C / Esc in any prompt. */
function unlessCancelled(value) {
  if (p.isCancel(value)) {
    p.cancel("Đã huỷ.")
    process.exit(0)
  }
  return value
}

function fail(message) {
  p.cancel(message)
  process.exit(1)
}

export async function main(argv = process.argv.slice(2)) {
  const { values: flags, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      name: { type: "string", short: "n" },
      pm: { type: "string" },
      install: { type: "boolean", default: true },
      git: { type: "boolean", default: true },
      yes: { type: "boolean", short: "y", default: false },
      force: { type: "boolean", short: "f", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  })

  if (flags.help) return console.log(HELP)
  if (flags.version) return console.log(version)

  if (!existsSync(templateDir)) {
    fail(
      `Không thấy template tại ${templateDir}. Chạy "npm run sync" trong packages/create-admin-starter.`
    )
  }

  const packageManager = flags.pm ?? detectPackageManager()
  if (!PACKAGE_MANAGERS.includes(packageManager)) {
    fail(`--pm phải là một trong: ${PACKAGE_MANAGERS.join(", ")}.`)
  }

  p.intro(`${pc.bgCyan(pc.black(" create-admin-starter "))} ${pc.dim(`v${version}`)}`)

  // 1. Folder (and npm package name)
  let targetDir = positionals[0]
  if (!targetDir) {
    targetDir = flags.yes
      ? "admin-app"
      : unlessCancelled(
          await p.text({
            message: "Tạo dự án ở thư mục nào?",
            placeholder: "admin-app",
            defaultValue: "admin-app",
            validate: (value) => validatePackageName(toPackageName(value || "admin-app")),
          })
        )
  }
  const targetPath = resolve(targetDir)
  const packageName = toPackageName(targetDir)
  const nameError = validatePackageName(packageName)
  if (nameError) fail(`Tên thư mục "${packageName}" không dùng được: ${nameError}`)

  if (!(await isEmptyDir(targetPath)) && !flags.force) {
    if (flags.yes) fail(`Thư mục ${targetDir} đã có file. Dùng --force để ghi đè.`)
    const overwrite = unlessCancelled(
      await p.confirm({
        message: `Thư mục ${pc.cyan(targetDir)} đã có file. Vẫn ghi vào (file trùng tên sẽ bị thay)?`,
        initialValue: false,
      })
    )
    if (!overwrite) return p.cancel("Đã huỷ, không thay đổi gì.")
  }

  // 2. Display name
  const appName =
    flags.name ??
    (flags.yes
      ? toTitle(packageName)
      : unlessCancelled(
          await p.text({
            message: "Tên hiển thị của app (sidebar, tab trình duyệt)?",
            placeholder: toTitle(packageName),
            defaultValue: toTitle(packageName),
          })
        ))

  // 3. Install / git
  const install =
    flags.yes || !flags.install
      ? flags.install
      : unlessCancelled(
          await p.confirm({ message: `Cài dependency bằng ${pc.cyan(packageManager)}?` })
        )
  const git =
    flags.yes || !flags.git
      ? flags.git
      : unlessCancelled(await p.confirm({ message: "Khởi tạo git repository?" }))

  // Work
  const spin = p.spinner()
  spin.start("Đang copy template")
  await scaffold({ templateDir, targetDir: targetPath, packageName, appName, packageManager })
  spin.stop("Đã tạo dự án")

  // git init before installing, so husky's "prepare" script can set up the hooks.
  if (git) {
    try {
      await run("git", ["init", "-q"], { cwd: targetPath })
    } catch {
      p.log.warn("Không chạy được git init (máy chưa có git?). Bỏ qua bước git.")
    }
  }

  let installed = false
  if (install) {
    spin.start(`Đang cài dependency bằng ${packageManager} (có thể mất 1–2 phút)`)
    try {
      await run(packageManager, ["install"], { cwd: targetPath })
      installed = true
      spin.stop("Đã cài dependency")
    } catch (error) {
      spin.error("Cài dependency thất bại")
      p.log.message(
        pc.dim(
          String(error.output ?? error.message)
            .trim()
            .split("\n")
            .slice(-15)
            .join("\n")
        )
      )
    }
  }

  if (git && existsSync(join(targetPath, ".git"))) {
    if (await hasGitIdentity(targetPath)) {
      try {
        await run("git", ["add", "-A"], { cwd: targetPath })
        // --no-verify: the hooks would lint the whole template on the very first commit.
        await run(
          "git",
          ["commit", "-q", "--no-verify", "-m", "chore: initial commit from create-admin-starter"],
          { cwd: targetPath }
        )
        p.log.success("Đã tạo commit đầu tiên")
      } catch {
        p.log.warn("Không tạo được commit đầu tiên. Bạn có thể tự commit sau.")
      }
    } else {
      p.log.warn("Đã git init nhưng chưa commit: máy chưa cấu hình git user.name / user.email.")
    }
  }

  const runScript = packageManager === "npm" ? "npm run" : packageManager
  const steps = [
    targetPath !== process.cwd() && `cd ${relative(process.cwd(), targetPath) || "."}`,
    !installed && `${packageManager} install`,
    `${runScript} dev`,
  ].filter(Boolean)

  p.note(
    [
      ...steps.map((step) => pc.cyan(step)),
      "",
      `Mở ${pc.underline("http://localhost:5173")}, đăng nhập mock: ${pc.bold("admin@example.com")} / ${pc.bold("Admin@123")}`,
      `Có backend thật: sửa ${pc.cyan(".env.local")} (VITE_ENABLE_MOCK=false, VITE_API_URL=...)`,
    ].join("\n"),
    "Bước tiếp theo"
  )
  p.outro(`Xong! Đọc ${pc.cyan("README.md")} để biết cấu trúc và quy ước của dự án.`)
}
