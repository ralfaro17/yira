import { useTranslation } from "react-i18next"
import { Link } from "react-router"

import { GlassPanel } from "@/components/yira/GlassPanel"
import { PageHeading } from "@/components/yira/PageHeading"
import { PROTOCOL_THEME } from "@/components/yira/protocols/theme"
import { PROTOCOLS, protocolMeta, type Protocol } from "@/data/protocols"
import { cn } from "@/lib/utils"

/** Figma 25:2 "Protocolos". */
export function ProtocolsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-8 md:gap-[38px]">
      <PageHeading title={t("protocols.page.title")} subtitle={t("protocols.page.subtitle")} />
      <ul className="grid gap-6 md:grid-cols-3">
        {PROTOCOLS.map((protocol) => (
          <li key={protocol.slug}>
            <ProtocolCard protocol={protocol} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProtocolCard({ protocol }: { protocol: Protocol }) {
  const { t } = useTranslation()
  const theme = PROTOCOL_THEME[protocol.category]
  return (
    <GlassPanel className="h-full gap-3.5 p-7 md:min-h-[400px]">
      <span className={cn("self-start rounded-pill px-[18px] py-1.5 text-lg font-medium", theme.chip)}>
        {protocol.categoryLabel}
      </span>
      <h2 className="text-[30px] leading-tight font-extrabold text-white">{protocol.title}</h2>
      <p className="text-[17px] leading-[23px] text-white/85">{protocol.description}</p>
      <p className="text-base font-medium text-white/90">{protocolMeta(protocol)}</p>
      <div className="min-h-2 flex-1" />
      <Link
        to={`/protocolos/${protocol.slug}`}
        className={cn(
          "flex items-center justify-center gap-2.5 self-start rounded-pill bg-white px-6 py-3 text-xl font-medium transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-white/50 focus-visible:outline-none",
          theme.buttonText,
        )}
      >
        {t("protocols.page.view")}
        <img src={theme.arrow} alt="" width={24} height={24} className="size-6" />
      </Link>
    </GlassPanel>
  )
}
