import { useMe, useSession } from "@/api/hooks"

/** Name used in "¡Bienvenida a YIRA, {name}!": profile display name, else the login username. */
export function useGreetingName() {
  const me = useMe()
  const session = useSession()
  const name = me.data?.display_name?.trim() || session.data?.username || ""
  return { name, isPending: me.isPending && !name }
}
