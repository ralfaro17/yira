import type es from "../es/metrics"

const metrics: typeof es = {
  heart_rate: "Heart rate",
  hrv_rmssd: "Heart rate variability",
  spo2: "Blood oxygen",
  systolic_bp: "Systolic pressure",
  diastolic_bp: "Diastolic pressure",
  respiratory_rate: "Respiratory rate",
  body_temp: "Body temperature",
  sleep_duration: "Hours of sleep",
  radiation_dose: "Radiation",
  cabin_co2: "Cabin CO₂",
  exercise_minutes: "Resistance exercise",
  radiation_budget: "Radiation budget used",
}

export default metrics
