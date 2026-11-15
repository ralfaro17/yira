import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"

import { useCrewMember, useLatestVitals, useRecordScan, useSystems } from "@/api/hooks"
import { errorMessage } from "@/api/client"
import type { DashboardCrew } from "@/api/types"
import { ErrorState, LoadingPanels } from "@/components/yira/QueryState"
import { ScanLastEvaluationPanel, ScanLivePanel, ScanProgressPanel, type ScanPhase } from "@/components/yira/scan/ScanPanels"
import { ScanStage } from "@/components/yira/scan/ScanStage"
import { SCAN_STEPS, currentStep } from "@/components/yira/scan/scanSteps"
import { crewTitle } from "@/lib/status"
import { toast } from "@/lib/toast"

/** Full scan takes ~10 s: 1% every 100 ms. */
const TICK_MS = 100

export function ScanPage() {
  const { id: rawId } = useParams()
  const id = rawId != null && /^\d+$/.test(rawId) ? Number(rawId) : undefined
  const { member, isPending, isError, refetch } = useCrewMember(id)

  if (isPending) return <LoadingPanels />
  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (!member) {
    return (
      <div className="flex flex-col items-center gap-4">
        <ErrorState>No encontramos a este tripulante.</ErrorState>
        <Link to="/tripulacion" className="font-medium text-brand-link hover:underline">
          Volver a Tripulación
        </Link>
      </div>
    )
  }
  // Remount (and restart the scan) when navigating to another crew member.
  return <Scan key={member.id} member={member} />
}

function Scan({ member }: { member: DashboardCrew }) {
  const recordScan = useRecordScan()
  const { mutate: saveScan } = recordScan
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<ScanPhase>("running")
  const running = phase === "running"

  const live = useLatestVitals(member.id, running)
  const systems = useSystems(member.id)
  const current = live.data ?? member
  const status = member.status

  useEffect(() => {
    if (!running) return
    const timer = setTimeout(() => {
      const next = Math.min(100, progress + 1)
      setProgress(next)
      if (next >= 100) {
        setPhase("done")
        // Persist the scan: its time becomes the "Último escaneo" shown everywhere.
        saveScan(member.id, {
          onError: (error) => toast.error(`No se pudo guardar el escaneo. ${errorMessage(error, "")}`.trim()),
        })
      }
    }, TICK_MS)
    return () => clearTimeout(timer)
  }, [running, progress, saveScan, member.id])

  const caption =
    phase === "done"
      ? "Escaneo completado"
      : phase === "paused"
        ? "Escaneo en pausa"
        : `Analizando ${SCAN_STEPS[currentStep(progress)].caption}`

  return (
    <div className="flex flex-col gap-6 md:gap-[19px]">
      <h1 className="text-center text-2xl font-extrabold text-white md:-mt-[13px] md:text-[32px]">
        {phase === "done" ? "Escaneo de" : "Escaneando a"} {crewTitle(member)}
      </h1>

      <div className="grid items-start gap-6 md:grid-cols-[300px_minmax(0,1fr)_300px] md:gap-0">
        <div className="md:col-start-2 md:row-start-1">
          <ScanStage status={status} name={member.name} progress={progress} caption={caption} animate={running} />
        </div>
        <div className="md:col-start-1 md:row-start-1">
          <ScanProgressPanel
            progress={progress}
            phase={phase}
            crewId={member.id}
            onPause={() => setPhase("paused")}
            onResume={() => setPhase("running")}
            onRestart={() => {
              setProgress(0)
              setPhase("running")
            }}
          />
        </div>
        <div className="md:col-start-3 md:row-start-1">
          {status === "observation" ? (
            <ScanLastEvaluationPanel systems={systems.data?.systems ?? member.systems} />
          ) : (
            <ScanLivePanel member={current} />
          )}
        </div>
      </div>
    </div>
  )
}
