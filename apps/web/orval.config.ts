import { defineConfig } from "orval"

export default defineConfig({
  lighthouse: {
    output: {
      mode: "single",
      target: "./src/api/generated/lighthouse.ts",
      schemas: "./src/api/generated/model",
      client: "react-query",
      mock: false,
      formatter: "prettier",
      clean: true,
      override: {
        mutator: {
          path: "./src/api/custom-fetch.ts",
          name: "customFetch",
        },
      },
    },
    input: {
      target: "../../packages/api/openapi.json",
    },
  },
})
