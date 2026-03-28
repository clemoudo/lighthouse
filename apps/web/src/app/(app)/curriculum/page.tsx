"use client"

import { FileText, ChevronDown } from "lucide-react"
import { Accordion, Chip, Button } from "@heroui/react"
import { domains, type Competence } from "@/lib/data"
import { cn } from "@/lib/utils"

const domainColorMap: Record<string, string> = {
  "bg-chart-1": "bg-blue-500",
  "bg-chart-2": "bg-orange-500",
  "bg-chart-3": "bg-green-500",
  "bg-chart-4": "bg-cyan-500",
  "bg-chart-5": "bg-violet-500",
}

function StatusDot({ status }: { status: Competence["status"] }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        status === "acquired" && "bg-success-500",
        status === "seen" && "bg-warning-500",
        status === "not-seen" && "bg-default-300",
      )}
    />
  )
}

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
  return (
    <Chip size="sm" variant="secondary">
      Non vue
    </Chip>
  )
}

export default function ReferentielPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Header */}
      <div className="border-b border-default-200 bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Référentiel</h1>
          <p className="text-default-500">Programme scolaire - Cycle 1 Maternelle</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Legend */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-default-500">Légende :</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm">Acquis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-sm">Vue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-default" />
              <span className="text-sm">Non vue</span>
            </div>
          </div>

          {/* Domains Accordion */}
          <Accordion allowsMultipleExpanded className="gap-4">
            {domains.map((domain) => (
              <Accordion.Item key={domain.id} id={domain.id}>
                <Accordion.Heading>
                  <Accordion.Trigger className="py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-3 w-3 shrink-0 rounded-sm",
                          domainColorMap[domain.color] ?? "bg-default-400",
                        )}
                      />
                      <span className="font-medium text-left">{domain.name}</span>
                    </div>
                    <Accordion.Indicator>
                      <ChevronDown className="h-4 w-4" />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="p-0">
                    {/* Subdomains */}
                    <Accordion allowsMultipleExpanded className="border-t border-default-200">
                      {domain.subdomains.map((subdomain) => (
                        <Accordion.Item key={subdomain.id} id={subdomain.id}>
                          <Accordion.Heading>
                            <Accordion.Trigger className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {subdomain.name}
                                </span>
                                <Chip size="sm" variant="secondary" className="ml-1">
                                  {subdomain.competences.length}
                                </Chip>
                              </div>
                              <Accordion.Indicator>
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Accordion.Indicator>
                            </Accordion.Trigger>
                          </Accordion.Heading>
                          <Accordion.Panel>
                            <Accordion.Body className="p-0">
                              {/* Competences */}
                              <div className="divide-y divide-default-100 bg-default-50/50">
                                {subdomain.competences.map((competence) => (
                                  <div
                                    key={competence.id}
                                    className="flex items-start gap-4 px-4 py-4"
                                  >
                                    <StatusDot status={competence.status} />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-foreground leading-tight mb-1">
                                        {competence.title}
                                      </h4>
                                      <p className="text-xs text-default-500 line-clamp-2">
                                        {competence.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <StatusChip status={competence.status} />
                                      {competence.pdfPage && (
                                        <Button variant="ghost" size="sm" className="h-8">
                                          <FileText className="h-3.5 w-3.5 mr-1" />
                                          <span className="hidden sm:inline">Page </span>
                                          {competence.pdfPage}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Accordion.Body>
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  )
}
