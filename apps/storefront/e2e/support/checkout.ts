import { type Page, expect } from "@playwright/test"
import { path } from "./env"

/**
 * Checkout steps shared by the guest and registered tests. They drive the
 * starter's checkout through its data-testid attributes, which the behaviour
 * lock keeps stable through the UI overhaul.
 */

/** Seeded by apps/backend/src/scripts/seed-e2e-products.ts, priced in GBP. */
export const TEST_PRODUCT = {
  handle: "e2e-test-trousers",
  title: "E2E test trousers",
}

export const TEST_ADDRESS = {
  firstName: "Sam",
  lastName: "Tester",
  address: "1 Test Street",
  postalCode: "N1 1AA",
  city: "London",
  phone: "07700900000",
}

/** Stripe's test card that authorises without 3-D Secure. */
const TEST_CARD = { number: "4242424242424242", expiry: "12 / 34", cvc: "123" }

/** The dev server compiles each page on its first visit, which can take ~30s. */
const PAGE_LOAD = { timeout: 60_000 }

export async function addTestProductToCart(page: Page) {
  await page.goto(path(`/products/${TEST_PRODUCT.handle}`))
  // "product-title" also marks the related-products cards, so match the heading.
  await expect(
    page.getByRole("heading", { level: 2, name: TEST_PRODUCT.title })
  ).toBeVisible()

  const addButton = page.getByTestId("add-product-button")
  await expect(addButton).toBeEnabled()
  await addButton.click()
  // Adding runs as a server action; wait for the header's basket count to
  // update before leaving the page, or the cart may still be empty.
  await expect(page.getByTestId("nav-cart-link")).toHaveText(/Cart \(1\)/, {
    timeout: 30_000,
  })

  await page.goto(path("/cart"))
  await expect(
    page.getByTestId("product-row").filter({ hasText: TEST_PRODUCT.title })
  ).toBeVisible()
}

/** From the basket through address, delivery, payment and review. */
export async function checkOut(page: Page, { email }: { email?: string } = {}) {
  await page.getByTestId("checkout-button").click()
  await expect(page).toHaveURL(/\/checkout/, PAGE_LOAD)

  // ---- Address (billing stays "same as delivery") ----
  await page.getByTestId("shipping-first-name-input").fill(TEST_ADDRESS.firstName)
  await page.getByTestId("shipping-last-name-input").fill(TEST_ADDRESS.lastName)
  await page.getByTestId("shipping-address-input").fill(TEST_ADDRESS.address)
  await page.getByTestId("shipping-postal-code-input").fill(TEST_ADDRESS.postalCode)
  await page.getByTestId("shipping-city-input").fill(TEST_ADDRESS.city)
  await page.getByTestId("shipping-country-select").selectOption("gb")
  if (email) {
    await page.getByTestId("shipping-email-input").fill(email)
  }
  await page.getByTestId("shipping-phone-input").fill(TEST_ADDRESS.phone)
  await page.getByTestId("submit-address-button").click()

  // ---- Delivery ----
  await expect(page).toHaveURL(/step=delivery/, PAGE_LOAD)
  await page.getByTestId("delivery-option-radio").first().click()
  await page.getByTestId("submit-delivery-option-button").click()

  // ---- Payment ----
  await expect(page).toHaveURL(/step=payment/, PAGE_LOAD)
  await page.getByText("Credit card", { exact: true }).click()
  await fillStripeTestCard(page)
  const continueButton = page.getByTestId("submit-payment-button")
  await expect(continueButton).toBeEnabled()
  await continueButton.click()

  // ---- Review ----
  await expect(page).toHaveURL(/step=review/, PAGE_LOAD)
  await page.getByTestId("submit-order-button").click()

  await expect(page).toHaveURL(/\/order\/[^/]+\/confirmed/, PAGE_LOAD)
  await expect(page.getByTestId("order-complete-container")).toBeVisible()

  return (await page.getByTestId("order-id").innerText()).trim()
}

/**
 * Fills the Stripe Payment Element, which lives in Stripe's iframe. With the
 * accordion layout, card may sit behind a "Card" tab when Stripe offers other
 * methods; country and postcode fields appear only for some configurations.
 */
async function fillStripeTestCard(page: Page) {
  const stripe = page
    .frameLocator('iframe[title="Secure payment input frame"]')
    .first()

  const number = stripe.locator('input[name="number"]')
  const cardTab = stripe.getByRole("button", { name: /^card$/i })

  await expect(number.or(cardTab).first()).toBeVisible({ timeout: 30_000 })
  if (!(await number.isVisible())) {
    await cardTab.click()
  }

  await number.fill(TEST_CARD.number)
  await stripe.locator('input[name="expiry"]').fill(TEST_CARD.expiry)
  await stripe.locator('input[name="cvc"]').fill(TEST_CARD.cvc)

  const country = stripe.locator('select[name="country"]')
  if (await country.isVisible()) {
    await country.selectOption("GB")
  }
  const postalCode = stripe.locator('input[name="postalCode"]')
  if (await postalCode.isVisible()) {
    await postalCode.fill(TEST_ADDRESS.postalCode)
  }
}
