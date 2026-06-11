import { createAuthClient } from "better-auth/react"
import { adminClient, emailOTPClient, anonymousClient } from "better-auth/client/plugins"

const authClient = createAuthClient({
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    adminClient(),
    emailOTPClient(),
    anonymousClient(),
    {
      id: "user-helper",
      getActions: ($fetch) => ({
        checkEmail: async ({ email }: { email: string }) => {
          return $fetch<{ exists: boolean }>("/check-email", {
            method: "GET",
            query: { email },
          })
        },
        clearData: async () => {
          return $fetch<{ success: boolean }>("/clear-data", {
            method: "POST",
          })
        },
      }),
    },
  ],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  updateUser,
  changePassword,
  deleteUser,
  sendVerificationEmail,
  emailOtp,
} = authClient

export { authClient }
