"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Progress,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui"
import { domains } from "@/lib/data"
import { messages } from "@/messages/fr"

type CompetenceState = {
  seen: boolean
  acquired: boolean
}

export default function SuiviPage() {
  // Local state to track competence status changes
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

  // Calculate progress based on local state
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
      <div className="border-b border-border bg-card px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">{messages.suivi.title}</h1>
          <p className="text-muted-foreground">{messages.suivi.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Overall Progress Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{messages.suivi.overallProgress.title}</CardTitle>
              <CardDescription>
                {messages.suivi.overallProgress.description(totalAcquired, totalCompetences)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={overallProgress} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-success" />
                      <span className="text-muted-foreground">
                        {messages.suivi.overallProgress.legendAcquired}:{" "}
                        <span className="font-medium text-foreground">{totalAcquired}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-sm bg-amber-500" />
                      <span className="text-muted-foreground">
                        {messages.suivi.overallProgress.legendSeen}:{" "}
                        <span className="font-medium text-foreground">{totalSeen}</span>
                      </span>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">{overallProgress}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress by Domain */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {progress.map((domain) => (
              <Card key={domain.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-sm", domain.color)} />
                    <CardTitle className="text-sm font-medium line-clamp-1">
                      {domain.name.split(" ").slice(0, 3).join(" ")}...
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={domain.progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {messages.suivi.domainProgress.stats(domain.acquired, domain.total)}
                      </span>
                      <span className="font-medium text-foreground">{domain.progress}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Competence List by Domain */}
          <Card>
            <CardHeader>
              <CardTitle>{messages.suivi.detailed.title}</CardTitle>
              <CardDescription>{messages.suivi.detailed.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={domains[0].id} className="w-full">
                <div className="border-b border-border px-4">
                  <TabsList className="h-auto w-full justify-start gap-2 bg-transparent p-0 flex-wrap">
                    {domains.map((domain) => (
                      <TabsTrigger
                        key={domain.id}
                        value={domain.id}
                        className="rounded-none border-b-2 border-transparent px-3 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                      >
                        <div className={cn("h-2 w-2 rounded-sm mr-2", domain.color)} />
                        <span className="hidden sm:inline">{domain.name.split(" ")[0]}</span>
                        <span className="sm:hidden">{domain.name.split(" ")[0].slice(0, 4)}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                {domains.map((domain) => (
                  <TabsContent key={domain.id} value={domain.id} className="mt-0">
                    <div className="divide-y divide-border">
                      {domain.subdomains.map((subdomain) => (
                        <div key={subdomain.id}>
                          <div className="bg-secondary/30 px-4 py-2">
                            <h4 className="text-sm font-medium text-foreground">
                              {subdomain.name}
                            </h4>
                          </div>
                          <div className="divide-y divide-border">
                            {subdomain.competences.map((competence) => {
                              const state = competenceStates[competence.id]
                              return (
                                <div
                                  key={competence.id}
                                  className={cn(
                                    "flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-4",
                                    state.acquired && "bg-success/5",
                                    !state.seen && !state.acquired && "bg-destructive/5",
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-foreground mb-1">
                                      {competence.title}
                                    </h5>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {competence.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-6 shrink-0">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch
                                        checked={state.seen}
                                        onCheckedChange={(checked) =>
                                          handleSeenChange(competence.id, checked)
                                        }
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        {messages.common.seen}
                                      </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Switch
                                        checked={state.acquired}
                                        onCheckedChange={(checked) =>
                                          handleAcquiredChange(competence.id, checked)
                                        }
                                        className="data-[state=checked]:bg-success"
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        {messages.common.acquired}
                                      </span>
                                    </label>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
