"use client"

import { Card, Tag, Typography, Button, Empty, Row, Col } from "antd"
import { FileText, Download, BookOpen, Clock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { useGetDocuments } from "@/api/generated/lighthouse"

const { Text } = Typography

export default function CurriculumPage() {
  const { data: documentsResponse, isLoading } = useGetDocuments()

  const documents = documentsResponse?.status === 200 ? documentsResponse.data.documents : []

  return (
    <>
      <PageHeader
        title="Référentiel & Programmes"
        description="Consultez les programmes scolaires officiels disponibles pour l'assistant IA."
        icon={BookOpen}
      />

      {documents.length === 0 && !isLoading ? (
        <Card className="flex flex-col items-center justify-center py-12 shadow-sm">
          <Empty
            description="Aucun programme n'a encore été indexé."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {documents.map((doc) => (
            <Col key={doc.id} xs={24} sm={24} md={12} lg={12} xl={8} xxl={6}>
              <Card
                hoverable
                className="shadow-sm overflow-hidden h-full flex flex-col"
                styles={{ body: { flex: 1, display: "flex", flexDirection: "column" } }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary">
                    <FileText size={24} />
                  </div>
                  <div className="min-w-0">
                    <Typography.Title level={5} className="m-0! truncate" title={doc.title}>
                      {doc.title}
                    </Typography.Title>
                    <Text type="secondary" className="text-xs">
                      {(doc.fileSize / 1024 / 1024).toFixed(2)} Mo
                    </Text>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Tag color="blue">Officiel</Tag>
                  <Tag color="green">Indexé</Tag>
                </div>

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Ajouté le {new Date(doc.createdAt).toLocaleDateString("fr-BE")}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<Download size={14} />}
                    className="flex items-center"
                    disabled // On implémentera le téléchargement plus tard si besoin
                  >
                    Consulter
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  )
}
