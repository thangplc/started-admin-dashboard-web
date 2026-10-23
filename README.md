# Admin Starter

Source code mẫu cho các dự án admin/dashboard: Vite · React 19 · TypeScript · TanStack Router · Tailwind v4 · shadcn/ui (component từ Base-FE-Components).

## Bắt đầu

```bash
npm install
cp .env.example .env.local
npm run dev            # http://localhost:5173
```

Mặc định `VITE_ENABLE_MOCK=true`: mọi API call được MSW trả lời, không cần backend. Tài khoản demo của mock: `admin@example.com` / `Admin@123`.

Mock chạy **trong trang** (patch `fetch`), không qua Service Worker: request mock không hiện ở tab Network mà được ghi ra Console (`[MSW] GET /api/users (200 OK)`). Dữ liệu user của mock reset mỗi lần tải lại trang; phiên đăng nhập thì được giữ lại.

<!-- cli:start -->

## Tạo dự án mới từ starter này (CLI)

CLI nằm ở [`packages/create-admin-starter`](packages/create-admin-starter). Khi publish, starter được đóng gói sẵn vào CLI, nên tạo dự án không cần mạng (trừ lúc cài dependency).

```bash
npm create admin-starter@latest my-admin
```

CLI hỏi tên app, có cài dependency và có `git init` hay không. Bỏ qua các câu hỏi bằng `--yes`; xem mọi tuỳ chọn bằng `--help`.

Khi phát triển CLI trong repo này:

