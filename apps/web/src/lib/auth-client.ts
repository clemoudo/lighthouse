import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { env } from "@/env"

const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/auth`,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [adminClient()],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  updateUser,
  changePassword,
  sendVerificationEmail,
} = authClient

export { authClient }
