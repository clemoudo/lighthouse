"use client"

import { FileText, BookOpen, Layers } from "lucide-react"
import { Collapse, Tag, Button, Typography } from "antd"
import { domains, type Competence } from "@/lib/data"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"

const { Text } = Typography

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
        status === "acquired" && "bg-green-500",
        status === "seen" && "bg-orange-500",
        status === "not-seen" && "bg-gray-300",
      )}
    />
  )
}

function StatusChip({ status }: { status: Competence["status"] }) {
  if (status === "acquired") {
    return <Tag color="success">Acquis</Tag>
  }
  if (status === "seen") {
    return <Tag color="warning">Vue</Tag>
  }
  return <Tag color="default">Non vue</Tag>
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-secondary p-4 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background rounded-lg border border-border">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">Statuts de progression</span>
                <p className="text-[11px] text-muted m-0">Suivi des compétences du programme</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm" />
                <span className="text-xs font-semibold text-foreground">Acquis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-sm" />
                <span className="text-xs font-semibold text-foreground">Vue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-300 shadow-sm" />
                <span className="text-xs font-semibold text-foreground">Non vue</span>
              </div>
            </div>
          </div>

          {/* Domains Accordion */}
          <Collapse
            ghost
            className="flex flex-col gap-4 p-0"
            items={domains.map((domain) => ({
              key: domain.id,
              label: (
                <div className="flex items-center gap-4 py-1">
                  <div
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-md shadow-inner",
                      domainColorMap[domain.color] ?? "bg-gray-400",
                    )}
                  />
                  <span className="font-bold text-foreground text-lg leading-tight">
                    {domain.name}
                  </span>
                </div>
              ),
              children: (
                <div className="flex flex-col gap-2 pt-2 pb-0">
                  <Collapse
                    ghost
                    items={domain.subdomains.map((subdomain) => ({
                      key: subdomain.id,
                      label: (
                        <div className="flex items-center gap-3 py-0.5">
                          <span className="text-sm font-bold text-foreground">
                            {subdomain.name}
                          </span>
                          <Tag className="font-bold m-0">{subdomain.competences.length}</Tag>
                        </div>
                      ),
                      children: (
                        <div className="divide-y divide-border bg-surface-secondary/30 -mx-4 -my-3">
                          {subdomain.competences.map((competence) => (
                            <div
                              key={competence.id}
                              className="flex items-start gap-4 px-5 py-5 transition-colors hover:bg-surface-secondary/50"
                            >
                              <div className="mt-1.5">
                                <StatusDot status={competence.status} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-foreground leading-snug mb-1">
                                  {competence.title}
                                </h4>
                                <Text
                                  type="secondary"
                                  className="text-xs leading-relaxed line-clamp-2 m-0 block"
                                >
                                  {competence.description}
                                </Text>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <StatusChip status={competence.status} />
                                {competence.pdfPage && (
                                  <Button
                                    size="small"
                                    icon={<FileText size={14} className="text-primary" />}
                                    className="flex items-center"
                                  >
                                    <span className="hidden sm:inline ml-1">Page </span>
                                    {competence.pdfPage}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    }))}
                  />
                </div>
              ),
              className:
                "border border-border rounded-xl overflow-hidden bg-background shadow-sm px-4",
            }))}
          />
        </div>
      </div>
    </div>
  )
}
