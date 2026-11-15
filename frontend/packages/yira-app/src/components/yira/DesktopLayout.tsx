import { Outlet } from "react-router"

import { AppHeader } from "./AppHeader"
import { SpaceBackground } from "./SpaceBackground"

/** Web/desktop frame shell: space background, top header with nav, centred 1133px column. */
export function DesktopLayout() {
  return (
    <div className="relative min-h-svh overflow-x-clip">
      <SpaceBackground />
      <div className="mx-auto flex min-h-svh w-full max-w-[1133px] flex-col px-4 pb-10 md:px-[61px]">
        <AppHeader />
        <main className="flex flex-1 flex-col pt-6 md:pt-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
