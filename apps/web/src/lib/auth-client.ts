import { createAuthClient } from "better-auth/react"
import { env } from "@/env"

const authClient = createAuthClient({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/auth`,
  fetchOptions: {
    credentials: "include",
  },
})

export const { signIn, signUp, signOut, useSession, updateUser, changePassword } = authClient
