"use client"

import { resetPassword } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { useActionState } from "react"

type Props = {
  token: string
  email?: string
}

const ResetPassword = ({ token, email }: Props) => {
  const [message, formAction] = useActionState(resetPassword, null)

  if (message?.state === "success") {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center text-center gap-y-4"
        data-testid="reset-password-success"
      >
        <h1 className="text-large-semi uppercase">Password changed</h1>
        <p className="text-base-regular text-ui-fg-base">
          Your password has been changed. You can now sign in with it.
        </p>
        <LocalizedClientLink href="/account">
          <Button variant="primary">Go to sign in</Button>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Choose a new password</h1>
      {email && (
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          For <strong>{email}</strong>
        </p>
      )}
      <form className="w-full" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirm new password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            data-testid="confirm-password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="reset-password-error-message"
        />
        <SubmitButton
          data-testid="reset-password-button"
          className="w-full mt-6"
        >
          Change password
        </SubmitButton>
      </form>
      <LocalizedClientLink
        href="/reset-password"
        className="text-small-regular text-ui-fg-base underline mt-6"
        data-testid="request-new-link"
      >
        Request a new link
      </LocalizedClientLink>
    </div>
  )
}

export default ResetPassword
