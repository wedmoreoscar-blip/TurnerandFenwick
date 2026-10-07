/** Reads the suite's settings from .env.e2e (see .env.e2e.template). */
function required(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `${name} is not set. Copy apps/storefront/.env.e2e.template to .env.e2e and fill it in.`
    )
  }

  return value
}

export const env = {
  get backendUrl() {
    return process.env.E2E_BACKEND_URL || "http://localhost:9000"
  },
  get countryCode() {
    return process.env.E2E_COUNTRY_CODE || "gb"
  },
  get adminEmail() {
    return required("E2E_ADMIN_EMAIL")
  },
  get adminPassword() {
    return required("E2E_ADMIN_PASSWORD")
  },
  get email() {
    return required("E2E_EMAIL")
  },
}

/** A fresh plus-address of E2E_EMAIL, so every test has its own customer. */
export function uniqueEmail(label: string): string {
  const [local, domain] = env.email.split("@")
  const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`

  return `${local}+e2e-${label}-${stamp}@${domain}`
}

/** A storefront path in the test region, for example /gb/store. */
export function path(route: string): string {
  return `/${env.countryCode}${route}`
}
