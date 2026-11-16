const notifications = {
  title: "Notificaciones",
  loading: "Cargando alertas…",
  noUnread: "No tienes alertas sin leer",
  unread_one: "Tienes {{count}} alerta sin leer",
  unread_other: "Tienes {{count}} alertas sin leer",
  marked_one: "{{count}} alerta marcada como leída",
  marked_other: "{{count}} alertas marcadas como leídas",
  markError: "No se pudieron marcar las alertas. Inténtalo de nuevo.",
  marking: "Marcando…",
  markAll: "Marcar todo como leído",
  latest: "Últimas alertas",
  emptyTitle: "Todo en calma",
  emptyDescription: "No hay alertas registradas para la tripulación.",
  mascotAlt: "Yiri, la mascota de YIRA, saludando",
  unreadBadge: " (sin leer)",
  severity: {
    critical: "nivel crítico",
    warning: "requiere atención",
    info: "informativo",
  },
  repeated: " · {{count}} veces",
  title_: {
    radiationThreshold: "Dosis de radiación elevada en 24 h",
    threshold: "{{label}} fuera de rango",
    anomaly: "{{label}} inusual",
    trend: "Tendencia en {{label}}",
    radiationCumulative: "Dosis de radiación acumulada",
    cumulative: "{{label}} acumulado",
  },
  summary: {
    radiationThreshold: "{{value}} en las últimas 24 h ({{severity}}){{repeated}}",
    threshold: "{{label}} registró {{value}} ({{severity}}){{repeated}}",
    anomaly: "{{label}} en {{value}}, lejos de su valor habitual{{repeated}}",
    trendUp: "Sube {{value}} {{unit}} por día en los últimos días",
    trendDown: "Baja {{value}} {{unit}} por día en los últimos días",
    cumulative: "Dosis acumulada de {{value}} ({{severity}})",
    /** Used when the alert carries no value. */
    noValue: "{{label}}: {{severity}}{{repeated}}",
  },
}

export default notifications
