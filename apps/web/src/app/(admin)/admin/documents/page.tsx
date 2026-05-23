"use client"

import { useMemo } from "react"
import { Card, Button } from "antd"
import { LayoutDashboard, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useGetDocuments } from "@/api/generated/lighthouse"
import UploadCard from "@/components/admin/documents/UploadCard"
import { DocumentsTable } from "@/components/admin/documents/DocumentsTable"

const AdminDocumentsPage = () => {
  const {
    data: documentsResponse,
    isLoading: isLoadingDocuments,
    refetch,
    isFetching,
  } = useGetDocuments()

  const documents = useMemo(
    () => (documentsResponse?.status === 200 ? documentsResponse.data.documents : []),
    [documentsResponse],
  )

  return (
    <>
      <PageHeader
        title="Administration des documents"
        description="Gérez les programmes scolaires et les ressources du RAG."
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne Upload */}
        <UploadCard />

        {/* Colonne Liste */}
        <Card
          title="Documents indexés"
          className="lg:col-span-2 shadow-sm"
          extra={
            <Button
              icon={<RefreshCw className={isFetching ? "animate-spin" : ""} size={16} />}
              onClick={() => refetch()}
              loading={isFetching}
            >
              Actualiser
            </Button>
          }
        >
          <DocumentsTable documents={documents} loading={isLoadingDocuments || isFetching} />
        </Card>
      </div>
    </>
  )
}

export default AdminDocumentsPage
