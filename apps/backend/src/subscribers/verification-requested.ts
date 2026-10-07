import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { Modules } from '@medusajs/framework/utils'
import { emailVerificationEmail } from '../emails/account-links'
import { getStoreName, getStorefrontUrl, withQuery } from '../emails/context'

/**
 * Emails the link to the storefront's /verify-account page. Only customers need verifying
 * (`http.authVerificationsPerActor` in medusa-config.ts; docs/decisions.md, "Phase 2 settings").
 *
 * The link is also stored in the notification's `data` so the end-to-end suite can follow it.
 */
export default async function verificationRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; entity_type: string; code: string }>) {
  if (data.entity_type !== 'email') {
    return
  }

  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const { entity_id: email, code } = data
  const verifyUrl = withQuery(`${getStorefrontUrl(container)}/verify-account`, {
    token: code,
    email,
  })

  await notificationModuleService.createNotifications({
    to: email,
    channel: 'email',
    template: 'email-verification',
    content: emailVerificationEmail({ storeName: await getStoreName(container), verifyUrl }),
    data: { verify_url: verifyUrl },
    trigger_type: 'auth.verification_requested',
  })
}

export const config: SubscriberConfig = {
  event: 'auth.verification_requested',
}
