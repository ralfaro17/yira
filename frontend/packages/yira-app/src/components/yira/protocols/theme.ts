import type { ProtocolCategory } from "@/data/protocols"

interface ProtocolTheme {
  /** Solid category chip (bg + text). */
  chip: string
  /** Accent text (step numbers, "TIERRA → TRIPULACIÓN", note title). */
  accent: string
  /**
   * Step checkbox circle: tinted when pending, filled when done. Includes the
   * `dark:` variants because the base Checkbox sets dark-mode backgrounds.
   */
  stepCheckbox: string
  /** Progress bar fill. */
  bar: string
  /** Text colour on white pill buttons. */
  buttonText: string
  /** 24px "Flecha" arrow matching `buttonText` (same assets as the status arrows). */
  arrow: string
}

export const PROTOCOL_THEME: Record<ProtocolCategory, ProtocolTheme> = {
  emergency: {
    chip: "bg-critical text-white",
    accent: "text-[#ff626c]",
    stepCheckbox:
      "bg-[rgba(255,98,108,0.17)] dark:bg-[rgba(255,98,108,0.17)] data-checked:border-[#ff626c] data-checked:bg-[#ff626c] data-checked:text-white dark:data-checked:bg-[#ff626c]",
    bar: "bg-[#ff626c]",
    buttonText: "text-critical",
    arrow: "/yira/common/arrow-critical.svg",
  },
  observation: {
    chip: "bg-observation text-[#382e00]",
    accent: "text-observation",
    stepCheckbox:
      "bg-[rgba(248,223,0,0.17)] dark:bg-[rgba(248,223,0,0.17)] data-checked:border-observation data-checked:bg-observation data-checked:text-[#382e00] dark:data-checked:bg-observation",
    bar: "bg-observation",
    buttonText: "text-[#f90]",
    arrow: "/yira/common/arrow-observation.svg",
  },
  preventive: {
    chip: "bg-brand text-white",
    accent: "text-[#74b6ff]",
    stepCheckbox:
      "bg-[rgba(116,182,255,0.17)] dark:bg-[rgba(116,182,255,0.17)] data-checked:border-[#74b6ff] data-checked:bg-[#74b6ff] data-checked:text-[#002a66] dark:data-checked:bg-[#74b6ff]",
    bar: "bg-[#74b6ff]",
    buttonText: "text-brand",
    arrow: "/yira/common/arrow-stable.svg",
  },
}

/** Text colour of the primary (white) action button on the detail page. */
export const PROTOCOL_PRIMARY_TEXT: Record<ProtocolCategory, string> = {
  emergency: "text-critical",
  observation: "text-black",
  preventive: "text-brand",
}
