"use client"

import { useState, useMemo } from "react"
import { Search, FileText, Sparkles } from "lucide-react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@repo/ui"
import { searchCompetences, type Competence } from "@/lib/data"

function StatusBadge({ status }: { status: Competence["status"] }) {
  if (status === "acquired") {
    return <Badge className="bg-success text-success-foreground">Acquis</Badge>
  }
  if (status === "seen") {
    return <Badge variant="secondary">Vue</Badge>
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
      <div className="border-b border-border bg-card px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">Recherche sémantique</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Rechercher une compétence</h1>
          <p className="text-muted-foreground">
            Trouvez rapidement les compétences du programme par sens ou mot-clé
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-border bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une compétence par sens..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-12 pl-11 pr-4 text-base bg-card rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-secondary p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                Commencez votre recherche
              </h2>
              <p className="text-muted-foreground max-w-md">
                Tapez un mot-clé ou une phrase pour trouver les compétences correspondantes dans le
                programme scolaire.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["oral", "compter", "formes", "couleurs", "chansons"].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(suggestion)}
                    className="rounded-md"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-secondary p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">Aucun résultat</h2>
              <p className="text-muted-foreground">Essayez avec d'autres mots-clés</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {results.length} résultat{results.length > 1 ? "s" : ""} trouvé
                {results.length > 1 ? "s" : ""}
              </p>
              {results.map((competence) => (
                <Card key={competence.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">
                          {competence.title}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-normal">
                            {competence.domain}
                          </Badge>
                          <span className="text-muted-foreground">{competence.subdomain}</span>
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-primary/10 text-primary border-primary/20"
                      >
                        {competence.score}% pertinent
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {competence.description}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <StatusBadge status={competence.status} />
                      {competence.pdfPage && (
                        <Button variant="ghost" size="sm" className="gap-2 text-primary">
                          <FileText className="h-4 w-4" />
                          Voir page {competence.pdfPage}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
