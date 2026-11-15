/**
 * Static content of the three care protocols (Figma frames 25:2, 166:2, 166:18, 166:34).
 * Slugs are referenced by the backend (`current_issue.protocol`): keep them stable.
 */

export type ProtocolCategory = "emergency" | "observation" | "preventive"

export type ProtocolSlug = "crisis-cardiovascular" | "estres-salud-mental" | "cuidado-oseo-muscular"

export interface ProtocolStep {
  number: number
  title: string
  detail: string
}

export interface Protocol {
  slug: ProtocolSlug
  category: ProtocolCategory
  /** Chip label: "Emergencia" / "Observación" / "Preventivo". */
  categoryLabel: string
  code: string
  title: string
  /** Text on the Protocolos list card. */
  description: string
  /** Line under the title on the detail page. */
  subtitle: string
  durationMinutes: number
  steps: ProtocolStep[]
  guidance: {
    direction: string
    team: string
    body: string
    note: { title: string; text: string }
  }
  /** Two-line note left of the footer buttons. */
  footerNote: [string, string]
  /** Primary action label ("Iniciar protocolo", ...). */
  startLabel: string
}

const GUIDANCE_DIRECTION = "TIERRA  →  TRIPULACIÓN"
const GUIDANCE_TEAM = "Equipo médico · Tierra"

export const PROTOCOLS: Protocol[] = [
  {
    slug: "crisis-cardiovascular",
    category: "emergency",
    categoryLabel: "Emergencia",
    code: "EM-01",
    title: "Crisis cardiovascular",
    description: "Activa el monitoreo continuo, avisa al médico de vuelo y prepara el resumen para la Tierra.",
    subtitle: "Respuesta inmediata y acompañamiento médico desde Tierra.",
    durationMinutes: 12,
    steps: [
      { number: 1, title: "Interrumpe la actividad", detail: "Permanece acompañado y avisa al médico de vuelo." },
      { number: 2, title: "Activa el monitoreo continuo", detail: "Comprueba los sensores y la señal de telemetría." },
      { number: 3, title: "Comunica los síntomas", detail: "Describe qué sientes y cuándo comenzó." },
      { number: 4, title: "Comparte los registros", detail: "Envía signos vitales y evolución al equipo en Tierra." },
      { number: 5, title: "Sigue la indicación médica", detail: "Aplica solo las medidas indicadas por el médico." },
      { number: 6, title: "Registra y reevalúa", detail: "Anota los cambios y mantén el enlace de seguimiento." },
    ],
    guidance: {
      direction: GUIDANCE_DIRECTION,
      team: GUIDANCE_TEAM,
      body: "Prioriza la seguridad del tripulante. Mantén la telemetría y la comunicación con el médico de vuelo.",
      note: {
        title: "Atención prioritaria",
        text: "Ante un empeoramiento, avisa de inmediato. No administres medicación sin indicación médica.",
      },
    },
    footerNote: ["Actúa con el médico de vuelo.", "No esperes al envío para solicitar ayuda."],
    startLabel: "Iniciar protocolo",
  },
  {
    slug: "estres-salud-mental",
    category: "observation",
    categoryLabel: "Observación",
    code: "OB-02",
    title: "Estrés y salud mental",
    description: "Seguimiento diario del ánimo, pausas guiadas y sesión de apoyo con el equipo en Tierra.",
    subtitle: "Una pausa para recuperar el equilibrio, con apoyo desde Tierra.",
    durationMinutes: 8,
    steps: [
      { number: 1, title: "Registra cómo te sientes", detail: "Describe tu ánimo, descanso y nivel de tensión." },
      { number: 2, title: "Haz una pausa guiada", detail: "Busca un espacio tranquilo y respira cómodamente." },
      { number: 3, title: "Conecta con tu equipo de apoyo", detail: "Comparte tus sensaciones con el equipo en Tierra." },
      { number: 4, title: "Acuerda el próximo seguimiento", detail: "Registra los cambios y confirma la próxima sesión." },
    ],
    guidance: {
      direction: GUIDANCE_DIRECTION,
      team: GUIDANCE_TEAM,
      body: "Reserva este momento para ti. Comparte cómo te sientes; el equipo de apoyo te acompaña desde Tierra.",
      note: {
        title: "No tienes que hacerlo a solas",
        text: "Si el malestar aumenta o no te sientes seguro, contacta al médico de vuelo de inmediato.",
      },
    },
    footerNote: ["Tu bienestar también forma parte de la misión.", "Comparte cómo te sientes con el equipo."],
    startLabel: "Comenzar seguimiento",
  },
  {
    slug: "cuidado-oseo-muscular",
    category: "preventive",
    categoryLabel: "Preventivo",
    code: "PR-03",
    title: "Cuidado óseo-muscular",
    description:
      "Rutina de resistencia y control de densidad ósea para mantener el cuerpo fuerte en microgravedad.",
    subtitle: "Movimiento y seguimiento para cuidar tu cuerpo en microgravedad.",
    durationMinutes: 30,
    steps: [
      { number: 1, title: "Revisa tu plan del día", detail: "Confirma con Tierra la carga y el equipo asignados." },
      { number: 2, title: "Prepara el cuerpo", detail: "Realiza la movilidad indicada antes de comenzar." },
      { number: 3, title: "Completa la resistencia guiada", detail: "Sigue las series prescritas y comprueba tus anclajes." },
      { number: 4, title: "Recupera y registra sensaciones", detail: "Finaliza con la recuperación e hidratación indicadas." },
      { number: 5, title: "Envía tu seguimiento", detail: "Comparte la sesión y los controles óseos programados." },
    ],
    guidance: {
      direction: GUIDANCE_DIRECTION,
      team: GUIDANCE_TEAM,
      body: "La constancia cuida tu fuerza. Sigue tu rutina personalizada y envíanos cómo responde tu cuerpo.",
      note: {
        title: "Tu cuerpo marca el límite",
        text: "No aumentes la carga por tu cuenta. Detén el ejercicio si aparece dolor o mareo y comunícalo.",
      },
    },
    footerNote: ["Sigue únicamente la carga prescrita por Tierra.", "Si aparece dolor, detén la rutina y comunícalo."],
    startLabel: "Comenzar rutina",
  },
]

export function getProtocol(slug: string | undefined): Protocol | undefined {
  return PROTOCOLS.find((p) => p.slug === slug)
}

/** "6 pasos · 12 min" */
export function protocolMeta(protocol: Protocol): string {
  return `${protocol.steps.length} pasos · ${protocol.durationMinutes} min`
}
