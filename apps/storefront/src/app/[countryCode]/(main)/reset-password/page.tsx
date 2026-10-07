import { Metadata } from "next"

import ForgotPassword from "@modules/account/components/forgot-password"
import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Choose a new password for your account.",
}

// One page for both steps, like the Medusa admin's: without a token it asks
// for the email to send a link to; with the token from that email it asks for
// the new password. The backend's reset email links here.
export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await props.searchParams

  return (
    <div className="w-full flex justify-center px-8 py-12">
      {token ? (
        <ResetPassword token={token} email={email} />
      ) : (
        <ForgotPassword />
      )}
    </div>
  )
}
