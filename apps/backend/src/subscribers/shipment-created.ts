import type { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { getStoreName } from '../emails/context'
import { orderShippedEmail } from '../emails/order-shipped'

/** Emails the customer when a shipment is created, unless the admin chose not to notify. */
export default async function shipmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  if (data.no_notification) {
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notificationModuleService = container.resolve(Modules.NOTIFICATION)

  // The event carries the fulfillment's id; its order comes through the order-fulfillment link.
  const {
    data: [fulfillment],
  } = await query.graph({
    entity: 'fulfillment',
    fields: [
      'id',
      'items.title',
      'items.quantity',
      'labels.tracking_number',
      'labels.tracking_url',
      'delivery_address.*',
      'order.id',
      'order.display_id',
      'order.email',
    ],
    filters: { id: data.id },
  })

  const order = fulfillment?.order

  if (!order?.email) {
    return
  }

  const content = orderShippedEmail({
    storeName: await getStoreName(container),
    order: { display_id: order.display_id ?? order.id },
    items: (fulfillment.items ?? []).filter((item) => item !== null),
    trackingLinks: (fulfillment.labels ?? []).filter((label) => label !== null),
    address: fulfillment.delivery_address,
  })

  await notificationModuleService.createNotifications({
    to: order.email,
    channel: 'email',
    template: 'order-shipped',
    content,
    data: { order_id: order.id, fulfillment_id: fulfillment.id },
    trigger_type: 'shipment.created',
    resource_id: order.id,
    resource_type: 'order',
    idempotency_key: `order-shipped-${fulfillment.id}`,
  })
}

export const config: SubscriberConfig = {
  event: 'shipment.created',
}
