import { useState, useEffect } from 'react'

export function ReverseProxyTest() {
  const [data, setData] = useState<{ message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [reloadKey, setReloadKey] = useState<number>(0)

  useEffect(() => {
    let ignore = false

    fetch('/api/hello/')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`)
        }
        return res.json()
      })
      .then((json: { message: string }) => {
        if (!ignore) {
          setData(json)
          setError(null)
        }
      })
      .catch((err: Error) => {
        if (!ignore) {
          setError(err.message || 'Failed to fetch from backend')
          setData(null)
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [reloadKey])

  const handleRefetch = () => {
    setIsLoading(true)
    setError(null)
    setReloadKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="border-b border-slate-800 pb-3">
          <h1 className="text-xl font-bold text-white">Reverse Proxy & CORS Test</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Querying backend endpoint <code className="text-purple-300">GET /api/hello/</code>
          </p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-sm text-slate-400 animate-pulse">
              Fetching from backend...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 rounded-xl border border-rose-800/50 space-y-1">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Error</span>
              <p className="text-sm font-mono text-slate-200">{error}</p>
            </div>
          ) : data ? (
            <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800/50 space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Success (No CORS Issues)
              </span>
              <p className="text-lg font-mono font-bold text-emerald-300">
                "{data.message}"
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Routed via Reverse Proxy (Vite Dev Server) to Backend
          </span>
          <button
            onClick={handleRefetch}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Fetching...' : 'Re-fetch'}
          </button>
        </div>
      </div>
    </div>
  )
}
