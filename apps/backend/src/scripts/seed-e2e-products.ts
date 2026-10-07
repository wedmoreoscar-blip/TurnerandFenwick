/**
 * Test data for the Playwright end-to-end suite (apps/storefront/e2e): a few brand-neutral,
 * GBP-priced products the suite can always buy. Run on `dev` only, never on `prod`.
 *
 *   npx medusa exec ./src/scripts/seed-e2e-products.ts
 *
 * Oscar runs it (it writes to the database), after setup-uk-region.ts.
 *
 * Safe to re-run: products are found by handle and only missing ones are created, and stock that
 * the suite's orders have used up is topped back up. Like real listings, each product has one
 * variant with managed inventory, but a large stock, so repeated test orders never sell it out.
 */
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  updateInventoryLevelsWorkflow,
} from '@medusajs/medusa/core-flows'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

const CURRENCY = 'gbp'
/** Each product's stock is reset to this whenever it falls below the threshold. */
const STOCK = 1000
const RESTOCK_BELOW = 100

/** Medusa stores amounts as-is: 120 means £120.00. Handles and SKUs never change. */
const PRODUCTS = [
  { handle: 'e2e-test-jacket', title: 'E2E test jacket', sku: 'E2E-TEST-JACKET', price: 120 },
  { handle: 'e2e-test-trousers', title: 'E2E test trousers', sku: 'E2E-TEST-TROUSERS', price: 45 },
]

export default async function seedE2eProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ---- Prerequisites ----------------------------------------------------------

  const { data: stores } = await query.graph({
    entity: 'store',
    fields: ['default_sales_channel_id', 'supported_currencies.currency_code'],
  })
  const store = stores[0]
  const salesChannelId = store?.default_sales_channel_id

  if (!salesChannelId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'The store has no default sales channel.')
  }

  if (!store.supported_currencies?.some((currency) => currency?.currency_code === CURRENCY)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'GBP is not a store currency. Run setup-uk-region.ts first.'
    )
  }

  const { data: salesChannels } = await query.graph({
    entity: 'sales_channel',
    fields: ['id', 'stock_locations.id'],
    filters: { id: salesChannelId },
  })
  const locationId = salesChannels[0]?.stock_locations?.[0]?.id

  if (!locationId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'The default sales channel has no stock location. See docs/handover.md, step 2.'
    )
  }

  const { data: shippingProfiles } = await query.graph({
    entity: 'shipping_profile',
    fields: ['id'],
    filters: { type: 'default' },
  })

  if (!shippingProfiles[0]) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No default shipping profile found.')
  }

  // ---- Products ---------------------------------------------------------------

  const { data: existing } = await query.graph({
    entity: 'product',
    fields: ['handle'],
    filters: { handle: PRODUCTS.map((product) => product.handle) },
  })
  const existingHandles = new Set(existing.map((product) => product.handle))
  const missing = PRODUCTS.filter((product) => !existingHandles.has(product.handle))

  if (missing.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: missing.map((product) => ({
          title: product.title,
          handle: product.handle,
          description: 'Test product for the automated checkout tests. Not for sale.',
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfiles[0].id,
          sales_channels: [{ id: salesChannelId }],
          options: [{ title: 'Size', values: ['One size'] }],
          variants: [
            {
              title: 'One size',
              sku: product.sku,
              manage_inventory: true,
              options: { Size: 'One size' },
              prices: [{ currency_code: CURRENCY, amount: product.price }],
            },
          ],
        })),
      },
    })
    logger.info(`Created ${missing.map((product) => product.handle).join(', ')}`)
  }

  // ---- Stock --------------------------------------------------------------------

  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: ['sku', 'inventory_items.inventory_item_id'],
    filters: { sku: PRODUCTS.map((product) => product.sku) },
  })
  const inventoryItemIds = variants
    .flatMap((variant) => variant.inventory_items ?? [])
    .map((link) => link?.inventory_item_id)
    .filter((id): id is string => Boolean(id))

  const { data: levels } = await query.graph({
    entity: 'inventory_level',
    fields: ['id', 'inventory_item_id', 'stocked_quantity'],
    filters: { inventory_item_id: inventoryItemIds, location_id: locationId },
  })

  const toCreate = inventoryItemIds.filter(
    (id) => !levels.some((level) => level.inventory_item_id === id)
  )
  const toRestock = levels.filter((level) => Number(level.stocked_quantity) < RESTOCK_BELOW)

  if (toCreate.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: toCreate.map((inventory_item_id) => ({
          inventory_item_id,
          location_id: locationId,
          stocked_quantity: STOCK,
        })),
      },
    })
    logger.info(`Stocked ${toCreate.length} test product(s) with ${STOCK} each`)
  }

  if (toRestock.length) {
    await updateInventoryLevelsWorkflow(container).run({
      input: {
        updates: toRestock.map((level) => ({
          id: level.id,
          inventory_item_id: level.inventory_item_id,
          location_id: locationId,
          stocked_quantity: STOCK,
        })),
      },
    })
    logger.info(`Restocked ${toRestock.length} test product(s) to ${STOCK}`)
  }

  // ---- Search index -------------------------------------------------------------

  // The store page lists products from the search index, which `product.created` fills
  // asynchronously; `medusa exec` can exit first. Replaying the ingestion is awaited, and
  // upserts, so it is safe on every run (as in seed-demo-products.ts).
  const { data: seeded } = await query.graph({
    entity: 'product',
    fields: ['id'],
    filters: { handle: PRODUCTS.map((product) => product.handle) },
  })

  await container.resolve(Modules.SEARCH).ingest({
    name: 'product.created',
    data: seeded.map((product) => ({ id: product.id })),
  } as never)

  logger.info('E2E test products ready.')
}
