import Medusa from "@medusajs/js-sdk"
import { expect } from "@playwright/test"
import { env } from "./env"

/**
 * Emails are checked through Medusa's notification records, read with the
 * suite's admin user (docs/decisions.md, "Phase 2 settings"). Status `success`
 * means the SMTP provider handed the message to Gmail. Reset and verification
 * emails also carry their link in `data`, which is how tests follow them.
 */
type Notification = {
  id: string
  to: string
  template: string | null
  status: string
  data: Record<string, unknown> | null
  created_at: string
}

let admin: Medusa | undefined

async function adminSdk(): Promise<Medusa> {
  if (!admin) {
    admin = new Medusa({
      baseUrl: env.backendUrl,
      auth: { type: "jwt", jwtTokenStorageMethod: "memory" },
    })
    await admin.auth.login("user", "emailpass", {
      email: env.adminEmail,
      password: env.adminPassword,
    })
  }

  return admin
}

async function listEmails(to: string): Promise<Notification[]> {
  const sdk = await adminSdk()
  const { notifications } = await sdk.client.fetch<{
    notifications: Notification[]
  }>("/admin/notifications", {
    query: {
      to,
      channel: "email",
      fields: "id,to,template,status,data,created_at",
      order: "-created_at",
    },
  })

  return notifications
}

/**
 * Waits for the newest email with `template` sent to `to`, and checks it was
 * handed to the mail server. Every test uses its own address, so the newest
 * one is the one the test triggered. Subscribers run after the request that
 * triggered them returns, so this polls.
 */
export async function waitForEmail(
  to: string,
  template: string
): Promise<Notification> {
  let found: Notification | undefined

  await expect
    .poll(
      async () => {
        found = (await listEmails(to)).find(
          (notification) => notification.template === template
        )
        return found?.status
      },
      {
        message: `"${template}" email to ${to}`,
        timeout: 60_000,
        intervals: [1_000, 2_000, 5_000],
      }
    )
    .toBe("success")

  return found!
}

/** The link stored in an email's data, for example `reset_url`. */
export function linkFrom(notification: Notification, key: string): string {
  const link = notification.data?.[key]

  if (typeof link !== "string") {
    throw new Error(`Email ${notification.id} has no ${key} in its data.`)
  }

  return link
}
