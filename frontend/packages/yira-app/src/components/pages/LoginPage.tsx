import { useEffect, useState, type FormEvent } from "react"
import { EyeOffIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"

import { errorMessage } from "@/api/client"
import { useLogin, useSession } from "@/api/hooks"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { YiraLogo } from "@/components/yira/AppHeader"
import { GlassPanel } from "@/components/yira/GlassPanel"
import { LanguageSwitch } from "@/components/yira/LanguageSwitch"
import { SpaceBackground } from "@/components/yira/SpaceBackground"
import { ForgotPasswordDialog } from "@/components/yira/login/ForgotPasswordDialog"
import { LoginInputBox, loginInputClass } from "@/components/yira/login/LoginInputBox"
import { LoginMascotScene } from "@/components/yira/login/LoginMascotScene"
import { cn } from "@/lib/utils"

// Demo account seeded by `manage.py simulate_mission` (backend/health/management/commands/simulate_mission.py).
const DEMO_EMAIL = "demo@example.com"
const DEMO_PASSWORD = "demo-password-123"

/** Figma 49:68 "Inicio de sesión personaje animado saludando". */
export function LoginPage() {
  const { t } = useTranslation()
  const session = useSession()
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const [identifier, setIdentifier] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // Already signed in (and not in the middle of this page's own login flow).
  if (session.data && !login.isPending && !login.isSuccess && !isExiting) {
    return <Navigate to="/" replace />
  }

  const from = (location.state as { from?: string } | null)?.from
  const loginError = login.isError ? errorMessage(login.error, t("login.error")) : null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await login.mutateAsync({ login: identifier.trim(), password, remember })
      setIsExiting(true)
      setTimeout(() => {
        navigate(from && from !== "/iniciar-sesion" ? from : "/bienvenida", { replace: true })
      }, 550)
    } catch (error) {
      toast.error(errorMessage(error, t("login.error")))
    }
  }

  return (
    <div className="relative min-h-svh overflow-hidden">
      <SpaceBackground />

      <div className="relative mx-auto flex min-h-svh w-full max-w-[1133px] flex-col px-4 pb-10 md:px-[61px] lg:min-h-[744px]">
        <header className="relative z-20 flex items-center justify-between gap-4 pt-8 md:pt-[62px]">
          <YiraLogo />
          <LanguageSwitch />
        </header>

        <LoginMascotScene isMounted={isMounted} isExiting={isExiting} />

        <main className="relative z-10 mt-6 flex flex-1 flex-col lg:mt-[33px]">
          <GlassPanel
            className={cn(
              "w-full max-w-[440px] gap-[14px] px-6 py-7 max-lg:mx-auto md:px-[34px] transition-all duration-700 ease-out",
              !isMounted && "translate-y-8 opacity-0 scale-[0.98]",
              isMounted && !isExiting && "translate-y-0 opacity-100 scale-100",
              isExiting && "-translate-y-6 opacity-0 scale-[0.97] duration-500 ease-in",
            )}
          >
            <span className="w-fit rounded-pill bg-brand/35 px-[14px] py-[5px] text-[15px] font-medium">
              {t("login.badge")}
            </span>
            <h1 className="text-[32px] font-extrabold leading-normal md:text-[38px]">{t("login.title")}</h1>
            <p className="text-base text-white/80">{t("login.subtitle")}</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[14px]" noValidate>
              <Field className="gap-2" data-invalid={!!loginError || undefined}>
                <FieldLabel htmlFor="login-identifier" className="text-[15px] font-medium text-white/90">
                  {t("login.email")}
                </FieldLabel>
                <LoginInputBox icon="/yira/login/icon-mail.svg">
                  <Input
                    id="login-identifier"
                    name="login"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    required
                    placeholder={t("login.emailPlaceholder")}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    aria-invalid={!!loginError || undefined}
                    className={loginInputClass}
                  />
                </LoginInputBox>
              </Field>

              <Field className="gap-2" data-invalid={!!loginError || undefined}>
                <FieldLabel htmlFor="login-password" className="text-[15px] font-medium text-white/90">
                  {t("login.password")}
                </FieldLabel>
                <LoginInputBox icon="/yira/login/icon-lock.svg">
                  <Input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!loginError || undefined}
                    className={loginInputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                    aria-pressed={showPassword}
                    className="-m-1 flex size-[30px] shrink-0 items-center justify-center rounded-full outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-[22px] text-white" aria-hidden />
                    ) : (
                      <img src="/yira/login/icon-eye.svg" alt="" width={22} height={22} />
                    )}
                  </button>
                </LoginInputBox>
                {loginError && <FieldError className="text-[#ff8a8a]">{loginError}</FieldError>}
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-[15px] text-white/90">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked)}
                    className="size-[18px] rounded-[5px] border-white/50 bg-white/10 data-checked:border-brand data-checked:bg-brand data-checked:text-white dark:data-checked:bg-brand"
                  />
                  {t("login.remember")}
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="rounded-sm text-[15px] font-medium text-brand-link outline-none hover:underline focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  {t("login.forgot")}
                </button>
              </div>

              <button
                type="submit"
                disabled={login.isPending}
                className="flex w-full items-center justify-center gap-[10px] rounded-pill bg-brand px-6 py-4 text-[22px] font-medium text-white shadow-[0px_8px_24px_0px_rgba(0,99,247,0.6)] outline-none transition-colors hover:bg-brand/90 focus-visible:ring-3 focus-visible:ring-white/60 disabled:opacity-70"
              >
                {t("login.submit")}
                {login.isPending ? (
                  <Spinner className="size-6" />
                ) : (
                  <img src="/yira/login/icon-arrow-right.svg" alt="" width={24} height={24} />
                )}
              </button>

              <Tooltip>
                <TooltipTrigger
                  aria-disabled="true"
                  onClick={(e) => e.preventDefault()}
                  className="flex w-full cursor-not-allowed items-center justify-center rounded-pill border-2 border-white px-6 py-[13px] text-[17px] font-medium text-white opacity-80 outline-none focus-visible:ring-3 focus-visible:ring-white/60"
                >
                  {t("login.missionCode")}
                </TooltipTrigger>
                <TooltipContent>{t("login.comingSoon")}</TooltipContent>
              </Tooltip>
            </form>
          </GlassPanel>
        </main>
      </div>

      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} defaultEmail={identifier} />
    </div>
  )
}
