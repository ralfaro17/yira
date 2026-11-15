import { existsSync, statSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { app, BrowserWindow, clipboard, ipcMain, net, protocol, safeStorage, shell } from "electron"

declare const __YIRA_API_URL__: string

/**
 * YIRA desktop main process.
 *
 * The renderer (shared YIRA web app) is served from the privileged `app://yira`
 * scheme so BrowserRouter deep links work and the origin is stable for CORS.
 * It authenticates with the allauth "app" client: the session token is kept
 * here, encrypted with the OS keychain via `safeStorage`.
 */

const APP_ORIGIN = "app://yira"
const RENDERER_DIR = path.join(import.meta.dirname, "../renderer")
const DEV_URL = process.env.ELECTRON_RENDERER_URL // set by `electron-vite dev`
const API_URL = __YIRA_API_URL__

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

// ------------------------------------------------------------------ app:// file server

function registerAppProtocol() {
  protocol.handle("app", (request) => {
    const { pathname } = new URL(request.url)
    let file = path.normalize(path.join(RENDERER_DIR, decodeURIComponent(pathname)))
    if (!file.startsWith(RENDERER_DIR)) return new Response("Forbidden", { status: 403 })
    if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(RENDERER_DIR, "index.html") // SPA fallback
    return net.fetch(pathToFileURL(file).toString())
  })
}

// ------------------------------------------------------------------ session token store

const tokenFile = () => path.join(app.getPath("userData"), "session-token.bin")
let memoryToken: string | null = null

async function readToken(): Promise<string | null> {
  if (memoryToken) return memoryToken
  if (!safeStorage.isEncryptionAvailable()) return null
  try {
    memoryToken = safeStorage.decryptString(await readFile(tokenFile()))
    return memoryToken
  } catch {
    return null
  }
}

async function writeToken(token: string, persist: boolean) {
  memoryToken = token
  await rm(tokenFile(), { force: true })
  // Never write the token in plain text: without an OS keychain it stays in memory for this run.
  if (persist && safeStorage.isEncryptionAvailable()) {
    await mkdir(path.dirname(tokenFile()), { recursive: true })
    await writeFile(tokenFile(), safeStorage.encryptString(token), { mode: 0o600 })
  }
}

async function clearToken() {
  memoryToken = null
  await rm(tokenFile(), { force: true })
}

function registerIpc() {
  ipcMain.handle("yira:tokens:get", () => readToken())
  ipcMain.handle("yira:tokens:set", (_event, token: unknown, persist: unknown) => {
    if (typeof token !== "string" || token.length > 4096) throw new Error("Invalid token")
    return writeToken(token, persist === true)
  })
  ipcMain.handle("yira:tokens:clear", () => clearToken())
  ipcMain.handle("yira:open-external", (_event, url: unknown) => {
    if (typeof url !== "string" || !/^https?:\/\//.test(url)) throw new Error("Invalid URL")
    return shell.openExternal(url)
  })
  ipcMain.handle("yira:copy-text", (_event, text: unknown) => {
    if (typeof text !== "string") throw new Error("Invalid text")
    clipboard.writeText(text)
  })
}

// ------------------------------------------------------------------ window

function isInternal(url: string) {
  return url.startsWith(`${APP_ORIGIN}/`) || (DEV_URL !== undefined && url.startsWith(DEV_URL))
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: "YIRA",
    backgroundColor: "#000f15",
    show: false,
    autoHideMenuBar: true,
    icon: path.join(import.meta.dirname, "../../build/icon.png"),
    webPreferences: {
      preload: path.join(import.meta.dirname, "../preload/index.cjs"),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
    },
  })

  win.once("ready-to-show", () => win.show())

  // Links to other sites open in the system browser; the app never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    return { action: "deny" }
  })
  win.webContents.on("will-navigate", (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault()
      if (/^https?:\/\//.test(url)) void shell.openExternal(url)
    }
  })

  void win.loadURL(DEV_URL ?? `${APP_ORIGIN}/`)
  return win
}

// ------------------------------------------------------------------ lifecycle

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(() => {
    app.setAppUserModelId("app.yira.desktop")
    registerAppProtocol()
    registerIpc()
    console.log(`[yira] renderer=${DEV_URL ?? APP_ORIGIN} api=${API_URL}`)
    createWindow()
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit()
  })
}
