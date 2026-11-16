import type es from "../es/layout"

const layout: typeof es = {
  nav: {
    home: "Home",
    crew: "Crew",
    protocols: "Protocols",
    evaluation: "Evaluation",
    main: "Main navigation",
  },
  notifications: "Notifications",
  notificationsUnread_one: "Notifications ({{count}} unread)",
  notificationsUnread_other: "Notifications ({{count}} unread)",
  profile: "Profile",
  install: "Install",
  installApp: "Install app",
  estimated: "(estimated)",
  yiriAlt: "Yiri, the YIRA mascot",
  error: {
    title: "We couldn't load the data",
    description: "Check the connection to mission control and try again.",
    retry: "Retry",
  },
  emptyCrew: {
    title: "No crew members yet",
    before: "Run",
    after: "or register crew members from the admin panel.",
  },
  pwa: {
    updateAvailable: "New version available",
    update: "Update",
    offlineReady: "YIRA is ready to use offline",
  },
}

export default layout
