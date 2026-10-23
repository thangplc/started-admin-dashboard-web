# create-admin-starter

Tạo dự án admin mới từ **Admin Starter**: Vite · React 19 · TypeScript · TanStack Router · TanStack Query + orval (sinh code từ OpenAPI) · MSW (mock API) · i18n vi/en · đăng nhập JWT có refresh token · shadcn/ui.

```bash
npm create admin-starter@latest my-admin
# hoặc
pnpm create admin-starter my-admin
```

CLI hỏi tên hiển thị của app, có cài dependency và có `git init` hay không, rồi in ra các bước tiếp theo. Dự án mới chạy được ngay với mock API (tài khoản demo `admin@example.com` / `Admin@123`).

## Tuỳ chọn

| Tuỳ chọn           | Ý nghĩa                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `-n, --name <tên>` | Tên hiển thị của app (mặc định: theo tên thư mục)                   |
| `--pm <tên>`       | `npm` \| `pnpm` \| `yarn` \| `bun` (mặc định: trình đang chạy lệnh) |
| `--no-install`     | Không cài dependency                                                |
| `--no-git`         | Không chạy `git init`                                               |
| `-y, --yes`        | Không hỏi, dùng mặc định                                            |
| `-f, --force`      | Ghi vào thư mục đã có file                                          |

Với `npm create`, các tuỳ chọn phải đứng sau `--`: `npm create admin-starter@latest my-admin -- --yes --no-git`.

## Phát triển

Template được copy từ repo starter lúc publish (`prepack` → `scripts/sync-template.mjs`). `npm run smoke` sinh một dự án thật vào thư mục tạm, cài đặt rồi chạy `check` + `build` của nó.
