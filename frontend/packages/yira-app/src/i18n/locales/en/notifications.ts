import type es from "../es/notifications"

const notifications: typeof es = {
  title: "Notifications",
  loading: "Loading alerts…",
  noUnread: "You have no unread alerts",
  unread_one: "You have {{count}} unread alert",
  unread_other: "You have {{count}} unread alerts",
  marked_one: "{{count}} alert marked as read",
  marked_other: "{{count}} alerts marked as read",
  markError: "The alerts could not be marked. Please try again.",
  marking: "Marking…",
  markAll: "Mark all as read",
  latest: "Latest alerts",
  emptyTitle: "All calm",
  emptyDescription: "There are no alerts recorded for the crew.",
  mascotAlt: "Yiri, the YIRA mascot, waving",
  unreadBadge: " (unread)",
  severity: {
    critical: "critical level",
    warning: "needs attention",
    info: "informational",
  },
  repeated: " · {{count}} times",
  title_: {
    radiationThreshold: "High radiation dose in 24 h",
    threshold: "{{label}} out of range",
    anomaly: "Unusual {{label}}",
    trend: "{{label}} trend",
    radiationCumulative: "Cumulative radiation dose",
    cumulative: "Cumulative {{label}}",
  },
  summary: {
    radiationThreshold: "{{value}} in the last 24 h ({{severity}}){{repeated}}",
    threshold: "{{label}} recorded {{value}} ({{severity}}){{repeated}}",
    anomaly: "{{label}} at {{value}}, far from its usual value{{repeated}}",
    trendUp: "Rising {{value}} {{unit}} per day over the last few days",
    trendDown: "Falling {{value}} {{unit}} per day over the last few days",
    cumulative: "Cumulative dose of {{value}} ({{severity}})",
    noValue: "{{label}}: {{severity}}{{repeated}}",
  },
}

export default notifications
