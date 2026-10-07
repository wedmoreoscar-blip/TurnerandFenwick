import { type Amount, type EmailContent, button, escapeHtml, formatMoney, layout, toNumber } from './html'

export type EmailAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
}

export type OrderConfirmationInput = {
  storeName: string
  /** Link to the order in the customer's account; omitted for guest orders. */
  orderUrl?: string
  order: {
    display_id: number | string
    currency_code: string
    items: {
      product_title?: string | null
      variant_title?: string | null
      title?: string | null
      quantity: Amount
      total: Amount
    }[]
    shipping_address?: EmailAddress | null
    shipping_methods?: { name?: string | null }[] | null
    shipping_total: Amount
    discount_total: Amount
    tax_total: Amount
    total: Amount
  }
}

export function addressLines(address?: EmailAddress | null): string[] {
  if (!address) {
    return []
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(' ')
  const town = [address.city, address.province].filter(Boolean).join(', ')

  return [
    name,
    address.company,
    address.address_1,
    address.address_2,
    town,
    address.postal_code,
    address.country_code?.toUpperCase(),
  ].filter((line): line is string => Boolean(line))
}

function itemName(item: OrderConfirmationInput['order']['items'][number]): string {
  const title = item.product_title || item.title || 'Item'
  // Medusa names a single-variant product's variant "Default variant"; it adds nothing.
  return item.variant_title && item.variant_title !== 'Default variant'
    ? `${title} (${item.variant_title})`
    : title
}

/**
 * Sent on `order.placed`. GBP prices include VAT, so lines and totals are shown with tax included
 * and the VAT within the total is stated separately.
 */
export function orderConfirmationEmail({
  storeName,
  orderUrl,
  order,
}: OrderConfirmationInput): EmailContent {
  const money = (amount: Amount) => formatMoney(amount, order.currency_code)
  const title = `Thank you for your order #${order.display_id}`
  const delivery = order.shipping_methods?.map((method) => method.name).filter(Boolean).join(', ')
  const address = addressLines(order.shipping_address)
  const hasDiscount = toNumber(order.discount_total) > 0

  const rows = order.items.map(
    (item) =>
      '<tr>' +
      `<td style="padding:8px 0;border-bottom:1px solid #e5e5e5">${escapeHtml(itemName(item))}` +
      (toNumber(item.quantity) > 1 ? ` &times; ${escapeHtml(toNumber(item.quantity))}` : '') +
      '</td>' +
      `<td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right">${escapeHtml(money(item.total))}</td>` +
      '</tr>'
  )

  const totalRow = (label: string, amount: string, bold = false) =>
    `<tr><td style="padding:4px 0${bold ? ';font-weight:bold' : ''}">${escapeHtml(label)}</td>` +
    `<td style="padding:4px 0;text-align:right${bold ? ';font-weight:bold' : ''}">${escapeHtml(amount)}</td></tr>`

  const totals = [
    totalRow(delivery ? `Delivery (${delivery})` : 'Delivery', money(order.shipping_total)),
    hasDiscount ? totalRow('Discount', `-${money(order.discount_total)}`) : '',
    totalRow('Total', money(order.total), true),
    totalRow('Includes VAT of', money(order.tax_total)),
  ].join('')

  const html = layout({
    storeName,
    title,
    body: [
      "<p>We've received your order and will let you know when it's on its way.</p>",
      '<table role="presentation" style="width:100%;border-collapse:collapse;margin:16px 0">',
      rows.join(''),
      totals,
      '</table>',
      address.length
        ? `<p style="margin:16px 0 0"><strong>Delivering to</strong><br>${address.map(escapeHtml).join('<br>')}</p>`
        : '',
      orderUrl ? button(orderUrl, 'View your order') : '',
    ].join(''),
  })

  const text = [
    title,
    '',
    "We've received your order and will let you know when it's on its way.",
    '',
    ...order.items.map((item) => {
      const quantity = toNumber(item.quantity) > 1 ? ` x ${toNumber(item.quantity)}` : ''
      return `${itemName(item)}${quantity}: ${money(item.total)}`
    }),
    `${delivery ? `Delivery (${delivery})` : 'Delivery'}: ${money(order.shipping_total)}`,
    ...(hasDiscount ? [`Discount: -${money(order.discount_total)}`] : []),
    `Total: ${money(order.total)}`,
    `Includes VAT of ${money(order.tax_total)}`,
    ...(address.length ? ['', 'Delivering to:', ...address] : []),
    ...(orderUrl ? ['', `View your order: ${orderUrl}`] : []),
    '',
    storeName,
  ].join('\n')

  return { subject: `Order #${order.display_id} confirmed`, html, text }
}
