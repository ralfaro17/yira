/** Vital sign names, keyed by the backend metric id. Capitalised noun phrases. */
const metrics = {
  heart_rate: "Ritmo cardíaco",
  hrv_rmssd: "Variabilidad cardíaca",
  spo2: "Oxígeno en sangre",
  systolic_bp: "Presión sistólica",
  diastolic_bp: "Presión diastólica",
  respiratory_rate: "Frecuencia respiratoria",
  body_temp: "Temperatura corporal",
  sleep_duration: "Horas de sueño",
  radiation_dose: "Radiación",
  cabin_co2: "CO₂ en cabina",
  exercise_minutes: "Ejercicio de resistencia",
  /** Driver label the backend emits for the radiation budget (no metric id). */
  radiation_budget: "Presupuesto de radiación usado",
}

export default metrics
