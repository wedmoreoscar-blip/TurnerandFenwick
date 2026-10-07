"use client"

import React, { useActionState } from "react"
import { requestPasswordResetForCustomer } from "@lib/data/customer"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

// Medusa's email-and-password login has no "change password with the old
// one" route, so the password is changed through the reset email instead
// (docs/decisions.md, "Phase 2 settings").
const ProfilePassword: React.FC<MyInformationProps> = ({ customer }) => {
  const [message, formAction] = useActionState(
    requestPasswordResetForCustomer,
    null
  )

  return (
    <form
      action={formAction}
      className="w-full text-small-regular"
      data-testid="account-password-editor"
    >
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-ui-fg-base">Password</span>
          <span data-testid="current-info">
            {message?.state === "success"
              ? `We've sent a link to ${customer.email} to choose a new password.`
              : "To change your password, we'll email you a link."}
          </span>
        </div>
        <SubmitButton
          variant="secondary"
          className="min-h-[25px] py-1"
          data-testid="send-reset-link-button"
        >
          Send link
        </SubmitButton>
      </div>
      <ErrorMessage
        error={message?.state === "error" ? message.error : null}
        data-testid="password-error-message"
      />
    </form>
  )
}

export default ProfilePassword
