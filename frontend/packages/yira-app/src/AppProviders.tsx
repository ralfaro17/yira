import { useEffect, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/ThemeProvider"

/** Query client, router, theme and toasts shared by every YIRA app. */
export function AppProviders({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      }),
  )

  useEffect(() => {
    document.title = "YIRA"
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <BrowserRouter>
          {children}
          {extra}
        </BrowserRouter>
      </ThemeProvider>
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  )
}
