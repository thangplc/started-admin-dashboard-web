import { z } from "zod"

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true")

const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default("Admin Starter"),
  VITE_API_URL: z.url(),
  VITE_ENABLE_MOCK: booleanString,
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // Fail fast at startup instead of with a confusing error deep in the app.
  throw new Error(
    `Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`
  )
}

/** Typed, validated env. Read config from here, never from `import.meta.env` directly. */
export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiUrl: parsed.data.VITE_API_URL,
  enableMock: parsed.data.VITE_ENABLE_MOCK,
  isDev: import.meta.env.DEV,
}
