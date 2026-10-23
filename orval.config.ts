import { defineConfig } from "orval"

// `npm run gen:api` reads the contract and writes src/api/generated/:
//   <tag>/<tag>.ts       request functions + TanStack Query hooks
//   <tag>/<tag>.msw.ts   MSW handlers with faker data (fallback mocks)
//   model/               TypeScript types for every schema
export default defineConfig({
  api: {
    input: { target: "./openapi/openapi.yaml" },
    output: {
      target: "./src/api/generated",
      schemas: "./src/api/generated/model",
      mode: "tags-split",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      formatter: "prettier",
      mock: { generators: [{ type: "msw", delay: 400, useExamples: true }] },
      override: {
        mutator: { path: "./src/lib/api/api-client.ts", name: "customFetch" },
        // Hooks resolve with the body itself, not { data, status, headers }.
        fetch: { includeHttpResponseReturnType: false },
        // GET → useQuery hooks, other methods → useMutation hooks (orval defaults).
        query: { signal: true },
      },
    },
  },
})
