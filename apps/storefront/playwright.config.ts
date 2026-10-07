import { defineConfig, devices } from "@playwright/test"
import fs from "node:fs"
import path from "node:path"

// The suite's settings live in .env.e2e (copy .env.e2e.template). Node reads
// it itself, so no dotenv dependency is needed.
const envFile = path.join(__dirname, ".env.e2e")

if (fs.existsSync(envFile)) {
  // Node 22 has loadEnvFile; the starter's pinned @types/node (17) predates it.
  ;(process as typeof process & { loadEnvFile(path: string): void }).loadEnvFile(
    envFile
  )
}

/**
 * End-to-end suite (tasks/todo.md, Phase 2). It runs against already-running
 * dev servers (`npm run dev` at the root, plus `stripe listen`), never against
 * production, and never starts them itself. Each test registers its own
 * customer and places its own orders, so tests don't share state.
 */
export default defineConfig({
  testDir: "./e2e",
  // Checkout steps wait on the backend and Stripe; give each test room.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // One worker: the tests write through one dev backend, and Gmail rate-limits
  // the emails they trigger.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_STOREFRONT_URL || "http://localhost:8000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
