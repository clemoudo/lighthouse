import { env } from "@/env"

/**
 * Interface représentant la structure attendue par Orval pour ses réponses.
 */
export interface OrvalResponse<TData = unknown> {
  data: TData
  status: number
  headers: Headers
}

/**
 * Custom fetch client for Orval.
 *
 * @param url - L'URL relative de l'endpoint (ex: /documents)
 * @param config - Options de fetch incluant les paramètres de requête et les données
 * @returns Une promesse résolvant vers le type T (le contrat Orval)
 */
export const customFetch = async <T>(
  url: string,
  config: RequestInit & {
    params?: Record<string, string | number | boolean | undefined | null>
    data?: unknown
  },
): Promise<T> => {
  const { method, params, data, headers, signal, ...rest } = config

  // 1. Construction de l'URL avec les query params
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

  // 2. Exécution de la requête
  const response = await fetch(fullUrl, {
    ...rest,
    method: method?.toUpperCase(),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal,
    credentials: "include",
  })

  // 3. Gestion des erreurs HTTP
  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => ({}))
    const message =
      errorBody && typeof errorBody === "object" && "message" in errorBody
        ? String(errorBody.message)
        : `HTTP error! status: ${response.status}`
    throw new Error(message)
  }

  // 4. Extraction des données
  let responseData: unknown = null

  // On ne tente de parser le JSON que s'il y a du contenu (évite l'erreur sur 204 No Content)
  if (
    response.status !== 204 &&
    response.headers.get("content-type")?.includes("application/json")
  ) {
    responseData = await response.json()
  }

  // 5. Fulfillment du contrat Orval.
  const result: OrvalResponse = {
    data: responseData,
    status: response.status,
    headers: response.headers,
  }

  return result as T
}

export default customFetch
