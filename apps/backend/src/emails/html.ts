/**
 * Shared pieces for the transactional email templates. Every template returns a finished
 * `EmailContent` for the SMTP provider, which does no templating of its own.
 *
 * Plain, brand-neutral HTML until the UI overhaul (Phase 4) sets the palette and fonts. The store
 * name always comes from Medusa's store record, never from code ("Built for handover to Ben").
 */

export type EmailContent = {
  subject: string
  html: string
  text: string
}

/** Medusa totals arrive as numbers, numeric strings or BigNumber objects (which have valueOf). */
export type Amount = number | string | { valueOf(): number | string } | null | undefined

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function toNumber(amount: Amount): number {
  const value = Number(amount ?? 0)
  return Number.isFinite(value) ? value : 0
}

/** Medusa stores amounts as-is (65 means £65.00), so no division by 100. */
export function formatMoney(amount: Amount, currencyCode: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currencyCode.toUpperCase(),
  }).format(toNumber(amount))
}

/** A call-to-action link that still works when the client strips styles. */
export function button(href: string, label: string): string {
  return (
    `<p style="margin:24px 0"><a href="${escapeHtml(href)}" ` +
    `style="display:inline-block;padding:12px 20px;background:#222222;color:#ffffff;` +
    `text-decoration:none;border-radius:4px">${escapeHtml(label)}</a></p>` +
    `<p style="font-size:13px;color:#555555">If the button doesn't work, copy this link into your ` +
    `browser:<br><a href="${escapeHtml(href)}" style="color:#555555;word-break:break-all">` +
    `${escapeHtml(href)}</a></p>`
  )
}

/** Wraps a template's body in the common page: store name heading, body, footer. */
export function layout({
  storeName,
  title,
  body,
}: {
  storeName: string
  title: string
  body: string
}): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en-GB">',
    '<head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(title)}</title></head>`,
    '<body style="margin:0;padding:0;background:#f6f6f6">',
    '<div style="max-width:600px;margin:0 auto;padding:24px;background:#ffffff;',
    'font-family:Georgia,\'Times New Roman\',serif;font-size:16px;line-height:1.5;color:#222222">',
    `<p style="margin:0 0 24px;font-size:20px">${escapeHtml(storeName)}</p>`,
    `<h1 style="margin:0 0 16px;font-size:24px;font-weight:normal">${escapeHtml(title)}</h1>`,
    body,
    '<p style="margin:32px 0 0;font-size:13px;color:#555555">',
    `${escapeHtml(storeName)}</p>`,
    '</div></body></html>',
  ].join('')
}
