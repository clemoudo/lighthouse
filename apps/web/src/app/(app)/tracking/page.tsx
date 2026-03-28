"use client"

import { useState } from "react"
import { ProgressBar, Switch, Card, Tabs, Label } from "@heroui/react"
import { domains } from "@/lib/data"
import { cn } from "@/lib/utils"

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
    <div className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
      {/* Header */}
      <div className="border-b border-default-200 bg-background px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">Mon Suivi</h1>
          <p className="text-default-500">Progression des compétences par domaine</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Overall Progress Card */}
          <Card className="border border-primary/20 bg-primary/5">
            <Card.Header className="pb-2">
              <Card.Title className="text-lg font-semibold text-foreground">
                Progression globale
              </Card.Title>
              <Card.Description className="text-sm text-default-500">
                {totalAcquired} compétences acquises sur {totalCompetences}
              </Card.Description>
            </Card.Header>
            <Card.Content className="pt-0">
              <div className="space-y-2">
                <ProgressBar
                  value={overallProgress}
                  maxValue={100}
                  aria-label="Progression globale"
                  color="accent"
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-success-500" />
                      <span className="text-default-500">
                        Acquis: <span className="font-medium text-foreground">{totalAcquired}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-warning-500" />
                      <span className="text-default-500">
                        Vues: <span className="font-medium text-foreground">{totalSeen}</span>
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold">{overallProgress}%</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Progress by Domain */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress.map((domain) => (
              <Card key={domain.id}>
                <Card.Header className="pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-sm shrink-0",
                        domainColorMap[domain.color] ?? "bg-default-400",
                      )}
                    />
                    <Card.Title className="text-sm font-medium line-clamp-1">
                      {domain.name.split(" ").slice(0, 3).join(" ")}
                    </Card.Title>
                  </div>
                </Card.Header>
                <Card.Content className="pt-0">
                  <div className="space-y-2">
                    <ProgressBar
                      value={domain.progress}
                      maxValue={100}
                      aria-label={`Progression ${domain.name}`}
                      color={
                        domain.progress >= 80
                          ? "success"
                          : domain.progress >= 40
                            ? "warning"
                            : "default"
                      }
                    >
                      <ProgressBar.Track>
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                    <div className="flex items-center justify-between text-xs text-default-500">
                      <span>
                        {domain.acquired}/{domain.total} acquis
                      </span>
                      <span className="font-medium text-foreground">{domain.progress}%</span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>

          {/* Detailed tracking */}
          <Card>
            <Card.Header className="pb-0">
              <Card.Title className="text-lg font-semibold text-foreground">
                Suivi détaillé par domaine
              </Card.Title>
              <Card.Description className="text-sm text-default-500">
                Marquez les compétences comme vues ou acquises
              </Card.Description>
            </Card.Header>
            <Card.Content className="p-0">
              <Tabs defaultSelectedKey={domains[0].id} variant="secondary" className="w-full">
                <Tabs.ListContainer>
                  <Tabs.List
                    aria-label="Domaines"
                    className="border-b border-default-200 px-4 gap-2 w-full"
                  >
                    {domains.map((domain) => (
                      <Tabs.Tab key={domain.id} id={domain.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-sm shrink-0",
                              domainColorMap[domain.color] ?? "bg-default-400",
                            )}
                          />
                          <span className="hidden sm:inline">{domain.name.split(" ")[0]}</span>
                          <span className="sm:hidden">{domain.name.split(" ")[0].slice(0, 4)}</span>
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
                          <div className="bg-default-50 px-4 py-2">
                            <h4 className="text-sm font-medium text-foreground">
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
                                    "flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4",
                                    state.acquired && "bg-success-50",
                                    !state.seen && !state.acquired && "bg-danger-50/30",
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-foreground mb-1">
                                      {competence.title}
                                    </h5>
                                    <p className="text-xs text-default-500 line-clamp-1">
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
                                      <Label className="text-sm text-default-500">Vue</Label>
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
                                      <Label className="text-sm text-default-500">Acquis</Label>
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
  )
}
