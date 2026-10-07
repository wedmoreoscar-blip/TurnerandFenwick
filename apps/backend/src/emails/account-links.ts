import { type EmailContent, button, layout } from './html'

/** Medusa's password-reset tokens expire after 15 minutes (its default). */
const RESET_LINK_LIFETIME = '15 minutes'

/** Sent on `auth.password_reset`, to customers (storefront link) and admin users (admin link). */
export function passwordResetEmail({
  storeName,
  resetUrl,
}: {
  storeName: string
  resetUrl: string
}): EmailContent {
  const title = 'Reset your password'
  const intro = 'We received a request to reset the password for this email address.'
  const outro = `The link works once and expires in ${RESET_LINK_LIFETIME}. If you didn't ask to reset your password, you can ignore this email.`

  return {
    subject: `Reset your ${storeName} password`,
    html: layout({
      storeName,
      title,
      body: `<p>${intro}</p>${button(resetUrl, 'Choose a new password')}<p>${outro}</p>`,
    }),
    text: [title, '', intro, '', `Choose a new password: ${resetUrl}`, '', outro, '', storeName].join(
      '\n'
    ),
  }
}

/** Sent on `auth.verification_requested`, when a customer registers or asks for a new link. */
export function emailVerificationEmail({
  storeName,
  verifyUrl,
}: {
  storeName: string
  verifyUrl: string
}): EmailContent {
  const title = 'Confirm your email address'
  const intro = 'Thanks for creating an account. Confirm your email address to finish signing up.'
  const outro = "If you didn't create an account, you can ignore this email."

  return {
    subject: `Confirm your email for ${storeName}`,
    html: layout({
      storeName,
      title,
      body: `<p>${intro}</p>${button(verifyUrl, 'Confirm email address')}<p>${outro}</p>`,
    }),
    text: [title, '', intro, '', `Confirm email address: ${verifyUrl}`, '', outro, '', storeName].join(
      '\n'
    ),
  }
}
