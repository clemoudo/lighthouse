import { useMutation, useQueryClient } from "@tanstack/react-query"
import { message } from "antd"
import { env } from "@/env"
import { getGetDocumentsQueryKey } from "@/api/generated/lighthouse"

export const useUploadDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })

      const text = await response.text()
      let result
      try {
        result = JSON.parse(text)
      } catch {
        result = { error: text }
      }

      if (!response.ok) {
        throw new Error(result.message || result.error || `Erreur HTTP ${response.status}`)
      }

      return result
    },
    onSuccess: () => {
      message.success("Document téléchargé avec succès")
      queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    },
    onError: (error: Error) => {
      console.error("[UPLOAD_ERROR]", error)
      message.error(error.message || "Échec du téléchargement")
    },
  })
}

export const useIngestDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents/${id}/ingest`, {
        method: "POST",
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || "Échec de l'ingestion")
      }

      return result
    },
    onSuccess: () => {
      message.info("L'ingestion a démarré en arrière-plan.")
      queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    },
    onError: (error: Error) => {
      console.error("[INGEST_ERROR]", error)
      message.error(error.message || "Erreur lors du lancement de l'ingestion")
    },
  })
}

export const useDeleteDocument = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || "Échec de la suppression")
      }

      return result
    },
    onSuccess: () => {
      message.success("Document supprimé avec succès")
      queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    },
    onError: (error: Error) => {
      console.error("[DELETE_ERROR]", error)
      message.error(error.message || "Erreur lors de la suppression")
    },
  })
}
