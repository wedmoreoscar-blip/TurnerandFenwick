/**
 * Sets the store up to sell in the United Kingdom: GBP as the default currency, a United Kingdom
 * region with Stripe, the GB tax region and a placeholder delivery option.
 *
 *   npx medusa exec ./src/scripts/setup-uk-region.ts
 *
 * Oscar runs it (it writes to the database): on dev now, on prod at Phase 5. Stripe must already
 * be registered in medusa-config.ts with STRIPE_API_KEY set, and the server restarted once, so
 * the pp_stripe_stripe provider exists.
 *
 * Safe to re-run: every step checks what already exists and only adds what is missing.
 *
 * The GB tax region gets the standard 20% VAT rate as its default (Oscar, 2026-10-07). GBP prices
 * are tax-inclusive, as UK consumer prices must be. Placeholder until Ben gives his rates
 * (docs/decisions.md, PENDING "Waiting on Ben"): one flat delivery option at £5.
 *
 * A country can belong to only one region, so GB is first moved out of any other region (on dev,
 * the demo seed's Europe region) and out of every other shipping service zone.
 */
import {
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createTaxRatesWorkflow,
  createTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateServiceZonesWorkflow,
  updateStoresWorkflow,
} from '@medusajs/medusa/core-flows'
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import type { ExecArgs } from '@medusajs/framework/types'

const COUNTRY = 'gb'
const CURRENCY = 'gbp'
const REGION_NAME = 'United Kingdom'
const SERVICE_ZONE_NAME = 'United Kingdom'
const STRIPE_PROVIDER_ID = 'pp_stripe_stripe'
const TAX_PROVIDER_ID = 'tp_system'
/** Medusa tax rates are percentages: 20 means 20%. */
const VAT_RATE = { rate: 20, code: 'GB-VAT-STANDARD', name: 'VAT (standard rate)' }
const FULFILLMENT_PROVIDER_ID = 'manual_manual'
const SHIPPING_OPTION_NAME = 'Standard UK delivery'
/** Placeholder until Ben gives his rates. Medusa stores amounts as-is: 5 means £5.00. */
const SHIPPING_PRICE = 5

