"use client"

import { useState, useMemo } from "react"
import { FileText, Sparkles } from "lucide-react"
import { Input, Button, Card, Chip } from "@heroui/react"
import { searchCompetences, type Competence } from "@/lib/data"

function StatusChip({ status }: { status: Competence["status"] }) {
  if (status === "acquired") {
    return (
      <Chip size="sm" color="success" variant="soft">
        Acquis
      </Chip>
    )
  }
  if (status === "seen") {
    return (
      <Chip size="sm" color="warning" variant="soft">
        Vue
      </Chip>
    )
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
      {/* Header */}
      <div className="border-b border-default-200 bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-default-500 mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Recherche sémantique</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Rechercher une compétence
          </h1>
          <p className="text-default-500">
            Trouvez rapidement les compétences du programme par sens ou mot-clé
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-default-200 bg-default-50 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Input
            aria-label="Rechercher une compétence"
            placeholder="Rechercher une compétence par sens..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
            fullWidth
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-default-100 p-4">
                <Sparkles className="h-8 w-8 text-default-400" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                Commencez votre recherche
              </h2>
              <p className="text-default-500 max-w-md">
                Tapez un mot-clé ou une phrase pour trouver les compétences
                correspondantes dans le programme scolaire.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["oral", "compter", "formes", "couleurs", "chansons"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onPress={() => handleSearch(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-default-100 p-4">
                <FileText className="h-8 w-8 text-default-400" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                Aucun résultat
              </h2>
              <p className="text-default-500">
                {"Essayez avec d'autres mots-clés"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-default-500">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              </p>
              {results.map((competence) => (
                <Card key={competence.id} className="transition-shadow hover:shadow-md">
                  <Card.Header className="pb-2 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Card.Title className="text-base font-semibold text-foreground leading-tight">
                        {competence.title}
                      </Card.Title>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Chip size="sm" variant="secondary">
                          {competence.domain}
                        </Chip>
                        <span className="text-sm text-default-500">
                          {competence.subdomain}
                        </span>
                      </div>
                    </div>
                    <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                      {competence.score}% pertinent
                    </Chip>
                  </Card.Header>
                  <Card.Content className="pt-0 pb-4">
                    <Card.Description className="text-sm text-default-500 mb-4 line-clamp-2">
                      {competence.description}
                    </Card.Description>
                    <div className="flex items-center justify-between gap-4">
                      <StatusChip status={competence.status} />
                      {competence.pdfPage && (
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Voir page {competence.pdfPage}
                        </Button>
                      )}
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
