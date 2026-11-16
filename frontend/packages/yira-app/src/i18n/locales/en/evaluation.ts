import type es from "../es/evaluation"

const evaluation: typeof es = {
  title: "Evaluation",
  subtitle: "Health status by system · Last scan {{when}}",
  lastScan: "Last scan: {{when}}",
  lastScanLabel: "Last scan",
  viewDetails: "View details",
  viewDetailsOf: "View details for {{name}}",
  back: "←  Back to evaluation",
  photoOf: "Photo of {{name}}",
  crewMember: "Crew member",
  bySystem: "Evaluation by system",
  bySystemSubtitle: "Results from the latest recorded scan",
  driversError: "The factors from the latest scan could not be loaded.",
  retry: "Retry",
  summaryLabel: "Status summary",
  recommendProtocol: "We recommend following the protocol",
  mainDrivers: "Main factors · {{system}}:",
  summary: {
    stableTitle: "Stable status",
    stableText: "All four systems keep the values recorded in {{name}}'s evaluation.",
    observationTitle: "Under observation",
    observationText_one: "{{systems}}. Review this indicator together with {{name}}'s other results.",
    observationText_other: "{{systems}}. Review these indicators together with {{name}}'s other results.",
    criticalTitle: "Critical status",
    criticalText: "{{systems}}. These are {{name}}'s lowest indicators.",
    unknownTitle: "Not enough data",
    unknownText: "There is no recorded scan yet to evaluate {{name}}'s systems.",
  },
}

export default evaluation
