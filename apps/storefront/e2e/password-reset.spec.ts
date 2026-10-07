import { expect, test } from "@playwright/test"
import { registerAndVerify, signIn, TEST_PASSWORD } from "./support/account"
import { linkFrom, waitForEmail } from "./support/emails"
import { path, uniqueEmail } from "./support/env"

const NEW_PASSWORD = "Battery-Staple-77"

test("customer resets a forgotten password from the sign-in page", async ({ page }) => {
  const email = uniqueEmail("reset")
  await registerAndVerify(page, email)

  // Ask for a reset link from the sign-in form.
  await page.goto(path("/account"))
  await page.getByTestId("forgot-password-link").click()
  await page.getByTestId("forgot-password-page").getByTestId("email-input").fill(email)
  await page.getByTestId("send-reset-link-button").click()
  await expect(page.getByTestId("forgot-password-success")).toBeVisible()

  // Follow the emailed link and choose a new password.
  const resetEmail = await waitForEmail(email, "password-reset")
  await page.goto(linkFrom(resetEmail, "reset_url"))
  await page.getByTestId("new-password-input").fill(NEW_PASSWORD)
  await page.getByTestId("confirm-password-input").fill(NEW_PASSWORD)
  await page.getByTestId("reset-password-button").click()
  await expect(page.getByTestId("reset-password-success")).toBeVisible()

  // The new password works, and the link can't be used twice.
  await signIn(page, email, NEW_PASSWORD)

  await page.goto(linkFrom(resetEmail, "reset_url"))
  await page.getByTestId("new-password-input").fill("Another-Password-1")
  await page.getByTestId("confirm-password-input").fill("Another-Password-1")
  await page.getByTestId("reset-password-button").click()
  await expect(page.getByTestId("reset-password-error-message")).toBeVisible()
})

test("signed-in customer gets a reset link from their profile", async ({ page }) => {
  const email = uniqueEmail("profile")
  await registerAndVerify(page, email)
  await signIn(page, email, TEST_PASSWORD)

  await page.goto(path("/account/profile"))
  const editor = page.getByTestId("account-password-editor")
  await editor.getByTestId("send-reset-link-button").click()
  await expect(editor).toContainText("We've sent a link")

  const resetEmail = await waitForEmail(email, "password-reset")
  expect(linkFrom(resetEmail, "reset_url")).toContain("/reset-password?token=")
})
