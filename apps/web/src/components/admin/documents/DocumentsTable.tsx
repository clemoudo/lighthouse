"use client"

import { Table, Space, Tag, Tooltip, Popconfirm, Button } from "antd"
import { BrainCircuit, Loader2, RefreshCw, Trash2, CheckCircle2, AlertCircle } from "lucide-react"
import type { Document } from "@/api/generated/model/document"
import type { DocumentStatus } from "@/api/generated/model/documentStatus"
import { useIngestDocument, useDeleteDocument } from "../../../hooks/use-document-mutations"

interface DocumentsTableProps {
  documents: Document[]
  loading: boolean
}

export const DocumentsTable = ({ documents, loading }: DocumentsTableProps) => {
  const { mutate: ingest, isPending: ingesting, variables: ingestingId } = useIngestDocument()
  const { mutate: remove, isPending: deleting, variables: deletingId } = useDeleteDocument()

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
    <Table<Document>
      dataSource={documents}
      loading={loading}
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
            const isIndexed = record.status === "COMPLETED"
            const isProcessing = record.status === "PROCESSING"

            // On vérifie si c'est CETTE ligne qui est en train de muter
            const isThisIngesting = ingesting && ingestingId === record.id
            const isThisDeleting = deleting && deletingId === record.id

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
                    onConfirm={() => ingest(record.id)}
                    okText="Oui"
                    cancelText="Non"
                    disabled={isProcessing || isThisIngesting || isThisDeleting}
                  >
                    <Button
                      type={isIndexed ? "default" : "primary"}
                      icon={
                        isProcessing || isThisIngesting ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : isIndexed ? (
                          <RefreshCw size={16} />
                        ) : (
                          <BrainCircuit size={16} />
                        )
                      }
                      loading={isThisIngesting}
                      disabled={isProcessing || isThisDeleting}
                    >
                      {isIndexed ? "Ré-ingérer" : "Ingérer"}
                    </Button>
                  </Popconfirm>
                </Tooltip>

                <Popconfirm
                  title="Supprimer ce document ?"
                  description="Cette action est irréversible et supprimera également toutes les données d'IA associées."
                  onConfirm={() => remove(record.id)}
                  okText="Supprimer"
                  okButtonProps={{ danger: true }}
                  cancelText="Annuler"
                  disabled={isProcessing || isThisIngesting || isThisDeleting}
                >
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={16} />}
                    loading={isThisDeleting}
                    disabled={isProcessing || isThisIngesting}
                  />
                </Popconfirm>
              </Space>
            )
          },
        },
      ]}
      locale={{ emptyText: "Aucun document pour le moment." }}
    />
  )
}
