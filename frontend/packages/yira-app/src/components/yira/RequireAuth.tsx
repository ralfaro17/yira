import { Navigate, Outlet, useLocation } from "react-router"

import { useSession } from "@/api/hooks"
import { Spinner } from "@/components/ui/spinner"

import { SpaceBackground } from "./SpaceBackground"

export function RequireAuth() {
  const { data: user, isPending } = useSession()
  const location = useLocation()

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <SpaceBackground />
        <Spinner className="size-8 text-white" />
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
