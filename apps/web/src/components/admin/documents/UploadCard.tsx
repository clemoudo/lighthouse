"use client"

import { useState } from "react"
import { Upload, Button, Card, App, Space } from "antd"
import { Upload as UploadIcon, FileText } from "lucide-react"
import type { UploadFile } from "antd/es/upload/interface"
import { useUploadDocument } from "../../../hooks/use-document-mutations"

const UploadCard = () => {
  const { message } = App.useApp()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const { mutate: upload, isPending: uploading } = useUploadDocument()

  const handleUpload = () => {
    const file = fileList[0]
    if (!file) {
      message.warning("Veuillez sélectionner un fichier")
      return
    }

    // Ant Design wraps the file in an UploadFile object.
    // The actual File object is in originFileObj, but if set directly in beforeUpload it might be the file itself.
    const actualFile = (file.originFileObj as File) || (file as unknown as File)

    if (!actualFile) {
      message.error("Impossible de récupérer le fichier")
      return
    }

    upload(actualFile, {
      onSuccess: () => {
        setFileList([])
      },
    })
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

  return (
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
  )
}

export default UploadCard
