import { useMutation, useQueryClient } from "@tanstack/react-query"
import { App } from "antd"
import {
  getGetDocumentsQueryKey,
  postDocumentsUpload,
  postDocumentsIdIngest,
  deleteDocumentsId,
} from "@/api/generated/lighthouse"

export const useUploadDocument = () => {
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => postDocumentsUpload({ file }),
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
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => postDocumentsIdIngest(id),
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
  const { message } = App.useApp()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDocumentsId(id),
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
