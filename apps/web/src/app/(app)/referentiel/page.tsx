"use client"

import { FileText, ChevronRight } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  cn,
} from "@repo/ui"
import { domains, type Competence } from "@/lib/data"

function StatusIndicator({ status }: { status: Competence["status"] }) {
  return (
    <div
      className={cn(
        "h-2 w-2 rounded-full shrink-0",
        status === "acquired" && "bg-success",
        status === "seen" && "bg-amber-500",
        status === "not-seen" && "bg-muted-foreground/30",
      )}
    />
  )
}

function StatusBadge({ status }: { status: Competence["status"] }) {
  if (status === "acquired") {
    return <Badge className="bg-success text-success-foreground text-xs">Acquis</Badge>
  }
  if (status === "seen") {
    return (
      <Badge variant="secondary" className="text-xs">
        Vue
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Non vue
    </Badge>
  )
}

export default function ReferentielPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Référentiel</h1>
          <p className="text-muted-foreground">Programme scolaire - Cycle 1 Maternelle</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Domain Legend */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Légende :</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm">Acquis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm">Vue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-sm">Non vue</span>
            </div>
          </div>

          {/* Domains Accordion */}
          <Accordion type="multiple" className="space-y-4">
            {domains.map((domain) => (
              <AccordionItem
                key={domain.id}
                value={domain.id}
                className="border border-border rounded-lg bg-card overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-secondary/50 data-[state=open]:bg-secondary/30">
                  <div className="flex items-center gap-3 text-left">
                    <div className={cn("h-3 w-3 rounded-sm shrink-0", domain.color)} />
                    <span className="font-medium text-foreground">{domain.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  {/* Subdomains */}
                  <Accordion type="multiple" className="border-t border-border">
                    {domain.subdomains.map((subdomain) => (
                      <AccordionItem
                        key={subdomain.id}
                        value={subdomain.id}
                        className="border-b border-border last:border-b-0"
                      >
                        <AccordionTrigger className="px-4 py-3 pl-8 hover:no-underline hover:bg-secondary/30">
                          <div className="flex items-center gap-2 text-left">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {subdomain.name}
                            </span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {subdomain.competences.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-0 pb-0">
                          {/* Competences */}
                          <div className="divide-y divide-border bg-secondary/20">
                            {subdomain.competences.map((competence) => (
                              <div
                                key={competence.id}
                                className="flex items-start gap-4 px-4 py-4 pl-14"
                              >
                                <StatusIndicator status={competence.status} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-foreground leading-tight mb-1">
                                    {competence.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {competence.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <StatusBadge status={competence.status} />
                                  {competence.pdfPage && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1.5 text-primary text-xs"
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Page</span>{" "}
                                      {competence.pdfPage}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}
