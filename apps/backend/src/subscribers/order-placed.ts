import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { getStoreName, getStorefrontUrl } from '../emails/context'
import { orderConfirmationEmail } from '../emails/order-confirmation'

/** Emails the order confirmation when a checkout completes. */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  const {
    data: [order],
  } = await query.graph({
    entity: 'order',
    fields: [
      'id',
      'display_id',
      'email',
      'currency_code',
      'total',
      'tax_total',
      'shipping_total',
      'discount_total',
      'items.title',
      'items.product_title',
      'items.variant_title',
      'items.quantity',
      'items.total',
      'shipping_address.*',
      'shipping_methods.name',
      'customer.has_account',
    ],
    filters: { id: data.id },
  })

  if (!order?.email) {
    return
  }

  const storefrontUrl = getStorefrontUrl(container)
  // Guests have no account page to link to.
  const orderUrl = order.customer?.has_account
    ? `${storefrontUrl}/account/orders/details/${order.id}`
    : undefined

  const content = orderConfirmationEmail({
    storeName: await getStoreName(container),
    orderUrl,
    order: {
      display_id: order.display_id ?? order.id,
      currency_code: order.currency_code,
      items: (order.items ?? []).filter((item) => item !== null),
      shipping_address: order.shipping_address,
      shipping_methods: (order.shipping_methods ?? []).filter((method) => method !== null),
      shipping_total: order.shipping_total,
      discount_total: order.discount_total,
      tax_total: order.tax_total,
      total: order.total,
    },
  })

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: 'email',
    template: 'order-confirmation',
    content,
    data: { order_id: order.id, display_id: order.display_id },
    trigger_type: 'order.placed',
    resource_id: order.id,
    resource_type: 'order',
    // A retried event must not email the customer twice.
    idempotency_key: `order-confirmation-${order.id}`,
  })
}

export const config: SubscriberConfig = {
  event: 'order.placed',
}
