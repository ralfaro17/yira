import type es from "../es/common"

const common: typeof es = {
  language: {
    label: "Language",
    switch: "Switch language to Spanish",
    es: "Español",
    en: "English",
  },
  errors: {
    generic: "Something went wrong. Please try again.",
    offline: "No connection to mission control.",
    noSessionToken: "The server did not return a session token.",
  },
}

export default common
