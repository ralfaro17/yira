const status = {
  stable: "Estable",
  observation: "Observación",
  critical: "Crítico",
  unknown: "Sin datos",
  stress: { low: "Bajo", medium: "Medio", high: "Alto" },
  system: {
    cardiovascular: "Cardiovascular",
    immune: "Sistema inmune",
    musculoskeletal: "Óseo-muscular",
    mental: "Salud mental",
  },
  /** Title case, used on the crew detail panel. */
  systemTitle: {
    cardiovascular: "Cardiovascular",
    immune: "Sistema Inmune",
    musculoskeletal: "Óseo-Muscular",
    mental: "Salud Mental",
  },
  /** "Emergencia actual" title when a system is degraded. */
  systemIssue: {
    cardiovascular: "Crisis cardiovascular",
    immune: "Respuesta inmune",
    musculoskeletal: "Desgaste óseo-muscular",
    mental: "Estrés y salud mental",
  },
}

export default status