export default async function setupUkRegion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // ---- Stripe must be registered --------------------------------------------

  const { data: paymentProviders } = await query.graph({
    entity: 'payment_provider',
    fields: ['id'],
    filters: { id: STRIPE_PROVIDER_ID },
  })

  if (!paymentProviders.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Payment provider ${STRIPE_PROVIDER_ID} not found. Set STRIPE_API_KEY, start the server once, then re-run.`
    )
  }

  // ---- GBP as the store's default currency ----------------------------------

  const { data: stores } = await query.graph({
    entity: 'store',
    fields: [
      'id',
      'supported_currencies.currency_code',
      'supported_currencies.is_default',
    ],
  })
  const store = stores[0]

  if (!store) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No store found.')
  }

  const currencies = (store.supported_currencies ?? []).filter(
    (currency): currency is NonNullable<typeof currency> => Boolean(currency)
  )
  const gbp = currencies.find((currency) => currency.currency_code === CURRENCY)

  if (!gbp?.is_default) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          supported_currencies: [
            ...currencies
              .filter((currency) => currency.currency_code !== CURRENCY)
              // Leaving is_tax_inclusive out keeps each currency's current setting.
              .map((currency) => ({ currency_code: currency.currency_code, is_default: false })),
            { currency_code: CURRENCY, is_default: true, is_tax_inclusive: true },
          ],
        },
      },
    })
    logger.info('GBP is now the store default currency')
  }

  // ---- The United Kingdom region ---------------------------------------------

  const { data: regions } = await query.graph({
    entity: 'region',
    fields: ['id', 'name', 'countries.iso_2', 'payment_providers.id'],
  })

  const existingUkRegion = regions.find((region) => region.name === REGION_NAME)
  let ukRegionId = existingUkRegion?.id

  for (const region of regions) {
    const countryCodes = (region.countries ?? []).map((country) => country?.iso_2)

    if (region.id !== ukRegionId && countryCodes.includes(COUNTRY)) {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: region.id },
          update: {
            countries: countryCodes.filter(
              (code): code is string => Boolean(code) && code !== COUNTRY
            ),
          },
        },
      })
      logger.info(`Moved GB out of the "${region.name}" region`)
    }
  }

  if (!existingUkRegion) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: CURRENCY,
            countries: [COUNTRY],
            payment_providers: [STRIPE_PROVIDER_ID],
            automatic_taxes: true,
            is_tax_inclusive: true,
          },
        ],
      },
    })
    ukRegionId = result[0].id
    logger.info(`Created the "${REGION_NAME}" region with Stripe`)
  } else {
    const providerIds = (existingUkRegion.payment_providers ?? [])
      .map((provider) => provider?.id)
      .filter((id): id is string => Boolean(id))

    if (!providerIds.includes(STRIPE_PROVIDER_ID)) {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: existingUkRegion.id },
          update: { payment_providers: [...providerIds, STRIPE_PROVIDER_ID] },
        },
      })
      logger.info(`Enabled Stripe in the "${REGION_NAME}" region`)
    }
  }

  // ---- The GB tax region with standard-rate VAT as its default ----------------

  const { data: taxRegions } = await query.graph({
    entity: 'tax_region',
    fields: ['id', 'tax_rates.id', 'tax_rates.is_default'],
    filters: { country_code: COUNTRY, parent_id: null },
  })
  const taxRegion = taxRegions[0]

  if (!taxRegion) {
    await createTaxRegionsWorkflow(container).run({
      input: [
        { country_code: COUNTRY, provider_id: TAX_PROVIDER_ID, default_tax_rate: VAT_RATE },
      ],
    })
    logger.info(`Created the GB tax region with ${VAT_RATE.rate}% VAT`)
  } else if (!taxRegion.tax_rates.some((rate) => rate?.is_default)) {
    await createTaxRatesWorkflow(container).run({
      input: [{ tax_region_id: taxRegion.id, is_default: true, ...VAT_RATE }],
    })
    logger.info(`Added ${VAT_RATE.rate}% VAT as the GB tax region's default rate`)
  }

  // ---- A UK shipping service zone --------------------------------------------

  const { data: fulfillmentSets } = await query.graph({
    entity: 'fulfillment_set',
    fields: [
      'id',
      'name',
      'type',
      'service_zones.id',
      'service_zones.name',
      'service_zones.geo_zones.id',
      'service_zones.geo_zones.country_code',
    ],
    filters: { type: 'shipping' },
  })
  const fulfillmentSet = fulfillmentSets[0]

  if (!fulfillmentSet) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'No shipping fulfillment set found. Add a stock location with shipping in the admin first.'
    )
  }

  let ukZoneId = fulfillmentSet.service_zones.find((zone) => zone.name === SERVICE_ZONE_NAME)?.id

  for (const set of fulfillmentSets) {
    for (const zone of set.service_zones) {
      const hasGb = zone.geo_zones.some((geo) => geo.country_code === COUNTRY)

      if (zone.id !== ukZoneId && hasGb) {
        await updateServiceZonesWorkflow(container).run({
          input: {
            selector: { id: zone.id },
            update: {
              geo_zones: zone.geo_zones
                .filter((geo) => geo.country_code !== COUNTRY)
                .map((geo) => ({ id: geo.id })),
            },
          },
        })
        logger.info(`Moved GB out of the "${zone.name}" shipping zone`)
      }
    }
  }

  if (!ukZoneId) {
    const { result } = await createServiceZonesWorkflow(container).run({
      input: {
        data: [
          {
            name: SERVICE_ZONE_NAME,
            fulfillment_set_id: fulfillmentSet.id,
            geo_zones: [{ type: 'country', country_code: COUNTRY }],
          },
        ],
      },
    })
    ukZoneId = result[0].id
    logger.info(`Created the "${SERVICE_ZONE_NAME}" shipping zone in "${fulfillmentSet.name}"`)
  }

  // ---- The placeholder delivery option ---------------------------------------

  const { data: shippingOptions } = await query.graph({
    entity: 'shipping_option',
    fields: ['id'],
    filters: { service_zone_id: ukZoneId, name: SHIPPING_OPTION_NAME },
  })

  if (!shippingOptions.length) {
    const { data: shippingProfiles } = await query.graph({
      entity: 'shipping_profile',
      fields: ['id'],
      filters: { type: 'default' },
    })

    if (!shippingProfiles[0]) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'No default shipping profile found.')
    }

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: SHIPPING_OPTION_NAME,
          price_type: 'flat',
          provider_id: FULFILLMENT_PROVIDER_ID,
          service_zone_id: ukZoneId,
          shipping_profile_id: shippingProfiles[0].id,
          type: {
            label: 'Standard',
            description: 'Placeholder rate until Ben sets his delivery prices.',
            code: 'standard-uk',
          },
          prices: [
            { currency_code: CURRENCY, amount: SHIPPING_PRICE },
            { region_id: ukRegionId!, amount: SHIPPING_PRICE },
          ],
          rules: [
            { attribute: 'enabled_in_store', value: 'true', operator: 'eq' },
            { attribute: 'is_return', value: 'false', operator: 'eq' },
          ],
        },
      ],
    })
    logger.info(`Created the "${SHIPPING_OPTION_NAME}" option at £${SHIPPING_PRICE}`)
  }

  logger.info('UK setup complete.')
}
