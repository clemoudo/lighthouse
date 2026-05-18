"use client"

import { useState, useMemo } from "react"
import { Upload, Button, Card, Table, message, Space, Tag, Tooltip, Popconfirm } from "antd"
import {
  Upload as UploadIcon,
  FileText,
  Trash2,
  LayoutDashboard,
  BrainCircuit,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import type { UploadFile } from "antd/es/upload/interface"
import { env } from "@/env"
import { useGetDocuments } from "@/api/generated/lighthouse"
import { useQueryClient } from "@tanstack/react-query"
import { getGetDocumentsQueryKey } from "@/api/generated/lighthouse"
import type { Document } from "@/api/generated/model/document"
import { DocumentStatus } from "@/api/generated/model/documentStatus"

export default function AdminDocumentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [ingestingId, setIngestingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Récupération des documents avec polling si nécessaire
  const { data: documentsResponse, isLoading: isLoadingDocuments } = useGetDocuments({
    query: {
      refetchInterval: (query) => {
        const data = query.state.data
        const docs = data?.data?.documents
        return docs?.some((d) => d.status === "PROCESSING") ? 3000 : false
      },
    },
  })

  const documents = useMemo(
    () => (documentsResponse?.status === 200 ? documentsResponse.data.documents : []),
    [documentsResponse],
  )

  // Verification simple du rôle
  if (!isPending && session?.user.role !== "admin") {
    router.push("/")
    return null
  }

  const handleUpload = async () => {
    const file = fileList[0]
    if (!file) {
      message.warning("Veuillez sélectionner un fichier")
      return
    }

    const actualFile: File = file.originFileObj || (file as unknown as File)
    const formData = new FormData()
    formData.append("file", actualFile)

    setUploading(true)

    try {
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

      message.success("Document téléchargé avec succès")
      setFileList([])
      await queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    } catch (error) {
      console.error("[UPLOAD_ERROR]", error)
      message.error(error instanceof Error ? error.message : "Échec du téléchargement")
    } finally {
      setUploading(false)
    }
  }

  const handleIngest = async (id: string) => {
    setIngestingId(id)
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents/${id}/ingest`, {
        method: "POST",
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || "Échec de l'ingestion")
      }

      message.info("L'ingestion a démarré en arrière-plan.")
      await queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    } catch (error) {
      console.error("[INGEST_ERROR]", error)
      message.error(
        error instanceof Error ? error.message : "Erreur lors du lancement de l'ingestion",
      )
    } finally {
      setIngestingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || "Échec de la suppression")
      }

      message.success("Document supprimé avec succès")
      await queryClient.invalidateQueries({ queryKey: getGetDocumentsQueryKey() })
    } catch (error) {
      console.error("[DELETE_ERROR]", error)
      message.error(error instanceof Error ? error.message : "Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  const props = {
    onRemove: (file: UploadFile) => {
      const index = fileList.indexOf(file)
      const newFileList = fileList.slice()
      newFileList.splice(index, 1)
      setFileList(newFileList)
    },
    beforeUpload: (file: UploadFile) => {
      const isPdf = file.type === "application/pdf"
      if (!isPdf) {
        message.error("Vous ne pouvez uploader que des fichiers PDF !")
        return Upload.LIST_IGNORE
      }
      setFileList([file])
      return false
    },
    fileList,
  }

  const getStatusTag = (status: DocumentStatus, error?: string | null) => {
    switch (status) {
      case "PENDING":
        return <Tag color="default">En attente</Tag>
      case "PROCESSING":
        return (
          <Tag icon={<Loader2 className="animate-spin" size={12} />} color="processing">
            Traitement IA...
          </Tag>
        )
      case "COMPLETED":
        return (
          <Tag icon={<CheckCircle2 size={12} />} color="success">
            Indexé
          </Tag>
        )
      case "FAILED":
        return (
          <Tooltip title={error || "Erreur inconnue"}>
            <Tag icon={<AlertCircle size={12} />} color="error">
              Échec
            </Tag>
          </Tooltip>
        )
      default:
        return <Tag>{status}</Tag>
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Administration des Documents"
        description="Gérez les programmes scolaires et les ressources du RAG."
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne Upload */}
        <Card title="Importer un nouveau programme" className="shadow-sm">
          <Space orientation="vertical" className="w-full" size="large">
            <Upload.Dragger {...props} maxCount={1} accept=".pdf">
              <p className="ant-upload-drag-icon flex justify-center py-4">
                <FileText size={48} color="var(--color-primary)" />
              </p>
              <p className="ant-upload-text px-4">
                Cliquez ou glissez un fichier PDF ici pour l'importer
              </p>
              <p className="ant-upload-hint px-4 text-xs">
                Format supporté : PDF uniquement. Taille max : 50 Mo.
              </p>
            </Upload.Dragger>

            <Button
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0}
              loading={uploading}
              block
              icon={<UploadIcon size={16} />}
            >
              {uploading ? "Téléchargement..." : "Lancer l'importation"}
            </Button>
          </Space>
        </Card>

        {/* Colonne Liste */}
        <Card title="Documents indexés" className="lg:col-span-2 shadow-sm">
          <Table<Document>
            dataSource={documents}
            loading={isLoadingDocuments}
            rowKey="id"
            columns={[
              {
                title: "Titre",
                dataIndex: "title",
                key: "title",
                render: (text) => <span className="font-medium">{text}</span>,
              },
              {
                title: "Date d'ajout",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date) =>
                  new Date(date).toLocaleDateString("fr-BE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  }),
              },
              {
                title: "Statut",
                key: "status",
                render: (_, record) => getStatusTag(record.status, record.error),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record) => {
                  const isIndexed = record.status === DocumentStatus.COMPLETED
                  const isProcessing = record.status === DocumentStatus.PROCESSING

                  return (
                    <Space>
                      <Tooltip
                        title={
                          isIndexed
                            ? "Mettre à jour l'indexation (remplace les données existantes)"
                            : "Lancer l'ingestion IA (Parsing + Vectorisation)"
                        }
                      >
                        <Popconfirm
                          title={isIndexed ? "Ré-ingérer le document ?" : "Lancer l'ingestion ?"}
                          description={
                            isIndexed
                              ? "Les anciennes données d'IA pour ce document seront supprimées et remplacées."
                              : "Cela va consommer des crédits API pour le parsing et les embeddings."
                          }
                          onConfirm={() => handleIngest(record.id)}
                          okText="Oui"
                          cancelText="Non"
                          disabled={isProcessing}
                        >
                          <Button
                            type={isIndexed ? "default" : "primary"}
                            icon={
                              isProcessing ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : isIndexed ? (
                                <RefreshCw size={16} />
                              ) : (
                                <BrainCircuit size={16} />
                              )
                            }
                            loading={ingestingId === record.id}
                            disabled={isProcessing}
                          >
                            {isIndexed ? "Ré-ingérer" : "Ingérer"}
                          </Button>
                        </Popconfirm>
                      </Tooltip>

                      <Popconfirm
                        title="Supprimer ce document ?"
                        description="Cette action est irréversible et supprimera également toutes les données d'IA associées."
                        onConfirm={() => handleDelete(record.id)}
                        okText="Supprimer"
                        okButtonProps={{ danger: true }}
                        cancelText="Annuler"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<Trash2 size={16} />}
                          loading={deletingId === record.id}
                        />
                      </Popconfirm>
                    </Space>
                  )
                },
              },
            ]}
            locale={{ emptyText: "Aucun document pour le moment." }}
          />
        </Card>
      </div>
    </div>
  )
}
