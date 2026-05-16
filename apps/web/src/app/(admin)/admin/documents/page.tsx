"use client"

import { useState } from "react"
import { Upload, Button, Card, Table, message, Space, Tag } from "antd"
import { Upload as UploadIcon, FileText, Trash2, LayoutDashboard } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import type { UploadFile } from "antd/es/upload/interface"
import { env } from "@/env"

export default function AdminDocumentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [uploading, setUploading] = useState(false)

  // Verification simple du rôle (en plus du middleware serveur)
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
      console.log(
        "[UPLOAD_START] Sending request to:",
        `${env.NEXT_PUBLIC_API_URL}/admin/documents`,
      )

      const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/admin/documents`, {
        method: "POST",
        body: formData,
        credentials: "include", // CRITIQUE pour envoyer le cookie de session
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
    } catch (error) {
      console.error("[UPLOAD_ERROR]", error)
      message.error(error instanceof Error ? error.message : "Échec du téléchargement")
    } finally {
      setUploading(false)
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
      return false // On empêche l'upload automatique
    },
    fileList,
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Administration des Documents"
        description="Gérez les programmes scolaires et les ressources du RAG."
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 lg:grid-cols-3">
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

        <Card title="Documents indexés" className="lg:col-span-2 shadow-sm">
          <Table
            dataSource={[]}
            columns={[
              { title: "Titre", dataIndex: "title", key: "title" },
              { title: "Date", dataIndex: "createdAt", key: "createdAt" },
              {
                title: "Statut",
                key: "status",
                render: () => <Tag color="blue">En attente d'ingestion</Tag>,
              },
              {
                title: "Actions",
                key: "actions",
                render: () => <Button type="text" danger icon={<Trash2 size={16} />} />,
              },
            ]}
            locale={{ emptyText: "Aucun document pour le moment." }}
          />
        </Card>
      </div>
    </div>
  )
}
