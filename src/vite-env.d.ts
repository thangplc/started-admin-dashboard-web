/// <reference types="vite/client" />

// Keep in sync with src/config/env.ts and .env.example.
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_MOCK?: "true" | "false"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
