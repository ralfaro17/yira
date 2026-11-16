import type es from "../es/profile"

const profile: typeof es = {
  title: "Profile",
  photoAlt: "Photo of {{name}}",
  defaultRole: "Mission control · Earth",
  activeSession: "Active session",
  edit: "Edit profile",
  preferences: "Preferences",
  language: "Language",
  timezone: "Time zone",
  timezones: {
    earth: "Earth · UTC−6",
    utc: "UTC",
    houston: "Houston · UTC−6/−5",
    madrid: "Madrid · UTC+1/+2",
  },
  emergencyAlerts: "Emergency alerts",
  enabled: "On",
  disabled: "Off",
  dailySummary: "Daily summary",
  units: "Units",
  unitOptions: { metric: "Metric", imperial: "Imperial" },
  save: "Save changes",
  saving: "Saving…",
  saved: "Preferences saved",
  saveError: "Your changes could not be saved.",
  signOut: "Sign out",
  signOutError: "Could not sign out.",
  editDialog: {
    title: "Edit profile",
    description: "This is how the rest of mission control will see you.",
    displayName: "Display name",
    role: "Role",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    updated: "Profile updated",
    error: "Could not update the profile.",
  },
}

export default profile
