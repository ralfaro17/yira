import { useParams, useSearchParams } from 'react-router'
import { ResetPasswordCard } from '@/features/auth/components/ResetPasswordCard'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export function ResetPasswordPage() {
  const { key: keyFromParams } = useParams<{ key?: string }>()
  const [searchParams] = useSearchParams()

  const resetKey = keyFromParams || searchParams.get('key') || undefined

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-[#fff9ef] via-white to-[#ffe8df] overflow-x-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#e51422]/10 rounded-full blur-3xl opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-40 right-10 w-[450px] h-[300px] bg-[#ffc900]/15 rounded-full blur-3xl opacity-50"
        aria-hidden="true"
      />

      <main className="relative z-10 w-full flex items-center justify-center">
        <ResetPasswordCard>
          <ResetPasswordForm resetKey={resetKey} />
        </ResetPasswordCard>
      </main>
    </div>
  )
}
