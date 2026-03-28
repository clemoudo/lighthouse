export type Domain = {
  id: string
  name: string
  color: string
  subdomains: Subdomain[]
}

export type Subdomain = {
  id: string
  name: string
  competences: Competence[]
}

export type Competence = {
  id: string
  title: string
  description: string
  domain: string
  subdomain: string
  pdfPage?: number
  status: "not-seen" | "seen" | "acquired"
}

export const domains: Domain[] = [
  {
    id: "francais",
    name: "Mobiliser le langage dans toutes ses dimensions",
    color: "bg-chart-1",
    subdomains: [
      {
        id: "oral",
        name: "L'oral",
        competences: [
          {
            id: "oral-1",
            title: "Communiquer avec les adultes et les autres enfants",
            description: "Oser entrer en communication, échanger et réfléchir avec les autres",
            domain: "Français",
            subdomain: "L'oral",
            pdfPage: 12,
            status: "acquired",
          },
          {
            id: "oral-2",
            title: "S'exprimer dans un langage oral syntaxiquement correct",
            description:
              "Pratiquer divers usages de la langue orale : raconter, décrire, évoquer, expliquer, questionner, proposer des solutions, discuter un point de vue",
            domain: "Français",
            subdomain: "L'oral",
            pdfPage: 14,
            status: "seen",
          },
          {
            id: "oral-3",
            title: "Comprendre des textes écrits sans autre aide que le langage entendu",
            description: "Écouter de l'écrit et comprendre",
            domain: "Français",
            subdomain: "L'oral",
            pdfPage: 16,
            status: "not-seen",
          },
        ],
      },
      {
        id: "ecrit",
        name: "L'écrit",
        competences: [
          {
            id: "ecrit-1",
            title: "Reconnaître les lettres de l'alphabet",
            description:
              "Commencer à écrire tout seul : reconnaître les lettres de l'alphabet, associer le nom d'une lettre à son tracé",
            domain: "Français",
            subdomain: "L'écrit",
            pdfPage: 20,
            status: "seen",
          },
          {
            id: "ecrit-2",
            title: "Écrire son prénom en écriture cursive",
            description: "Commencer à produire des écrits et en découvrir le fonctionnement",
            domain: "Français",
            subdomain: "L'écrit",
            pdfPage: 22,
            status: "not-seen",
          },
        ],
      },
    ],
  },
  {
    id: "math",
    name: "Acquérir les premiers outils mathématiques",
    color: "bg-chart-2",
    subdomains: [
      {
        id: "nombres",
        name: "Découvrir les nombres et leurs utilisations",
        competences: [
          {
            id: "nombres-1",
            title: "Évaluer et comparer des collections d'objets",
            description:
              "Utiliser des procédures non numériques pour comparer : correspondance terme à terme, procédures perceptives",
            domain: "Mathématiques",
            subdomain: "Découvrir les nombres",
            pdfPage: 45,
            status: "acquired",
          },
          {
            id: "nombres-2",
            title: "Réaliser une collection dont le cardinal est donné",
            description: "Dénombrer, constituer et comparer des collections",
            domain: "Mathématiques",
            subdomain: "Découvrir les nombres",
            pdfPage: 47,
            status: "seen",
          },
          {
            id: "nombres-3",
            title: "Utiliser le dénombrement pour comparer deux quantités",
            description:
              "Dire combien il faut ajouter ou enlever pour obtenir des quantités égales",
            domain: "Mathématiques",
            subdomain: "Découvrir les nombres",
            pdfPage: 49,
            status: "not-seen",
          },
        ],
      },
      {
        id: "formes",
        name: "Explorer des formes, des grandeurs, des suites organisées",
        competences: [
          {
            id: "formes-1",
            title: "Classer des objets selon leur forme",
            description:
              "Reconnaître quelques solides et formes planes : carré, triangle, rond, rectangle",
            domain: "Mathématiques",
            subdomain: "Explorer des formes",
            pdfPage: 52,
            status: "acquired",
          },
          {
            id: "formes-2",
            title: "Reproduire un assemblage de formes",
            description: "Assembler des formes pour reproduire un modèle ou créer un assemblage",
            domain: "Mathématiques",
            subdomain: "Explorer des formes",
            pdfPage: 54,
            status: "not-seen",
          },
        ],
      },
    ],
  },
  {
    id: "activites-artistiques",
    name: "Agir, s'exprimer, comprendre à travers les activités artistiques",
    color: "bg-chart-3",
    subdomains: [
      {
        id: "productions-plastiques",
        name: "Les productions plastiques et visuelles",
        competences: [
          {
            id: "plastiques-1",
            title: "Choisir différents outils, médiums, supports",
            description:
              "Pratiquer le dessin pour représenter ou illustrer, en étant fidèle au réel ou à un modèle, ou en inventant",
            domain: "Activités artistiques",
            subdomain: "Productions plastiques",
            pdfPage: 60,
            status: "seen",
          },
          {
            id: "plastiques-2",
            title: "Réaliser des compositions plastiques",
            description:
              "Réaliser des compositions plastiques, seul ou en petit groupe, en choisissant et combinant des matériaux",
            domain: "Activités artistiques",
            subdomain: "Productions plastiques",
            pdfPage: 62,
            status: "acquired",
          },
        ],
      },
      {
        id: "univers-sonores",
        name: "Univers sonores",
        competences: [
          {
            id: "sonores-1",
            title: "Avoir mémorisé un répertoire varié de comptines et de chansons",
            description:
              "Jouer avec sa voix et acquérir un répertoire de comptines et de chansons adapté à son âge",
            domain: "Activités artistiques",
            subdomain: "Univers sonores",
            pdfPage: 65,
            status: "seen",
          },
        ],
      },
    ],
  },
  {
    id: "activites-physiques",
    name: "Agir, s'exprimer, comprendre à travers l'activité physique",
    color: "bg-chart-4",
    subdomains: [
      {
        id: "motricite",
        name: "Agir dans l'espace, dans la durée et sur les objets",
        competences: [
          {
            id: "motricite-1",
            title: "Courir, sauter, lancer de différentes façons",
            description:
              "Ajuster et enchaîner ses actions et ses déplacements en fonction d'obstacles à franchir ou de la trajectoire d'objets",
            domain: "Activité physique",
            subdomain: "Motricité",
            pdfPage: 70,
            status: "not-seen",
          },
          {
            id: "motricite-2",
            title: "Se déplacer avec aisance dans des environnements variés",
            description:
              "Adapter ses équilibres et ses déplacements à des environnements ou contraintes variés",
            domain: "Activité physique",
            subdomain: "Motricité",
            pdfPage: 72,
            status: "seen",
          },
        ],
      },
    ],
  },
  {
    id: "exploration-monde",
    name: "Explorer le monde",
    color: "bg-chart-5",
    subdomains: [
      {
        id: "temps",
        name: "Se repérer dans le temps et l'espace",
        competences: [
          {
            id: "temps-1",
            title: "Situer des événements vécus les uns par rapport aux autres",
            description:
              "Ordonner une suite de photographies ou d'images, pour rendre compte d'une situation vécue ou d'un récit fictif entendu",
            domain: "Explorer le monde",
            subdomain: "Le temps",
            pdfPage: 80,
            status: "acquired",
          },
          {
            id: "temps-2",
            title: "Se repérer dans l'espace d'une page",
            description:
              "Utiliser des marqueurs spatiaux adaptés dans des récits, descriptions ou explications",
            domain: "Explorer le monde",
            subdomain: "L'espace",
            pdfPage: 82,
            status: "not-seen",
          },
        ],
      },
      {
        id: "vivant",
        name: "Explorer le monde du vivant, des objets et de la matière",
        competences: [
          {
            id: "vivant-1",
            title: "Reconnaître et classer les animaux selon leurs caractéristiques",
            description: "Connaître les besoins essentiels de quelques animaux et végétaux",
            domain: "Explorer le monde",
            subdomain: "Le vivant",
            pdfPage: 85,
            status: "seen",
          },
          {
            id: "vivant-2",
            title: "Utiliser des objets numériques simples",
            description: "Utiliser des objets numériques : appareil photo, tablette, ordinateur",
            domain: "Explorer le monde",
            subdomain: "Les objets",
            pdfPage: 88,
            status: "acquired",
          },
        ],
      },
    ],
  },
]

