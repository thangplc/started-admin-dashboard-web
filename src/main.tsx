import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "@tanstack/react-router"

import { Providers } from "@/components/providers"
import { env } from "@/config/env"
import "@/lib/i18n"
import { router } from "@/router"
import "./index.css"

/** With VITE_ENABLE_MOCK=true, answer API calls from src/mocks before the app makes any. */
async function enableMocking() {
  if (!env.enableMock) return
  const { startMocking } = await import("@/mocks/browser")
  await startMocking()
}

await enableMocking()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </StrictMode>
)
