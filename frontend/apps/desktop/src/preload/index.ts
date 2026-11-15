import { contextBridge, ipcRenderer } from "electron"

/** Minimal, typed bridge for the shared web app (see packages/yira-app/src/platform.ts). */
contextBridge.exposeInMainWorld("yiraDesktop", {
  platform: process.platform,
  tokens: {
    get: (): Promise<string | null> => ipcRenderer.invoke("yira:tokens:get"),
    set: (token: string, persist: boolean): Promise<void> => ipcRenderer.invoke("yira:tokens:set", token, persist),
    clear: (): Promise<void> => ipcRenderer.invoke("yira:tokens:clear"),
  },
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke("yira:open-external", url),
  copyText: (text: string): Promise<void> => ipcRenderer.invoke("yira:copy-text", text),
})