export function getAllCompetences(): Competence[] {
  return domains.flatMap((domain) =>
    domain.subdomains.flatMap((subdomain) => subdomain.competences),
  )
}

export function searchCompetences(query: string): (Competence & { score: number })[] {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return []

  const allCompetences = getAllCompetences()
  const results: (Competence & { score: number })[] = []

  for (const competence of allCompetences) {
    let score = 0
    const searchText =
      `${competence.title} ${competence.description} ${competence.domain} ${competence.subdomain}`.toLowerCase()

    // Check for exact phrase match
    if (searchText.includes(normalizedQuery)) {
      score = 95
    } else {
      // Check for individual word matches
      const queryWords = normalizedQuery.split(/\s+/)
      let matchedWords = 0
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          matchedWords++
        }
      }
      if (matchedWords > 0) {
        score = Math.round((matchedWords / queryWords.length) * 80)
      }
    }

    if (score > 0) {
      // Add some randomness to simulate semantic search
      score = Math.min(99, score + Math.floor(Math.random() * 10))
      results.push({ ...competence, score })
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10)
}

export function getProgressByDomain() {
  return domains.map((domain) => {
    const allCompetences = domain.subdomains.flatMap((s) => s.competences)
    const total = allCompetences.length
    const acquired = allCompetences.filter((c) => c.status === "acquired").length
    const seen = allCompetences.filter((c) => c.status === "seen").length

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
