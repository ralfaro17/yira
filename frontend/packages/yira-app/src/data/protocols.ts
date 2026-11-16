/**
 * Care protocols (Figma frames 25:2, 166:2, 166:18, 166:34). The prose lives in the
 * `protocols` locale area; the getters below read it in the current UI language.
 * Slugs are referenced by the backend (`current_issue.protocol`): keep them stable.
 */
import i18n from "@/i18n"

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
  readonly categoryLabel: string
  code: string
  readonly title: string
  /** Text on the Protocolos list card. */
  readonly description: string
  /** Line under the title on the detail page. */
  readonly subtitle: string
  durationMinutes: number
  readonly steps: ProtocolStep[]
  readonly guidance: {
    direction: string
    team: string
    body: string
    note: { title: string; text: string }
  }
  /** Two-line note left of the footer buttons. */
  readonly footerNote: [string, string]
  /** Primary action label ("Iniciar protocolo", ...). */
  readonly startLabel: string
}

function defineProtocol(
  slug: ProtocolSlug,
  category: ProtocolCategory,
  code: string,
  durationMinutes: number,
  stepCount: number,
): Protocol {
  const tr = (key: string) => i18n.t(`protocols.items.${slug}.${key}`)
  return {
    slug,
    category,
    code,
    durationMinutes,
    get categoryLabel() {
      return i18n.t(`protocols.category.${category}`)
    },
    get title() {
      return tr("title")
    },
    get description() {
      return tr("description")
    },
    get subtitle() {
      return tr("subtitle")
    },
    get steps() {
      return Array.from({ length: stepCount }, (_, i) => ({
        number: i + 1,
        title: tr(`steps.${i + 1}.title`),
        detail: tr(`steps.${i + 1}.detail`),
      }))
    },
    get guidance() {
      return {
        direction: i18n.t("protocols.guidance.direction"),
        team: i18n.t("protocols.guidance.team"),
        body: tr("guidance.body"),
        note: { title: tr("guidance.noteTitle"), text: tr("guidance.noteText") },
      }
    },
    get footerNote(): [string, string] {
      return [tr("footer1"), tr("footer2")]
    },
    get startLabel() {
      return tr("start")
    },
  }
}

export const PROTOCOLS: Protocol[] = [
  defineProtocol("crisis-cardiovascular", "emergency", "EM-01", 12, 6),
  defineProtocol("estres-salud-mental", "observation", "OB-02", 8, 4),
  defineProtocol("cuidado-oseo-muscular", "preventive", "PR-03", 30, 5),
]

export function getProtocol(slug: string | undefined): Protocol | undefined {
  return PROTOCOLS.find((p) => p.slug === slug)
}

/** "6 pasos · 12 min" / "6 steps · 12 min" */
export function protocolMeta(protocol: Protocol): string {
  return i18n.t("protocols.meta", { count: protocol.steps.length, minutes: protocol.durationMinutes })
}
