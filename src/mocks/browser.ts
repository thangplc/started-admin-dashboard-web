import { FetchInterceptor } from "@mswjs/interceptors/fetch"
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest"
import { defineNetwork, InterceptorSource } from "msw/experimental"

import { handlers } from "./handlers"

/**
 * In-page mocking: fetch / XHR are patched in this tab (what MSW itself calls "fallback mode").
 *
 * Deliberately not MSW's Service Worker: the browser stops idle workers (any tab left in the
 * background for a while), and on restart MSW's worker has forgotten which tabs it mocks,
 * so every request silently goes to the real network ("cannot reach the server").
 * Trade-off: mocked calls don't show in the Network tab; each one is logged in the console.
 *
 * `msw/experimental` is why msw is pinned with "~" in package.json: check this file when
 * upgrading.
 */
const network = defineNetwork({
  sources: [
    new InterceptorSource({
      interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
    }),
  ],
  handlers,
  // Assets, Vite HMR, other hosts: let them through untouched.
  onUnhandledFrame: "bypass",
  context: { quiet: false },
})

/** Starts the mock API. */
export function startMocking() {
  network.enable()
  console.info("[MSW] Mock API enabled (in-page). Turn off with VITE_ENABLE_MOCK=false.")
}
