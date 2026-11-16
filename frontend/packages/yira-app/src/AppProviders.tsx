import { useEffect, useState, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter } from "react-router"
import { useTranslation } from "react-i18next"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/ThemeProvider"
import { LanguageSync } from "@/components/yira/LanguageSwitch"
import "@/i18n"

/** Query client, router, theme and toasts shared by every YIRA app. */
export function AppProviders({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  // Re-render the whole tree when the language changes so module-level copy
  // (STATUS labels, metric names...) is read again in the new language.
  useTranslation()
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
          <LanguageSync />
          {children}
          {extra}
        </BrowserRouter>
      </ThemeProvider>
      <Toaster theme="dark" position="top-center" richColors />
    </QueryClientProvider>
  )
}
