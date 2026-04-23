import { env } from "@/env"

/**
 * Custom fetch client for Orval
 * Matches the signature: (url, config)
 * Using native Fetch types for maximum compatibility
 */
export const customFetch = async <T>(
  url: string,
  config: RequestInit & {
    params?: Record<string, string | number | boolean | undefined | null>
    data?: unknown
  },
): Promise<T> => {
  const { method, params, data, headers, signal, ...rest } = config

  // Construct query string from params object safely
  let queryParams = ""
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      queryParams = `?${queryString}`
    }
  }

  const baseUrl = env.NEXT_PUBLIC_API_URL
  const fullUrl = `${baseUrl}${url}${queryParams}`

  const response = await fetch(fullUrl, {
    ...rest,
    method: method?.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal,
    // Crucial for Better Auth (cross-origin cookies)
    credentials: "include",
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export default customFetch
