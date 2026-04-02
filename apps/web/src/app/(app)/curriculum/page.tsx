"use client"

import { FileText, ChevronDown, BookOpen, Layers } from "lucide-react"
import { Accordion, Chip, Button } from "@heroui/react"
import { domains, type Competence } from "@/lib/data"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"

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
    <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Content */}
      <div className="flex-1 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <PageHeader
            title="Référentiel"
            description="Cycle 1 - Enseignement Maternel"
            icon={BookOpen}
            className="mb-8"
          />

          {/* Legend */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-default-50 p-4 rounded-xl border border-default-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border border-default-200">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div>
                <span className="text-sm font-bold text-foreground">Statuts de progression</span>
                <p className="text-[11px] text-default-500">Suivi des compétences du programme</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-success shadow-sm" />
                <span className="text-xs font-semibold text-default-700">Acquis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-warning shadow-sm" />
                <span className="text-xs font-semibold text-default-700">Vue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-default-300 shadow-sm" />
                <span className="text-xs font-semibold text-default-700">Non vue</span>
              </div>
            </div>
          </div>

          {/* Domains Accordion */}
          <Accordion allowsMultipleExpanded className="gap-4">
            {domains.map((domain) => (
              <Accordion.Item
                key={domain.id}
                id={domain.id}
                className="border border-default-200 rounded-xl overflow-hidden bg-background shadow-sm"
              >
                <Accordion.Heading>
                  <Accordion.Trigger className="py-5 px-5 hover:bg-default-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "h-4 w-4 shrink-0 rounded-md shadow-inner",
                          domainColorMap[domain.color] ?? "bg-default-400",
                        )}
                      />
                      <span className="font-bold text-foreground text-lg leading-tight text-left">
                        {domain.name}
                      </span>
                    </div>
                    <Accordion.Indicator>
                      <ChevronDown className="h-5 w-5 text-default-400" />
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
                            <Accordion.Trigger className="px-5 py-4 hover:bg-default-50/80 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-foreground">
                                  {subdomain.name}
                                </span>
                                <Chip size="sm" variant="secondary" className="font-bold">
                                  {subdomain.competences.length}
                                </Chip>
                              </div>
                              <Accordion.Indicator>
                                <ChevronDown className="h-4 w-4 text-default-400" />
                              </Accordion.Indicator>
                            </Accordion.Trigger>
                          </Accordion.Heading>
                          <Accordion.Panel>
                            <Accordion.Body className="p-0">
                              {/* Competences */}
                              <div className="divide-y divide-default-100 bg-default-50/30">
                                {subdomain.competences.map((competence) => (
                                  <div
                                    key={competence.id}
                                    className="flex items-start gap-4 px-5 py-5 transition-colors hover:bg-default-100/50"
                                  >
                                    <div className="mt-1.5">
                                      <StatusDot status={competence.status} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-bold text-foreground leading-snug mb-1">
                                        {competence.title}
                                      </h4>
                                      <p className="text-xs text-default-600 leading-relaxed line-clamp-2">
                                        {competence.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <StatusChip status={competence.status} />
                                      {competence.pdfPage && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-9 font-medium text-default-600 border border-default-200"
                                        >
                                          <FileText className="h-4 w-4 mr-1.5 text-primary" />
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
