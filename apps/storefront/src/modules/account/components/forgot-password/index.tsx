"use client"

import { requestPasswordResetFromForm } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useActionState } from "react"

const ForgotPassword = () => {
  const [message, formAction] = useActionState(
    requestPasswordResetFromForm,
    null
  )

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Reset your password</h1>
      {message?.state === "success" ? (
        <p
          className="text-center text-base-regular text-ui-fg-base mb-8"
          data-testid="forgot-password-success"
        >
          If an account exists for that email, we&apos;ve sent it a link to
          reset the password. The link expires in 15 minutes.
        </p>
      ) : (
        <>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Enter your email and we&apos;ll send you a link to choose a new
            password.
          </p>
          <form className="w-full" action={formAction}>
            <Input
              label="Email"
              name="email"
              type="email"
              title="Enter a valid email address."
              autoComplete="email"
              required
              data-testid="email-input"
            />
            <ErrorMessage
              error={message?.state === "error" ? message.error : null}
              data-testid="forgot-password-error-message"
            />
            <SubmitButton
              data-testid="send-reset-link-button"
              className="w-full mt-6"
            >
              Send reset link
            </SubmitButton>
          </form>
        </>
      )}
      <LocalizedClientLink
        href="/account"
        className="text-small-regular text-ui-fg-base underline mt-6"
        data-testid="back-to-sign-in-link"
      >
        Back to sign in
      </LocalizedClientLink>
    </div>
  )
}

export default ForgotPassword
