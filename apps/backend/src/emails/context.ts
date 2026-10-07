import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils'
import type { MedusaContainer } from '@medusajs/framework/types'

/**
 * The store's name from Medusa's store record (admin → Settings → Store), so Ben renames the shop
 * in the admin and the emails follow.
 */
export async function getStoreName(container: MedusaContainer): Promise<string> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({ entity: 'store', fields: ['name'] })

  return stores[0]?.name || ''
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** The storefront's public URL (`STOREFRONT_URL`, set as `admin.storefrontUrl`). */
export function getStorefrontUrl(container: MedusaContainer): string {
  const { admin } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)

  if (!admin.storefrontUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Set STOREFRONT_URL in .env: emails link to the storefront.'
    )
  }

  return trimSlash(admin.storefrontUrl)
}

/** The admin dashboard's public URL (`MEDUSA_BACKEND_URL` plus the admin path, `/app`). */
export function getAdminUrl(container: MedusaContainer): string {
  const { admin } = container.resolve(ContainerRegistrationKeys.CONFIG_MODULE)

  if (!admin.backendUrl || !/^https?:\/\//.test(admin.backendUrl)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Set MEDUSA_BACKEND_URL in .env: admin password-reset emails link to the admin.'
    )
  }

  return `${trimSlash(admin.backendUrl)}${admin.path}`
}

/** Appends query parameters, encoded. */
export function withQuery(url: string, params: Record<string, string>): string {
  return `${url}?${new URLSearchParams(params).toString()}`
}
