"use client"

import { useMemo } from "react"
import { Card, Button } from "antd"
import { LayoutDashboard, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useGetDocuments } from "@/api/generated/lighthouse"
import UploadCard from "./_components/UploadCard"
import { DocumentsTable } from "./_components/DocumentsTable"

export default function AdminDocumentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  // Récupération des documents
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

  // Verification simple du rôle
  if (!isPending && session?.user.role !== "admin") {
    router.push("/")
    return null
  }

  return (
    <>
      <PageHeader
        title="Administration des Documents"
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
