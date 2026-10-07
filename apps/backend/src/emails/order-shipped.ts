import { type Amount, type EmailContent, escapeHtml, layout, toNumber } from './html'
import { type EmailAddress, addressLines } from './order-confirmation'

export type OrderShippedInput = {
  storeName: string
  order: { display_id: number | string }
  items: { title?: string | null; quantity: Amount }[]
  trackingLinks: { tracking_number?: string | null; tracking_url?: string | null }[]
  address?: EmailAddress | null
}

/** Sent on `shipment.created`, unless the shipment was created with "don't notify". */
export function orderShippedEmail({
  storeName,
  order,
  items,
  trackingLinks,
  address,
}: OrderShippedInput): EmailContent {
  const title = `Your order #${order.display_id} is on its way`
  const lines = addressLines(address)
  const itemText = (item: OrderShippedInput['items'][number]) =>
    `${item.title || 'Item'}${toNumber(item.quantity) > 1 ? ` x ${toNumber(item.quantity)}` : ''}`
  const tracking = trackingLinks.filter((link) => link.tracking_number || link.tracking_url)

  const html = layout({
    storeName,
    title,
    body: [
      '<p>Good news: your order has been sent.</p>',
      items.length
        ? `<ul style="padding-left:20px">${items.map((item) => `<li>${escapeHtml(itemText(item))}</li>`).join('')}</ul>`
        : '',
      tracking.length
        ? '<p><strong>Tracking</strong><br>' +
          tracking
            .map((link) =>
              link.tracking_url
                ? `<a href="${escapeHtml(link.tracking_url)}">${escapeHtml(link.tracking_number || link.tracking_url)}</a>`
                : escapeHtml(link.tracking_number)
            )
            .join('<br>') +
          '</p>'
        : '',
      lines.length
        ? `<p><strong>Delivering to</strong><br>${lines.map(escapeHtml).join('<br>')}</p>`
        : '',
    ].join(''),
  })

  const text = [
    title,
    '',
    'Good news: your order has been sent.',
    ...(items.length ? ['', ...items.map(itemText)] : []),
    ...(tracking.length
      ? ['', 'Tracking:', ...tracking.map((link) => [link.tracking_number, link.tracking_url].filter(Boolean).join(' '))]
      : []),
    ...(lines.length ? ['', 'Delivering to:', ...lines] : []),
    '',
    storeName,
  ].join('\n')

  return { subject: `Order #${order.display_id} has shipped`, html, text }
}
