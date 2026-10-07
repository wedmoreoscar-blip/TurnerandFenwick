import { expect, test } from "@playwright/test"
import { addTestProductToCart, checkOut, TEST_PRODUCT } from "./support/checkout"
import { waitForEmail } from "./support/emails"
import { path, uniqueEmail } from "./support/env"

test("guest browses, buys with a Stripe test card and gets a confirmation email", async ({
  page,
}) => {
  const email = uniqueEmail("guest")

  // Browse: the test product is listed in the shop and opens from there.
  await page.goto(path("/store"))
  await page.getByTestId("product-wrapper").filter({ hasText: TEST_PRODUCT.title }).click()
  await expect(page).toHaveURL(new RegExp(`/products/${TEST_PRODUCT.handle}`))

  await addTestProductToCart(page)
  const orderNumber = await checkOut(page, { email })

  await expect(page.getByTestId("order-complete-container")).toContainText(email)

  const confirmation = await waitForEmail(email, "order-confirmation")
  expect(confirmation.data?.display_id).toBe(Number(orderNumber))
})
