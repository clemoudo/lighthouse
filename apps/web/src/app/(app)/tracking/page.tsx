"use client"

import { useState } from "react"
import { Switch, Card, Tabs, Label, ProgressBar } from "@heroui/react"
import { BarChart3, LayoutGrid, CheckSquare, Info } from "lucide-react"
import { domains } from "@/lib/data"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { SectionHeader } from "@/components/section-header"

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
          <Card className="border border-primary/20 bg-primary/5 shadow-sm rounded-xl">
            <Card.Header className="pb-2">
              <Card.Title className="text-lg font-bold text-foreground">
                Progression globale
              </Card.Title>
              <Card.Description className="text-sm text-default-600">
                {totalAcquired} compétences acquises sur {totalCompetences}
              </Card.Description>
            </Card.Header>
            <Card.Content className="pt-0">
              <div className="space-y-4">
                <ProgressBar
                  aria-label="Progression globale"
                  value={totalAcquired}
                  maxValue={totalCompetences}
                >
                  <ProgressBar.Track className="flex h-3 overflow-hidden border border-default-200/50 shadow-inner">
                    <div
                      className="h-full bg-success transition-all duration-500 ease-out"
                      style={{ width: `${(totalAcquired / totalCompetences) * 100}%` }}
                      title={`Acquis: ${totalAcquired}`}
                    />
                    <div
                      className="h-full bg-warning transition-all duration-500 ease-out"
                      style={{ width: `${(totalSeen / totalCompetences) * 100}%` }}
                      title={`Vue: ${totalSeen}`}
                    />
                    <div
                      className="h-full bg-default-200 transition-all duration-500 ease-out"
                      style={{
                        width: `${((totalCompetences - totalAcquired - totalSeen) / totalCompetences) * 100}%`,
                      }}
                      title={`Non vues: ${totalCompetences - totalAcquired - totalSeen}`}
                    />
                  </ProgressBar.Track>
                </ProgressBar>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-success" />
                      <span className="text-default-600 text-xs">
                        Acquis: <span className="font-bold text-foreground">{totalAcquired}</span>
                        <span className="ml-1 opacity-60">
                          ({Math.round((totalAcquired / totalCompetences) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-warning" />
                      <span className="text-default-600 text-xs">
                        Vues: <span className="font-bold text-foreground">{totalSeen}</span>
                        <span className="ml-1 opacity-60">
                          ({Math.round((totalSeen / totalCompetences) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-default-200" />
                      <span className="text-default-600 text-xs">
                        Non vues:{" "}
                        <span className="font-bold text-foreground">
                          {totalCompetences - totalAcquired - totalSeen}
                        </span>
                        <span className="ml-1 opacity-60">
                          (
                          {Math.round(
                            ((totalCompetences - totalAcquired - totalSeen) / totalCompetences) *
                              100,
                          )}
                          %)
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-2xl text-primary leading-none">
                      {overallProgress}%
                    </span>
                    <span className="text-[10px] font-bold text-primary/60 uppercase tracking-tighter">
                      Acquis
                    </span>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Progress by Domain */}
          <div className="space-y-4">
            <SectionHeader title="Progression par domaine" icon={LayoutGrid} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {progress.map((domain) => (
                <Card key={domain.id} className="border border-default-200 shadow-sm rounded-xl">
                  <Card.Header className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-sm shrink-0",
                          domainColorMap[domain.color] ?? "bg-default-400",
                        )}
                      />
                      <Card.Title className="text-sm font-bold line-clamp-1">
                        {domain.name.split(" ").slice(0, 3).join(" ")}
                      </Card.Title>
                    </div>
                  </Card.Header>
                  <Card.Content className="pt-0">
                    <div className="space-y-3">
                      <ProgressBar
                        aria-label={`Progression ${domain.name}`}
                        value={domain.acquired}
                        maxValue={domain.total}
                        size="sm"
                      >
                        <ProgressBar.Track className="flex h-2 overflow-hidden border border-default-100 shadow-inner">
                          <div
                            className="h-full bg-success transition-all duration-500 ease-out"
                            style={{ width: `${(domain.acquired / domain.total) * 100}%` }}
                          />
                          <div
                            className="h-full bg-warning transition-all duration-500 ease-out"
                            style={{ width: `${(domain.seen / domain.total) * 100}%` }}
                          />
                          <div
                            className="h-full bg-default-200 transition-all duration-500 ease-out"
                            style={{
                              width: `${((domain.total - domain.acquired - domain.seen) / domain.total) * 100}%`,
                            }}
                          />
                        </ProgressBar.Track>
                      </ProgressBar>
                      <div className="flex items-center justify-between text-[10px] text-default-500 font-bold uppercase tracking-wider">
                        <div className="flex gap-2">
                          <span className="text-success">{domain.acquired} Acquis</span>
                          <span className="text-warning">{domain.seen} Vues</span>
                        </div>
                        <span className="text-primary">{domain.progress}%</span>
                      </div>
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed tracking */}
          <div className="space-y-4">
            <SectionHeader title="Suivi détaillé" icon={CheckSquare}>
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 border border-primary/20">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                <p className="text-[11px] text-primary-700 leading-tight">
                  <span className="font-bold">Vue</span> : Présenté &nbsp; | &nbsp;{" "}
                  <span className="font-bold">Acquis</span> : Maîtrisé
                </p>
              </div>
            </SectionHeader>

            <Card className="border border-default-200 shadow-sm overflow-hidden rounded-xl">
              <Card.Content className="p-0">
                <Tabs defaultSelectedKey={domains[0].id} variant="secondary" className="w-full">
                  <Tabs.ListContainer className="bg-default-50/50">
                    <Tabs.List
                      aria-label="Domaines"
                      className="border-b border-default-200 px-4 gap-2 w-full"
                    >
                      {domains.map((domain) => (
                        <Tabs.Tab key={domain.id} id={domain.id} className="py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "h-2 w-2 rounded-sm shrink-0",
                                domainColorMap[domain.color] ?? "bg-default-400",
                              )}
                            />
                            <span className="hidden sm:inline font-medium">
                              {domain.name.split(" ")[0]}
                            </span>
                            <span className="sm:hidden font-medium">
                              {domain.name.split(" ")[0].slice(0, 4)}
                            </span>
                          </div>
                          <Tabs.Indicator />
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>
                  </Tabs.ListContainer>

                  {domains.map((domain) => (
                    <Tabs.Panel key={domain.id} id={domain.id} className="pt-0">
                      <div className="divide-y divide-default-100">
                        {domain.subdomains.map((subdomain) => (
                          <div key={subdomain.id}>
                            <div className="bg-default-100/50 px-4 py-3 border-b border-default-100">
                              <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                {subdomain.name}
                              </h4>
                            </div>
                            <div className="divide-y divide-default-100">
                              {subdomain.competences.map((competence) => {
                                const state = competenceStates[competence.id]
                                return (
                                  <div
                                    key={competence.id}
                                    className={cn(
                                      "flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4 transition-colors",
                                      state.acquired && "bg-success-50/50",
                                      state.seen && !state.acquired && "bg-warning-50/30",
                                    )}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <h5 className="text-sm font-semibold text-foreground mb-1">
                                        {competence.title}
                                      </h5>
                                      <p className="text-xs text-default-600 line-clamp-1 leading-normal">
                                        {competence.description}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0">
                                      <Switch
                                        isSelected={state.seen}
                                        onChange={(val) => handleSeenChange(competence.id, val)}
                                        size="sm"
                                        aria-label={`${competence.title} vue`}
                                      >
                                        <Switch.Control>
                                          <Switch.Thumb />
                                        </Switch.Control>
                                        <Label className="text-sm font-medium text-default-600">
                                          Vue
                                        </Label>
                                      </Switch>
                                      <Switch
                                        isSelected={state.acquired}
                                        onChange={(val) => handleAcquiredChange(competence.id, val)}
                                        size="sm"
                                        aria-label={`${competence.title} acquis`}
                                      >
                                        <Switch.Control>
                                          <Switch.Thumb />
                                        </Switch.Control>
                                        <Label className="text-sm font-medium text-default-600">
                                          Acquis
                                        </Label>
                                      </Switch>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Tabs.Panel>
                  ))}
                </Tabs>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
