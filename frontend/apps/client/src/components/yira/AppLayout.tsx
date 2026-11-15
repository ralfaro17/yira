import { Outlet } from "react-router"

import { AppHeader } from "./AppHeader"
import { SpaceBackground } from "./SpaceBackground"

/** Frame shell: space background, header, centred 1133px content column. */
export function AppLayout() {
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
