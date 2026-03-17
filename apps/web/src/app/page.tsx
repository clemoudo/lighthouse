"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui"
import { Loader2, Send, RotateCcw, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react"

const API_HOST = process.env.NEXT_PUBLIC_API_HOST

export default function Web() {
  // 1. TanStack Query: Handle the API call
  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await fetch(`${API_HOST}/message/${encodeURIComponent(name)}`)
      if (!result.ok) throw new Error("Le service de bienvenue est indisponible.")
      return result.json() as Promise<{ message: string }>
    },
  })

  // 2. TanStack Form: Handle form state and validation
  const form = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value.name)
    },
  })

  // Handle manual reset of both form and mutation states
  const handleReset = () => {
    form.reset()
    mutation.reset()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6 bg-background selection:bg-primary/10">
      {/* Subtle background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] h-75 w-75 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] h-62.5 w-62.5 rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="w-full max-w-105 space-y-6">
        {/* Minimalist Header */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-4 ring-1 ring-primary/10">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Lighthouse
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Votre assistant intelligent pour explorer le programme scolaire belge.
          </p>
        </div>

        {/* Main Connection Card */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">Connexion</CardTitle>
            <CardDescription className="text-xs">
              Veuillez vous identifier pour commencer.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-5"
            >
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    !value || value.length < 2
                      ? "Le nom doit contenir au moins 2 caractères."
                      : undefined,
                }}
                children={(field) => (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor={field.name}
                        className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5"
                      >
                        Nom d'utilisateur
                      </label>
                      {field.state.meta.errors.length > 0 && (
                        <span className="text-[10px] font-medium text-destructive animate-in fade-in duration-300">
                          {field.state.meta.errors[0]}
                        </span>
                      )}
                    </div>

                    <Input
                      name={field.name}
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Sophie Martin"
                      required
                      disabled={mutation.isPending}
                      className={`h-11 border-border/60 bg-background/50 transition-all duration-300 ${
                        field.state.meta.errors.length > 0
                          ? "border-destructive/50 ring-destructive/10"
                          : "focus-visible:ring-primary/20"
                      }`}
                    />
                  </div>
                )}
              />

              <Button
                type="submit"
                className="w-full h-11 font-semibold transition-all duration-300 active:scale-95 shadow-md shadow-primary/5"
                disabled={mutation.isPending || (form.state.isTouched && !form.state.canSubmit)}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Accéder au programme
                    <Send className="ml-2 h-3.5 w-3.5 opacity-60" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Unified Feedback Section within the Card */}
          {(mutation.isError || mutation.isSuccess) && (
            <div
              className={`border-t border-border/40 p-5 animate-in fade-in slide-in-from-top-2 duration-500 ${
                mutation.isError
                  ? "bg-red-50/20 dark:bg-red-950/10"
                  : "bg-emerald-50/20 dark:bg-emerald-950/10"
              }`}
            >
              {mutation.isError && (
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-medium leading-relaxed">{mutation.error.message}</p>
                </div>
              )}

              {mutation.isSuccess && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Connecté
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-foreground/90">
                    {mutation.data.message}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-7 px-0 text-[11px] text-muted-foreground hover:text-primary hover:bg-transparent"
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Changer de compte
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <footer className="pt-8 flex flex-col items-center gap-4 animate-in fade-in duration-1000">
          <div className="h-px w-8 bg-border/60" />
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.2em] font-medium">
            TFE © 2026 — EPHEC Brussels
          </p>
        </footer>
      </div>
    </main>
  )
}
