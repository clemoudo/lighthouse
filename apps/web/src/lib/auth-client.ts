import { createAuthClient } from "better-auth/react"
import { adminClient, emailOTPClient } from "better-auth/client/plugins"
import { env } from "@/env"

const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    adminClient(),
    emailOTPClient(),
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
} = authClient

export { authClient }
