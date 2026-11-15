import { useCallback, useEffect, useState } from "react"

interface ProtocolProgress {
  /** Completed step numbers. */
  done: number[]
  /** Whether the protocol has been started and not yet finished. */
  active: boolean
}

const EMPTY: ProtocolProgress = { done: [], active: false }

function storageKey(slug: string) {
  return `yira.protocol.${slug}`
}

function load(slug: string): ProtocolProgress {
  try {
    const raw = window.localStorage.getItem(storageKey(slug))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<ProtocolProgress>
    return {
      done: Array.isArray(parsed.done) ? parsed.done.filter((n): n is number => typeof n === "number") : [],
      active: parsed.active === true,
    }
  } catch {
    return EMPTY
  }
}

/** Checklist + "started" state of one protocol, persisted per slug in localStorage. */
export function useProtocolProgress(slug: string) {
  const [progress, setProgress] = useState<ProtocolProgress>(() => load(slug))

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(slug), JSON.stringify(progress))
    } catch {
      // Storage unavailable (private mode, quota): keep the in-memory state only.
    }
  }, [slug, progress])

  const toggleStep = useCallback((step: number, checked: boolean) => {
    setProgress((p) => ({
      ...p,
      done: checked ? [...new Set([...p.done, step])] : p.done.filter((n) => n !== step),
    }))
  }, [])

  const start = useCallback(() => setProgress((p) => ({ ...p, active: true })), [])
  const finish = useCallback(() => setProgress(EMPTY), [])

  return { ...progress, toggleStep, start, finish }
}
