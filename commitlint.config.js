module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allowed types regarding CONTRIBUTING.md
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "build", "ci", "perf", "style"],
    ],
    // Allowed scopes regarding CONTRIBUTING.md
    "scope-enum": [2, "always", ["web", "api", "ai", "ui", "db", "infra"]],
    // Description in lowercase (subject) - Disabled to allow uppercase (e.g. GEMINI.md)
    "subject-case": [0],
    // No full stop
    "subject-full-stop": [2, "never", "."],
  },
}
