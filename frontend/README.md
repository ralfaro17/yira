# YIRA frontend

A pnpm workspace holding one shared codebase and three apps:

| Path | What | Auth with Django |
|---|---|---|
| `packages/yira-app` (`@yira/app`) | Shared code: pages, components (shadcn), API client and hooks, design tokens, assets (`public/yira`, `public/crew`), and the shared Vite config | — |
| `apps/client` | **Web** app (Vercel) | Session cookie + CSRF (allauth browser client), same origin through the Vite proxy or Vercel rewrites |
| `apps/mobile` | **Mobile** PWA with a bottom tab bar, installable, works offline, and packaged as an Android APK through a TWA (`apps/mobile/twa/README.md`) | Same as web (its own Vercel project) |
| `apps/desktop` | **Desktop** app (Electron), with installers for Linux, Windows and macOS | Token: the allauth app client sends `X-Session-Token`. The token is encrypted with the OS keychain |

Each app is a small entry point that wires together:
- `configureApi()` (`browser` or `app` mode);
- a layout (`DesktopLayout` or `MobileLayout`);
- `<AppProviders><AppRoutes Layout={…}/></AppProviders>`.

The pages themselves live only in the package.

## Commands
Run these from `frontend/`, with the Django backend on `http://127.0.0.1:8000`:

```bash
pnpm dev:web        # http://localhost:5173
pnpm dev:mobile     # http://localhost:5175  (PWA; the service worker is only active in `build` + `preview`)
pnpm dev:desktop    # Electron window, renderer on http://localhost:5176
pnpm build          # builds all three apps
pnpm lint
pnpm desktop:dist   # desktop installers for the current OS → apps/desktop/release/
pnpm mobile:icons   # regenerate the PWA/APK icons from the shared logo
```

- **Desktop backend URL:** packaged builds use `VITE_API_URL` from `apps/desktop/.env.production` (default `https://yira.onrender.com`). The backend allows CORS from `app://yira`. Add more origins with `EXTRA_CORS_ORIGINS`.
- **Adding shadcn components:** run `pnpm dlx shadcn@latest add <name>` from `packages/yira-app`.
