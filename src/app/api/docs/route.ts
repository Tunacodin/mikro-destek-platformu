import { ApiReference } from "@scalar/nextjs-api-reference"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = (ApiReference as any)({
  spec: { url: "/openapi.json" },
  pageTitle: "MDF API Dokümantasyonu",
  theme: "default",
  customCss: `
    :root {
      --scalar-color-1: #212121;
      --scalar-color-accent: #fab758;
      --scalar-background-1: #ffffff;
      --scalar-background-2: #f6f7f9;
    }
    .light-mode .scalar-app {
      font-family: system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
  `,
})
