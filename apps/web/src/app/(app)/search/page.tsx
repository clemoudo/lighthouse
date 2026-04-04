"use client"

import { useState, useMemo } from "react"
import { FileText, Sparkles } from "lucide-react"
import { Button, Card, Chip, Description, SearchField, Separator } from "@heroui/react"
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
      {/* Search Area */}
      <div className="sticky top-0 z-20 border-b border-default-200 bg-background/80 backdrop-blur-md px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Rechercher une compétence
            </h1>
          </div>
          <div className="space-y-1.5">
            <SearchField
              aria-label="Rechercher une compétence"
              value={query}
              onChange={handleSearch}
              className="w-full"
            >
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder="Ex: 'compter jusqu'à 10', 'raconter une histoire'..."
                  className="w-full"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Description>
              Trouvez rapidement les compétences du programme par sens ou mot-clé
            </Description>
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
              <h2 className="text-xl font-bold text-foreground mb-3">Commencez votre recherche</h2>
              <p className="text-default-600 max-w-md mb-8 leading-relaxed">
                Tapez un mot-clé ou une phrase pour trouver les compétences correspondantes dans le
                programme scolaire maternel.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {["oral", "compter", "formes", "couleurs", "chansons"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="secondary"
                    size="sm"
                    className="font-semibold px-4"
                    onPress={() => handleSearch(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 rounded-2xl bg-default-100 p-6 border border-default-200">
                <FileText className="h-10 w-10 text-default-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Aucun résultat</h2>
              <p className="text-default-600">{"Essayez avec d'autres termes de recherche"}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-semibold text-default-600">
                  {results.length} résultat{results.length > 1 ? "s" : ""} trouvé
                  {results.length > 1 ? "s" : ""}
                </p>
              </div>

              <div className="grid gap-4">
                {results.map((competence) => (
                  <Card
                    key={competence.id}
                    className="transition-all hover:shadow-lg hover:border-primary/30 border border-default-200 shadow-sm overflow-hidden group rounded-xl"
                  >
                    <Card.Header className="pb-3 flex items-start justify-between gap-6 px-6 pt-6">
                      <div className="flex-1 min-w-0">
                        <Card.Title className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {competence.title}
                        </Card.Title>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <Chip size="sm" variant="secondary" className="font-bold">
                            {competence.domain}
                          </Chip>
                          <span className="text-xs font-bold text-default-400 uppercase tracking-wider">
                            {competence.subdomain}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <Chip
                          size="sm"
                          variant="soft"
                          color="accent"
                          className="font-bold border border-accent-soft-hover"
                        >
                          {competence.score}% pertinent
                        </Chip>
                      </div>
                    </Card.Header>
                    <Card.Content className="pt-0 pb-6 px-6">
                      <Card.Description className="text-sm text-default-600 mb-6 leading-relaxed line-clamp-3">
                        {competence.description}
                      </Card.Description>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between gap-4">
                        <StatusChip status={competence.status} />
                        {competence.pdfPage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="font-semibold text-default-600 hover:text-primary hover:bg-primary/5 transition-all"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Voir page {competence.pdfPage}
                          </Button>
                        )}
                      </div>
                    </Card.Content>
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
