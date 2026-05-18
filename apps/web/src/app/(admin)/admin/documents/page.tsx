"use client"

import { useMemo } from "react"
import { Card } from "antd"
import { LayoutDashboard } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { useGetDocuments } from "@/api/generated/lighthouse"
import { UploadCard } from "./_components/UploadCard"
import { DocumentsTable } from "./_components/DocumentsTable"

export default function AdminDocumentsPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

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

  return (
    <div className="p-6">
      <PageHeader
        title="Administration des Documents"
        description="Gérez les programmes scolaires et les ressources du RAG."
        icon={LayoutDashboard}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne Upload */}
        <UploadCard />

        {/* Colonne Liste */}
        <Card title="Documents indexés" className="lg:col-span-2 shadow-sm">
          <DocumentsTable documents={documents} loading={isLoadingDocuments} />
        </Card>
      </div>
    </div>
  )
}
