import type es from "../es/scan"

const scan: typeof es = {
  steps: {
    vitals: { label: "Vital signs", caption: "vital signs" },
    immune: { label: "Immune system", caption: "immune system" },
    musculoskeletal: { label: "Musculoskeletal", caption: "musculoskeletal system" },
    mental: { label: "Mental health", caption: "mental health" },
  },
  stepState: { done: "Done", running: "In progress", pending: "Pending" },
  progressTitle: "Progress",
  stop: "Stop scan",
  resume: "Resume scan",
  backToProfile: "Back to crew member profile",
  viewResults: "View results",
  repeat: "Repeat scan",
  liveTitle: "Live",
  alert: "Alert: {{title}}",
  heartRate: "Heart rate",
  temperature: "Temperature",
  bloodOxygen: "Blood oxygen",
  stressLevel: "Stress level",
  lastEvaluation: "Last evaluation",
  mascotAlt: "Yiri, the YIRA mascot, scanning {{name}}",
  progressLabel: "Scan progress",
  notFound: "We couldn't find this crew member.",
  backToCrew: "Back to Crew",
  saveError: "The scan could not be saved.",
  completed: "Scan complete",
  paused: "Scan paused",
  analyzing: "Analyzing {{caption}}",
  headingDone: "Scan of {{name}}",
  headingRunning: "Scanning {{name}}",
}

export default scan
