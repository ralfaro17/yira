import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle } from 'lucide-react'

interface PasswordRequirementsProps {
  password: string
  passwordConfirm: string
}

export function PasswordRequirements({
  password,
  passwordConfirm,
}: PasswordRequirementsProps) {
  const { t } = useTranslation()
  const hasMinLength = password.length >= 8
  const isNotOnlyNumbers = password.length > 0 && !/^\d+$/.test(password)
  const isMatching =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password === passwordConfirm

  const rules = [
    {
      label: t('auth.passwordRules.minChars', 'Mínimo 8 caracteres'),
      satisfied: hasMinLength,
    },
    {
      label: t('auth.passwordRules.notOnlyNumbers', 'No consistir únicamente de números'),
      satisfied: isNotOnlyNumbers,
    },
    {
      label: t('auth.passwordRules.match', 'Las contraseñas coinciden'),
      satisfied: isMatching,
    },
  ]

  // Only display if user started typing a password
  if (!password && !passwordConfirm) {
    return null
  }

  return (
    <div className="rounded-lg border border-border/70 bg-muted/40 p-3 text-xs space-y-1.5 transition-all animate-in fade-in-50 duration-200">
      <p className="font-medium text-foreground/80 mb-1">
        {t('auth.passwordRules.title', 'Requisitos de contraseña:')}
      </p>
      <ul className="space-y-1">
        {rules.map((rule, idx) => (
          <li
            key={idx}
            className={`flex items-center gap-1.5 transition-colors ${
              rule.satisfied
                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            {rule.satisfied ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground/60" />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

