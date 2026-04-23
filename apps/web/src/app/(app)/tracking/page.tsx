"use client"

import { useState } from "react"
import { Switch, Card, Tabs, Typography } from "antd"
import { BarChart3, LayoutGrid, CheckSquare, Info } from "lucide-react"
import { domains } from "@/lib/data"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { SectionHeader } from "@/components/section-header"

const { Text, Title } = Typography

const domainColorMap: Record<string, string> = {
  "bg-chart-1": "bg-blue-500",
  "bg-chart-2": "bg-orange-500",
  "bg-chart-3": "bg-green-500",
  "bg-chart-4": "bg-cyan-500",
  "bg-chart-5": "bg-violet-500",
}

type CompetenceState = {
  seen: boolean
  acquired: boolean
}

export default function SuiviPage() {
  const [competenceStates, setCompetenceStates] = useState<Record<string, CompetenceState>>(() => {
    const initial: Record<string, CompetenceState> = {}
    domains.forEach((domain) => {
      domain.subdomains.forEach((subdomain) => {
        subdomain.competences.forEach((competence) => {
          initial[competence.id] = {
            seen: competence.status === "seen" || competence.status === "acquired",
            acquired: competence.status === "acquired",
          }
        })
      })
    })
    return initial
  })

  const handleSeenChange = (id: string, checked: boolean) => {
    setCompetenceStates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        seen: checked,
        acquired: checked ? prev[id].acquired : false,
      },
    }))
  }

  const handleAcquiredChange = (id: string, checked: boolean) => {
    setCompetenceStates((prev) => ({
      ...prev,
      [id]: {
        seen: checked ? true : prev[id].seen,
        acquired: checked,
      },
    }))
  }

  const calculateProgress = () => {
    return domains.map((domain) => {
      const allCompetences = domain.subdomains.flatMap((s) => s.competences)
      const total = allCompetences.length
      const acquired = allCompetences.filter((c) => competenceStates[c.id]?.acquired).length
      const seen = allCompetences.filter(
        (c) => competenceStates[c.id]?.seen && !competenceStates[c.id]?.acquired,
      ).length

      return {
        id: domain.id,
        name: domain.name,
        color: domain.color,
        total,
        acquired,
        seen,
        progress: Math.round((acquired / total) * 100),
      }
    })
  }

  const progress = calculateProgress()
  const totalCompetences = progress.reduce((sum, d) => sum + d.total, 0)
  const totalAcquired = progress.reduce((sum, d) => sum + d.acquired, 0)
  const totalSeen = progress.reduce((sum, d) => sum + d.seen, 0)
  const overallProgress = Math.round((totalAcquired / totalCompetences) * 100)

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Content */}
      <div className="flex-1 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <PageHeader
            title="Mon Suivi"
            description="Suivez l'acquisition des compétences pour votre classe"
            icon={BarChart3}
          />

          {/* Overall Progress Card */}
          <Card
            className="border border-primary/20 bg-primary/5 shadow-sm rounded-xl"
            styles={{ body: { padding: "24px" } }}
          >
            <div className="mb-4">
              <Title level={4} style={{ margin: 0 }}>
                Progression globale
              </Title>
              <Text type="secondary" className="text-sm">
                {totalAcquired} compétences acquises sur {totalCompetences}
              </Text>
            </div>

            <div className="space-y-4">
              {/* Custom Multi-segment Progress Bar */}
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden flex border border-border shadow-inner">
                <div
                  className="h-full bg-green-500 transition-all duration-500 ease-out"
                  style={{ width: `${(totalAcquired / totalCompetences) * 100}%` }}
                />
                <div
                  className="h-full bg-orange-500 transition-all duration-500 ease-out"
                  style={{ width: `${(totalSeen / totalCompetences) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-green-500" />
                    <Text className="text-xs">
                      Acquis: <Text strong>{totalAcquired}</Text>
                      <Text type="secondary" className="ml-1 opacity-60">
                        ({Math.round((totalAcquired / totalCompetences) * 100)}%)
                      </Text>
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm bg-orange-500" />
                    <Text className="text-xs">
                      Vues: <Text strong>{totalSeen}</Text>
                      <Text type="secondary" className="ml-1 opacity-60">
                        ({Math.round((totalSeen / totalCompetences) * 100)}%)
                      </Text>
                    </Text>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Text strong className="text-2xl text-primary leading-none">
                    {overallProgress}%
                  </Text>
                  <Text
                    strong
                    className="text-[10px] text-primary opacity-60 uppercase tracking-tighter"
                  >
                    Acquis
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Progress by Domain */}
          <div className="space-y-4">
            <SectionHeader title="Progression par domaine" icon={LayoutGrid} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {progress.map((domain) => (
                <Card
                  key={domain.id}
                  className="border border-border shadow-sm rounded-xl"
                  styles={{ body: { padding: "16px" } }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-sm shrink-0",
                        domainColorMap[domain.color] ?? "bg-gray-400",
                      )}
                    />
                    <Text strong className="text-sm line-clamp-1">
                      {domain.name.split(" ").slice(0, 3).join(" ")}
                    </Text>
                  </div>

                  <div className="space-y-3">
                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden flex border border-gray-100 shadow-inner">
                      <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${(domain.acquired / domain.total) * 100}%` }}
                      />
                      <div
                        className="h-full bg-orange-500 transition-all duration-500 ease-out"
                        style={{ width: `${(domain.seen / domain.total) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted font-bold uppercase tracking-wider">
                      <div className="flex gap-2">
                        <Text className="text-green-600 m-0" style={{ fontSize: 10 }}>
                          {domain.acquired} Acquis
                        </Text>
                        <Text className="text-orange-600 m-0" style={{ fontSize: 10 }}>
                          {domain.seen} Vues
                        </Text>
                      </div>
                      <Text className="text-primary m-0" style={{ fontSize: 10 }}>
                        {domain.progress}%
                      </Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed tracking */}
          <div className="space-y-4">
            <SectionHeader title="Suivi détaillé" icon={CheckSquare}>
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 border border-primary/20">
                <Info size={14} className="text-primary shrink-0" />
                <Text className="text-[11px] text-primary font-medium leading-tight">
                  <Text strong>Vue</Text> : Présenté &nbsp; | &nbsp; <Text strong>Acquis</Text> :
                  Maîtrisé
                </Text>
              </div>
            </SectionHeader>

            <Card
              className="border border-border shadow-sm overflow-hidden rounded-xl"
              styles={{ body: { padding: 0 } }}
            >
              <Tabs
                defaultActiveKey={domains[0].id}
                className="custom-tracking-tabs"
                items={domains.map((domain) => ({
                  key: domain.id,
                  label: (
                    <div className="flex items-center gap-2 px-2">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-sm shrink-0",
                          domainColorMap[domain.color] ?? "bg-gray-400",
                        )}
                      />
                      <span className="hidden sm:inline">{domain.name.split(" ")[0]}</span>
                      <span className="sm:hidden">{domain.name.split(" ")[0].slice(0, 4)}</span>
                    </div>
                  ),
                  children: (
                    <div className="divide-y divide-border">
                      {domain.subdomains.map((subdomain) => (
                        <div key={subdomain.id}>
                          <div className="bg-surface-secondary px-4 py-3 border-b border-border">
                            <Text strong className="text-sm uppercase tracking-wider block">
                              {subdomain.name}
                            </Text>
                          </div>
                          <div className="divide-y divide-border">
                            {subdomain.competences.map((competence) => {
                              const state = competenceStates[competence.id]
                              return (
                                <div
                                  key={competence.id}
                                  className={cn(
                                    "flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 transition-colors",
                                    state.acquired && "bg-green-50/50",
                                    state.seen && !state.acquired && "bg-orange-50/30",
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <Text strong className="text-sm text-foreground block mb-1">
                                      {competence.title}
                                    </Text>
                                    <Text
                                      type="secondary"
                                      className="text-xs line-clamp-1 leading-normal block"
                                    >
                                      {competence.description}
                                    </Text>
                                  </div>
                                  <div className="flex items-center gap-6 shrink-0">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        size="small"
                                        checked={state.seen}
                                        onChange={(val) => handleSeenChange(competence.id, val)}
                                      />
                                      <Text className="text-sm font-medium text-muted">Vue</Text>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        size="small"
                                        checked={state.acquired}
                                        onChange={(val) => handleAcquiredChange(competence.id, val)}
                                      />
                                      <Text className="text-sm font-medium text-muted">Acquis</Text>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ),
                }))}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
