# Tecnologías de YIRA

Tecnologías y librerías principales del proyecto YIRA, del equipo Ishigami para el reto *Create Health Monitoring Software for Astronauts on Space Missions* del NASA Space Apps Challenge 2026.

Las versiones son las instaladas actualmente: `backend/uv.lock` en el backend y `node_modules` del workspace en el frontend.

## Visión general

| Capa | Tecnologías |
|---|---|
| Backend / API | Python 3.14 · Django 6 · Django REST Framework · django-allauth (headless) |
| Análisis de datos | pandas · NumPy |
| Base de datos | PostgreSQL |
| Frontend web | React 19 · TypeScript · Vite · Tailwind CSS 4 · shadcn/ui (Base UI) |
| Móvil | PWA (vite-plugin-pwa + Workbox) → APK Android vía Trusted Web Activity (Bubblewrap) |
| Escritorio | Electron (electron-vite + electron-builder) |
| 3D | Three.js (mascota Yiri en formato GLB) |
| Entorno | Dev Container (Docker Compose) · uv · pnpm |

## Backend (`backend/`)

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| [Python](https://www.python.org) | 3.14 (requiere ≥ 3.13) | Lenguaje del backend |
| [Django](https://www.djangoproject.com) | 6.0 | Framework web, ORM, admin y migraciones |
| [Django REST Framework](https://www.django-rest-framework.org) | 3.16.1 | API REST `/api/health/` (tripulación, mediciones, alertas, escaneos, análisis) |
| [django-allauth](https://allauth.org) (headless) | 65.21.1 | Autenticación con usuario/correo y contraseña. Cliente *browser* (cookies de sesión) para web y móvil, y cliente *app* (`X-Session-Token`) para escritorio |
| [django-cors-headers](https://github.com/adamchainz/django-cors-headers) | 4.9.0 | CORS para los servidores de desarrollo y la app de escritorio (`app://yira`) |
| [pandas](https://pandas.pydata.org) | 3.1.1 | Series de tiempo: remuestreo, ventanas, agregados diarios |
| [NumPy](https://numpy.org) | 2.5.4 | Estadística: línea base robusta (mediana/MAD), z-scores, regresión de tendencias, puntajes por sistema |
| [psycopg2](https://www.psycopg.org) | 2.9.11 | Driver de PostgreSQL |
| [WhiteNoise](https://whitenoise.readthedocs.io) | 6.11.0 | Archivos estáticos en producción |
| [python-dotenv](https://github.com/theskumar/python-dotenv) | 1.2.1 | Variables de entorno desde `.env` |

**Calidad y tipado:** [uv](https://docs.astral.sh/uv/) (gestor de dependencias), [Ruff](https://docs.astral.sh/ruff/) 0.17 (lint y formato), [mypy](https://mypy-lang.org) 2.4 con `django-stubs`, `djangorestframework-stubs` y `pandas-stubs`, y las pruebas de Django (`manage.py test`).

## Frontend (`frontend/`, workspace de pnpm)

El código se comparte entre las tres apps a través del paquete `packages/yira-app` (`@yira/app`):
- `apps/client`: web.
- `apps/mobile`: PWA y APK.
- `apps/desktop`: Electron.

### Base común

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| [React](https://react.dev) | 19.3 | Librería de UI |
| [TypeScript](https://www.typescriptlang.org) | 5.9 | Tipado estático |
| [Vite](https://vite.dev) | 7.3 | Servidor de desarrollo y empaquetado (con `@vitejs/plugin-react`) |
| [React Router](https://reactrouter.com) | 7.18 | Enrutamiento declarativo (`BrowserRouter` + `<Routes>`) |
| [TanStack Query](https://tanstack.com/query) | 5.107 | Datos del servidor: caché, refresco periódico, mutaciones |
| [Axios](https://axios-http.com) | 1.21 | Cliente HTTP (CSRF en modo navegador, token de sesión en escritorio) |
| [Tailwind CSS](https://tailwindcss.com) | 4.3 | Estilos y tokens de diseño (`@tailwindcss/vite`, `tw-animate-css`) |
| [shadcn/ui](https://ui.shadcn.com) (estilo *base-nova*) | CLI 4.23 | Componentes de UI (botones, diálogos, carrusel, progreso, casillas, selects…) |
| [Base UI](https://base-ui.com) | 1.9 | Primitivas accesibles sobre las que se construye shadcn/ui |
| [Embla Carousel](https://www.embla-carousel.com) | 8.6 | Carrusel de tripulantes |
| [Three.js](https://threejs.org) | 0.187 | Render 3D de la mascota Yiri (GLB), con expresiones según el estado y animaciones |
| [Lucide](https://lucide.dev) | 0.574 | Iconos |
| [Sonner](https://sonner.emilkowal.ski) | 2.0 | Notificaciones *toast* |
| [date-fns](https://date-fns.org) | 4.4 | Fechas relativas en español («hace 5 min») |
| [Inter](https://rsms.me/inter/) (`@fontsource-variable/inter`) | 5.3 | Tipografía del diseño |
| `class-variance-authority`, `clsx`, `tailwind-merge` | 0.7 / 2.1 / 3.7 | Variantes y composición de clases CSS |

**Calidad:** [ESLint](https://eslint.org) 9 con `typescript-eslint`, `eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`.

### Móvil (`apps/mobile`)

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | 2.0 | Manifiesto web, *service worker* y avisos de actualización |
| [Workbox](https://developer.chrome.com/docs/workbox) (`workbox-window`) | 7.4 | Caché sin conexión: el *shell* de la app, los datos de salud con *NetworkFirst* y las imágenes con *CacheFirst* |
| [sharp](https://sharp.pixelplumbing.com) | 0.35 | Generación de los iconos de la PWA y el APK |
| [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) / [PWABuilder](https://www.pwabuilder.com) | — | Empaquetado del APK/AAB de Android como Trusted Web Activity (`apps/mobile/twa/`) |

### Escritorio (`apps/desktop`)

| Tecnología | Versión | Uso en el proyecto |
|---|---|---|
| [Electron](https://www.electronjs.org) | 45.3 | App de escritorio. Sirve la interfaz desde el protocolo `app://yira` y guarda el token cifrado con `safeStorage` |
| [electron-vite](https://electron-vite.org) | 6.0 | Compilación del proceso principal, el *preload* y el *renderer* |
| [electron-builder](https://www.electron.build) | 26.18 | Instaladores: AppImage/deb (Linux), NSIS (Windows) y dmg (macOS) |

## Infraestructura y entorno de desarrollo

| Tecnología | Uso en el proyecto |
|---|---|
| [Dev Containers](https://containers.dev) + Docker Compose | Entorno reproducible (`.devcontainer/`) |
| [PostgreSQL](https://www.postgresql.org) (`postgres:latest`) | Base de datos |
| [Mailpit](https://mailpit.axllent.org) | Servidor SMTP de prueba en desarrollo (correos de allauth) |
| [Node.js](https://nodejs.org) 26 · [pnpm](https://pnpm.io) 11 | Entorno y gestor de paquetes del frontend |
| [Vercel](https://vercel.com) | Hosting de la web y la PWA. Sus *rewrites* hacen *proxy* de `/api` y `/_allauth` al backend |
| [Render](https://render.com) | Hosting previsto del backend (`yira.onrender.com`) |

## Nota: dependencias instaladas sin uso actual

Algunas dependencias heredadas de la plantilla inicial están en los manifiestos pero el código de YIRA no las usa, por eso no aparecen arriba:
- **Backend:** `boto3`, `stripe`, `redis`, `djangorestframework-simplejwt`, `djoser`, `social-auth-app-django`.
- **Frontend:** `zod`, `react-hook-form`, `@react-three/fiber`, `i18next`, `@fortawesome/react-fontawesome`, `@vis.gl/react-google-maps`, `culori`, `next-themes`, `radix-ui`.

Se pueden eliminar o empezar a usar más adelante.
