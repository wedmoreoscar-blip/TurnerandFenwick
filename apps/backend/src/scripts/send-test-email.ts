/**
 * Sends one test email through the notification module's email channel (the SMTP provider), to
 * check the SMTP settings.
 *
 *   npx medusa exec ./src/scripts/send-test-email.ts you@example.com
 *
 * Oscar runs it: it records a notification row in the database.
 */
import { ContainerRegistrationKeys, MedusaError, Modules } from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

export default async function sendTestEmail({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)
  const to = args[0]

  if (!to) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Pass the recipient: npx medusa exec ./src/scripts/send-test-email.ts you@example.com'
    )
  }

  const sentAt = new Date().toISOString()

  const notification = await notificationModuleService.createNotifications({
    to,
    channel: 'email',
    template: 'smtp-test',
    content: {
      subject: 'SMTP test from the Medusa backend',
      text: `This is a test email from the Medusa backend, sent at ${sentAt}.`,
      html: `<p>This is a test email from the Medusa backend, sent at ${sentAt}.</p>`,
    },
  })

  logger.info(`Notification ${notification.id}: status ${notification.status}`)
}
