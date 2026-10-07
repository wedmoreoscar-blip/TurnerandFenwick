import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { passwordResetEmail } from '../emails/account-links'
import { getAdminUrl, getStoreName, getStorefrontUrl, withQuery } from '../emails/context'

/**
 * Emails a password-reset link. Customers go to the storefront's /reset-password page; admin users
 * (Ben, Oscar) go to the admin's own /app/reset-password page.
 *
 * The link is also stored in the notification's `data` so the end-to-end suite can follow it
 * (docs/decisions.md, "Phase 2 settings"). The token is single-use and expires in 15 minutes.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const { entity_id: email, actor_type: actorType, token } = data

  const baseUrl = actorType === 'customer' ? getStorefrontUrl(container) : getAdminUrl(container)
  const resetUrl = withQuery(`${baseUrl}/reset-password`, { token, email })

  await notificationModuleService.createNotifications({
    to: email,
    channel: 'email',
    template: 'password-reset',
    content: passwordResetEmail({ storeName: await getStoreName(container), resetUrl }),
    data: { actor_type: actorType, reset_url: resetUrl },
    trigger_type: 'auth.password_reset',
  })
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
