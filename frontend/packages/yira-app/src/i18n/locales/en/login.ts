import type es from "../es/login"

const login: typeof es = {
  badge: "Crew access",
  title: "Sign in",
  subtitle: "Sign in with your email to see your crew's status.",
  email: "Email",
  emailPlaceholder: "you@example.com",
  password: "Password",
  showPassword: "Show password",
  hidePassword: "Hide password",
  remember: "Remember me",
  forgot: "Forgot your password?",
  submit: "Sign in",
  missionCode: "Continue with mission code",
  comingSoon: "Coming soon",
  error: "We couldn't sign you in. Check your details.",
  bubble: { hello: "Hi!", waiting: "Your crew is waiting" },
  mascotAlt: "Yiri, the YIRA mascot, waving",
  reset: {
    title: "Reset your password",
    description: "Enter your account email and we'll send you a link to create a new password.",
    submit: "Send link",
    sent: "If the email is registered, you'll receive a link to reset your password.",
    error: "We couldn't send the link. Please try again.",
  },
}

export default login
