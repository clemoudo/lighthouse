export const messages = {
  common: {
    appName: "Lighthouse",
    appSubtitle: "Programme Scolaire",
    cycle: "Maternelle - Cycle 1",
    acquired: "Acquis",
    seen: "Vue",
    notSeen: "Non vue",
    page: "Page",
  },
  recherche: {
    semanticSearch: "Recherche sémantique",
    title: "Rechercher une compétence",
    description: "Trouvez rapidement les compétences du programme par sens ou mot-clé",
    placeholder: "Rechercher une compétence par sens...",
    startSearch: {
      title: "Commencez votre recherche",
      description:
        "Tapez un mot-clé ou une phrase pour trouver les compétences correspondantes dans le programme scolaire.",
    },
    noResults: {
      title: "Aucun résultat",
      description: "Essayez avec d'autres mots-clés",
    },
    results: {
      found: (count: number) =>
        `${count} résultat${count > 1 ? "s" : ""} trouvé${count > 1 ? "s" : ""}`,
      score: (percent: number) => `${percent}% pertinent`,
      viewPage: (page: number) => `Voir page ${page}`,
    },
    suggestions: ["oral", "compter", "formes", "couleurs", "chansons"],
  },
  referentiel: {
    title: "Référentiel",
    subtitle: "Programme scolaire - Cycle 1 Maternelle",
    legend: "Légende :",
  },
  suivi: {
    title: "Mon Suivi",
    subtitle: "Progression des compétences par domaine",
    overallProgress: {
      title: "Progression globale",
      description: (acquired: number, total: number) =>
        `${acquired} compétences acquises sur ${total}`,
      legendAcquired: "Acquis",
      legendSeen: "Vues",
    },
    domainProgress: {
      stats: (acquired: number, total: number) => `${acquired}/${total} acquis`,
    },
    detailed: {
      title: "Suivi détaillé par domaine",
      subtitle: "Marquez les compétences comme vues ou acquises",
    },
  },
  navigation: {
    search: {
      name: "Recherche",
      description: "Recherche sémantique",
    },
    repository: {
      name: "Référentiel",
      description: "Programme scolaire",
    },
    followUp: {
      name: "Mon Suivi",
      description: "Progression",
    },
    menu: "Menu",
  },
} as const

export type Messages = typeof messages
