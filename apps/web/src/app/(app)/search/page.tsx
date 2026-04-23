"use client"

import { useState, useMemo } from "react"
import { FileText, Sparkles } from "lucide-react"
import { Button, Card, Tag, Typography, Input, Divider } from "antd"
import { searchCompetences, type Competence } from "@/lib/data"

const { Text, Title } = Typography
const { Search } = Input

function StatusChip({ status }: { status: Competence["status"] }) {
  if (status === "acquired") {
    return <Tag color="success">Acquis</Tag>
  }
  if (status === "seen") {
    return <Tag color="warning">Vue</Tag>
  }
  return null
}

export default function RecherchePage() {
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchCompetences(query)
  }, [query])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim()) {
      setHasSearched(true)
    }
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Search Area */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <Title level={4} style={{ margin: 0 }} className="tracking-tight">
              Rechercher une compétence
            </Title>
          </div>
          <div className="space-y-1.5">
            <Search
              placeholder="Ex: 'compter jusqu'à 10', 'raconter une histoire'..."
              allowClear
              enterButton="Rechercher"
              size="large"
              onSearch={handleSearch}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full"
            />
            <Text type="secondary" className="text-sm">
              Trouvez rapidement les compétences du programme par sens ou mot-clé
            </Text>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 rounded-2xl bg-primary/5 p-6 border border-primary/10 shadow-inner">
                <Sparkles className="h-10 w-10 text-primary animate-pulse" />
              </div>
              <Title level={3} style={{ marginBottom: 12 }}>
                Commencez votre recherche
              </Title>
              <Text type="secondary" className="max-w-md mb-8 leading-relaxed block mx-auto">
                Tapez un mot-clé ou une phrase pour trouver les compétences correspondantes dans le
                programme scolaire maternel.
              </Text>
              <div className="flex flex-wrap justify-center gap-3">
                {["oral", "compter", "formes", "couleurs", "chansons"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="small"
                    className="font-semibold"
                    onClick={() => handleSearch(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 rounded-2xl bg-surface-secondary p-6 border border-border">
                <FileText className="h-10 w-10 text-muted" />
              </div>
              <Title level={3} style={{ marginBottom: 8 }}>
                Aucun résultat
              </Title>
              <Text type="secondary">{"Essayez avec d'autres termes de recherche"}</Text>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <Text strong type="secondary" className="text-sm">
                  {results.length} résultat{results.length > 1 ? "s" : ""} trouvé
                  {results.length > 1 ? "s" : ""}
                </Text>
              </div>

              <div className="grid gap-4">
                {results.map((competence) => (
                  <Card
                    key={competence.id}
                    variant="borderless"
                    className="transition-all hover:shadow-lg hover:border-primary/30 border border-border shadow-sm overflow-hidden group rounded-xl"
                    styles={{ body: { padding: "24px" } }}
                  >
                    <div className="flex items-start justify-between gap-6 mb-4">
                      <div className="flex-1 min-w-0">
                        <Title
                          level={4}
                          style={{ margin: 0 }}
                          className="group-hover:text-primary transition-colors leading-snug"
                        >
                          {competence.title}
                        </Title>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Tag className="font-bold m-0">{competence.domain}</Tag>
                          <Text strong className="text-[10px] text-muted uppercase tracking-wider">
                            {competence.subdomain}
                          </Text>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <Tag color="blue" className="font-bold m-0 px-2 py-0.5 rounded-full">
                          {competence.score}% pertinent
                        </Tag>
                      </div>
                    </div>

                    <Text
                      type="secondary"
                      className="text-sm leading-relaxed line-clamp-3 block mb-6"
                    >
                      {competence.description}
                    </Text>

                    <Divider className="my-4" />

                    <div className="flex items-center justify-between gap-4">
                      <StatusChip status={competence.status} />
                      {competence.pdfPage && (
                        <Button
                          type="text"
                          size="small"
                          className="font-semibold text-muted hover:text-primary transition-all flex items-center p-0"
                          icon={<FileText size={16} />}
                        >
                          Voir page {competence.pdfPage}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
