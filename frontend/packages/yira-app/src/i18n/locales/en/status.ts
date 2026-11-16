import type es from "../es/status"

const status: typeof es = {
  stable: "Stable",
  observation: "Observation",
  critical: "Critical",
  unknown: "No data",
  stress: { low: "Low", medium: "Medium", high: "High" },
  system: {
    cardiovascular: "Cardiovascular",
    immune: "Immune system",
    musculoskeletal: "Musculoskeletal",
    mental: "Mental health",
  },
  systemTitle: {
    cardiovascular: "Cardiovascular",
    immune: "Immune System",
    musculoskeletal: "Musculoskeletal",
    mental: "Mental Health",
  },
  systemIssue: {
    cardiovascular: "Cardiovascular crisis",
    immune: "Immune response",
    musculoskeletal: "Musculoskeletal wear",
    mental: "Stress and mental health",
  },
}

export default status
