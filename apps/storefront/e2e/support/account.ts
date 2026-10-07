import { type Page, expect } from "@playwright/test"
import { linkFrom, waitForEmail } from "./emails"
import { path } from "./env"

export const TEST_PASSWORD = "Correct-Horse-42"

/**
 * Registers a customer and confirms their email through the verification
 * link (customers must verify before they can sign in; docs/decisions.md,
 * "Phase 2 settings").
 */
export async function registerAndVerify(page: Page, email: string) {
  await page.goto(path("/account"))
  await page.getByTestId("login-page").getByTestId("register-button").click()

  const form = page.getByTestId("register-page")
  await form.getByTestId("first-name-input").fill("Sam")
  await form.getByTestId("last-name-input").fill("Tester")
  await form.getByTestId("email-input").fill(email)
  await form.getByTestId("password-input").fill(TEST_PASSWORD)
  await form.getByTestId("register-button").click()

  await expect(form.getByTestId("register-verification-message")).toBeVisible()

  const verification = await waitForEmail(email, "email-verification")
  await page.goto(linkFrom(verification, "verify_url"))
  await expect(page.getByTestId("verify-account-page")).toContainText(
    "Your email is verified"
  )
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto(path("/account"))
  const form = page.getByTestId("login-page")
  await form.getByTestId("email-input").fill(email)
  await form.getByTestId("password-input").fill(password)
  await form.getByTestId("sign-in-button").click()
  await expect(page.getByTestId("account-nav")).toBeVisible()
}
