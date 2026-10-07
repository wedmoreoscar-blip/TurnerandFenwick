import { expect, test } from "@playwright/test"
import { registerAndVerify, signIn, TEST_PASSWORD } from "./support/account"
import { addTestProductToCart, checkOut, TEST_PRODUCT } from "./support/checkout"
import { waitForEmail } from "./support/emails"
import { path, uniqueEmail } from "./support/env"

test("customer registers, verifies, signs in, buys, and sees the order in their history", async ({
  page,
}) => {
  const email = uniqueEmail("account")

  await registerAndVerify(page, email)
  await signIn(page, email, TEST_PASSWORD)

  await addTestProductToCart(page)
  // Signed in, so the checkout already has the customer's email.
  const orderNumber = await checkOut(page)

  await page.goto(path("/account/orders"))
  const order = page.getByTestId("order-card").filter({
    has: page.getByTestId("order-display-id").getByText(orderNumber, { exact: true }),
  })
  await expect(order).toBeVisible()
  await expect(order.getByTestId("item-title")).toContainText(TEST_PRODUCT.title)

  // Registered customers' confirmations link to the order in their account.
  await waitForEmail(email, "order-confirmation")
})
