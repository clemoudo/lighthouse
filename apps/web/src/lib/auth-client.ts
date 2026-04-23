import { createAuthClient } from "better-auth/react"

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth`
    : "http://lighthouse.local/api/auth",
  fetchOptions: {
    credentials: "include",
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