| Lệnh                                                     | Việc                                                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm --prefix packages/create-admin-starter install`     | Cài dependency của CLI (một lần)                                                            |
| `npm run cli:sync`                                       | Copy starter vào `packages/create-admin-starter/template`                                   |
| `node packages/create-admin-starter/index.mjs ../my-app` | Chạy thử CLI (sau `cli:sync`)                                                               |
| `npm run cli:smoke`                                      | Sinh dự án vào thư mục tạm, cài đặt, chạy `check` + `build` của nó (chạy trước khi publish) |

- File nào được đưa vào template là một danh sách cụ thể trong `scripts/sync-template.mjs`. Thêm file mới ở root mà muốn có trong dự án sinh ra thì thêm vào danh sách đó.
- Phần README nằm giữa hai comment `cli:start` / `cli:end` (chính mục này), các script `cli:*`, và các dòng ignore có chữ `create-admin-starter` đều bị bỏ khi sync.
- Publish: `cd packages/create-admin-starter && npm publish` (`prepack` tự sync). Muốn đổi tên lệnh, sửa `name` và `bin` trong `package.json` của CLI.

<!-- cli:end -->

## Scripts

| Lệnh                                  | Việc                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `npm run dev`                         | Chạy dev server                                          |
| `npm run build`                       | Typecheck và build production vào `dist/`                |
| `npm run check`                       | Typecheck + lint + kiểm tra format (chạy trước khi push) |
| `npm run lint:fix` / `npm run format` | Tự sửa lỗi lint / format                                 |
| `npm run gen:api`                     | Sinh lại `src/api/generated` từ `openapi/openapi.yaml`   |

## Cấu trúc

```
openapi/openapi.yaml       # HỢP ĐỒNG API giữa FE và BE
orval.config.ts            # cấu hình sinh code từ spec
src/
├── main.tsx               # điểm vào: bật mock (nếu có) → Providers + RouterProvider
├── router.tsx             # tạo router, đăng ký type cho <Link to>
├── routes/                # mỗi file = một route (TanStack Router file-based)
│   ├── __root.tsx         # gốc: trang 404, devtools
│   ├── login.tsx          # trang đăng nhập (/login?redirect=...)
│   ├── _app.tsx           # layout có sidebar + header + AUTH GUARD
│   └── _app/
│       ├── index.tsx      # "/" dashboard (?months=6|12)
│       ├── -dashboard/    # thẻ số liệu, biểu đồ, danh sách của dashboard
│       └── users/
│           ├── route.tsx  # layout nhóm: breadcrumb "Người dùng"
│           ├── index.tsx  # "/users" danh sách, mọi trạng thái nằm trên URL
│           ├── new.tsx    # "/users/new" tạo mới
│           ├── $userId.tsx    # "/users/:id" sửa (404 nếu không có)
│           └── -components/   # user-form, columns... (tiền tố "-" = không phải route)
├── routeTree.gen.ts       # SINH TỰ ĐỘNG từ routes/, không sửa tay
├── api/generated/         # SINH TỰ ĐỘNG bởi orval, không sửa tay
│   ├── model/             # type cho mọi schema
│   ├── users/users.ts     # listUsers(), useListUsers(), useCreateUser()...
│   └── users/users.msw.ts # mock faker (dự phòng)
├── hooks/
│   └── use-data-table-url-state.ts  # DataTable ↔ URL (page, sort, search, filter)
├── lib/
│   ├── format.ts          # số rút gọn, % thay đổi, tháng, ngày theo ngôn ngữ
│   ├── api/api-client.ts  # customFetch: base URL, token, chuẩn hoá lỗi → ApiError
│   ├── api/api-error.ts   # ApiError (status, code, message, fieldErrors)
│   ├── api/token-store.ts # lưu access / refresh token
│   ├── api/session-events.ts  # báo "phiên hết hạn" từ API client lên app
│   ├── api/error-message.ts   # ApiError → câu thông báo đã dịch
│   ├── auth/auth.ts       # signIn, useSignOut, useCurrentUser, hasSession
│   ├── i18n/              # i18next + locales/vi.ts, locales/en.ts
│   ├── forms.ts           # applyServerErrors: lỗi 422 → dưới từng field
│   └── query-client.ts    # TanStack Query: retry, toast lỗi toàn cục
├── mocks/                 # MSW: API giả có state
│   ├── browser.ts         # bật mock trong trang (fetch / XHR)
│   ├── db.ts              # dữ liệu trong bộ nhớ (seed cố định), phiên lưu localStorage
│   └── handlers/          # auth, users, dashboard + fallback từ code sinh ra
├── config/
│   ├── env.ts             # đọc + kiểm tra biến môi trường bằng zod
│   └── site.ts            # tên app, menu sidebar
├── components/
│   ├── ui/                # shadcn base (từ Base-FE-Components)
│   ├── common/            # DataTable, Form*, DatePicker, Combobox... (từ Base-FE-Components)
│   ├── layout/            # AppShell, AppSidebar, AppHeader
│   ├── providers.tsx      # các provider toàn app
│   ├── route-error.tsx    # màn lỗi khi một route lỗi (có nút Thử lại)
│   └── theme-provider.tsx # light / dark / system
├── styles/tokens.css      # design token (màu, radius...)
└── index.css              # Tailwind + import token
```

## Làm việc với API

1. **Sửa spec trước:** thêm hoặc đổi endpoint trong `openapi/openapi.yaml`, thống nhất với BE.
2. **Sinh code:** `npm run gen:api`. Commit cả `src/api/generated` để review thấy API thay đổi gì.
3. **Dùng hook:** `useListUsers(params)`, `useCreateUser()`... từ `@/api/generated/<tag>/<tag>`. Lỗi luôn là `ApiError`.
4. **Mock:** endpoint mới tự có mock faker ngay (dự phòng). Khi cần dữ liệu có nghĩa (lọc, phân trang, validate), viết handler có state trong `src/mocks/handlers/`.
5. **Có backend thật:** đặt `VITE_ENABLE_MOCK=false` và `VITE_API_URL` trỏ tới BE.

## Công thức theo pattern (copy khi làm màn mới)

**Trang danh sách**: [`routes/_app/users/index.tsx`](src/routes/_app/users/index.tsx)

- `validateSearch` (zod) khai báo mọi tham số trên URL. Giá trị sai (`?page=abc`) bị bỏ qua thay vì làm lỗi trang.
- `useDataTableUrlState()` nối DataTable với URL: phân trang, sắp xếp, ô tìm kiếm, filter. Giá trị mặc định không ghi lên URL; đổi search/filter/sort thì về trang 1; nhiều thay đổi cùng lúc gộp làm một lần cập nhật URL.
- `toListParams(search)` dùng chung cho `loader` (prefetch khi hover link) và component, nên cả hai trúng cùng một cache.
- F5, gửi link cho người khác, hay sửa xong quay lại đều giữ đúng trang, bộ lọc, sắp xếp.

**Form tạo/sửa**: [`users/-components/user-form.tsx`](src/routes/_app/users/-components/user-form.tsx)

- Một form dùng chung cho `new.tsx` và `$userId.tsx`. Schema zod giống ràng buộc trong spec, câu báo lỗi theo ngôn ngữ đang chọn.
- Lỗi 422 của server hiện dưới đúng field; lỗi khác hiện trên đầu form.
- Rời trang khi còn thay đổi chưa lưu (bấm link, nút Back, đóng tab) thì hỏi "Rời trang khi chưa lưu?". Nút Lưu bị khoá khi chưa có thay đổi.
- Lưu xong quay về danh sách đúng như lúc rời đi (`history.back()`).
- Trang sửa chờ loader tải user trước khi hiện form; id không tồn tại thì hiện màn 404 riêng.

**Dashboard**: [`routes/_app/index.tsx`](src/routes/_app/index.tsx)

- Số liệu chính là thẻ số (không vẽ biểu đồ cho một con số), có % so với tháng trước.
- Biểu đồ cột một màu (`--chart-1`), có tooltip khi hover và bảng ẩn cho trình đọc màn hình. Màu đã kiểm tra độ tương phản ≥ 3:1 trên nền sáng và tối.
- Bộ lọc khoảng thời gian nằm trên URL (`?months=12`).

**Breadcrumb**: mỗi route khai báo `staticData: { breadcrumb: "<translation key>" }`, header tự ghép thành "Người dùng › Sửa người dùng".

## Đăng nhập (JWT access + refresh token)

- **Guard:** mọi route trong `src/routes/_app/` đều cần đăng nhập. `beforeLoad` ở `_app.tsx` gọi `/auth/me`. Không có token hoặc token hỏng thì chuyển sang `/login?redirect=<trang đang mở>`, đăng nhập xong quay lại đúng trang.
- **Tự refresh:** request nào bị 401 thì `customFetch` gọi `/auth/refresh` rồi gửi lại request. Nhiều request cùng 401 chỉ gây ra một lần refresh.
- **Hết phiên:** refresh cũng thất bại thì xoá token, hiện toast "phiên đã hết hạn" và về `/login`.
- **Lưu token:** hiện để trong localStorage cho đơn giản. Với production, nên để BE trả refresh token trong cookie `httpOnly` và chỉ giữ access token trong bộ nhớ (an toàn hơn trước XSS). Khi đổi chỉ cần sửa `token-store.ts` và `refreshTokens()` trong `api-client.ts`.

## Đa ngôn ngữ (vi / en)

- Chuỗi nằm trong `src/lib/i18n/locales/vi.ts` (nguồn chuẩn) và `en.ts`. Thiếu hoặc thừa key ở `en.ts` là lỗi compile, gõ sai key trong `t("...")` cũng là lỗi compile.
- Ngôn ngữ chọn theo thứ tự: lựa chọn đã lưu → ngôn ngữ trình duyệt → `vi`.
- Text nằm cứng bên trong component của kit (DataTable: "View", "Rows per page"...) chưa được dịch.

## Xử lý lỗi

| Tình huống                                     | Ai xử lý                                               |
| ---------------------------------------------- | ------------------------------------------------------ |
| 401                                            | API client (refresh) → hết phiên thì về /login         |
| 422 khi submit form                            | `applyServerErrors()` hiện lỗi dưới từng field         |
| Mutation lỗi khác (xoá, lưu...)                | Toast tự động (`MutationCache`)                        |
| Query lỗi lần đầu                              | Trang tự hiện trạng thái lỗi + nút Thử lại             |
| Query lỗi khi refetch nền (đang có dữ liệu cũ) | Toast tự động (`QueryCache`)                           |
| Route lỗi khi tải hoặc component crash         | `RouteError`: màn lỗi + Thử lại, sidebar vẫn dùng được |

Tắt toast tự động cho một query/mutation tự hiện lỗi: `meta: { skipErrorToast: true }`.

## Quy ước

- **Thêm trang:** tạo file trong `src/routes/_app/`, ví dụ `reports/index.tsx` → `/reports`. Thêm vào menu ở `src/config/site.ts` (sai đường dẫn là lỗi compile).
- **Biến môi trường:** khai báo ở `.env.example`, `src/config/env.ts` và `src/vite-env.d.ts`. Trong code chỉ đọc qua `env` từ `@/config/env`.
- **Component:** dùng kit có sẵn trong `components/common` và `components/ui` trước khi tự viết. Thêm shadcn component: `npx shadcn@latest add <tên>`.
- **Style:** chỉ dùng class theo token (`bg-primary`, `text-muted-foreground`...), không dùng mã màu cứng.
- **Commit:** theo Conventional Commits (`feat: ...`, `fix: ...`). Husky chạy lint-staged trước commit và commitlint kiểm tra message (cần `git init` trước rồi `npm install`).
