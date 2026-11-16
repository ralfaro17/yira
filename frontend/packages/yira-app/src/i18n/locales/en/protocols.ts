import type es from "../es/protocols"

const protocols: typeof es = {
  page: {
    title: "Protocols",
    subtitle: "Action guides for emergencies and crew care",
    view: "View protocol",
  },
  category: {
    emergency: "Emergency",
    observation: "Observation",
    preventive: "Preventive",
  },
  meta_one: "{{count}} step · {{minutes}} min",
  meta_other: "{{count}} steps · {{minutes}} min",
  guidance: {
    direction: "EARTH  →  CREW",
    team: "Medical team · Earth",
  },
  detail: {
    back: "←  Back to protocols",
    actionPlan: "Action plan",
    completed: "{{completed}} / {{total}} completed",
    progress: "Action plan progress",
    step: "Step {{number}}: {{title}}",
    started: "Protocol started · {{title}}",
    startedHint: "Check off each step of the action plan as you complete it.",
    finished: "Protocol completed · {{title}}",
    finish: "Finish protocol",
    completeAll: "Complete every step to finish",
  },
  consult: {
    trigger: "Consult Earth",
    title: "Consult Earth",
    description: "Send a short message to the medical team about the “{{title}}” protocol.",
    message: "Message",
    placeholder: "Describe the situation or your question…",
    cancel: "Cancel",
    send: "Send",
    sent: "Message sent to the medical team · Earth",
  },
  items: {
    "crisis-cardiovascular": {
      title: "Cardiovascular crisis",
      description: "Starts continuous monitoring, alerts the flight surgeon and prepares the summary for Earth.",
      subtitle: "Immediate response with medical support from Earth.",
      steps: {
        1: { title: "Stop the activity", detail: "Stay with a crewmate and alert the flight surgeon." },
        2: { title: "Start continuous monitoring", detail: "Check the sensors and the telemetry signal." },
        3: { title: "Report your symptoms", detail: "Describe what you feel and when it started." },
        4: { title: "Share the records", detail: "Send vital signs and their trend to the team on Earth." },
        5: { title: "Follow medical instructions", detail: "Apply only the measures the physician indicates." },
        6: { title: "Log and reassess", detail: "Note any changes and keep the follow-up link open." },
      },
      guidance: {
        body: "Put the crew member's safety first. Keep telemetry running and stay in contact with the flight surgeon.",
        noteTitle: "Priority care",
        noteText: "If things get worse, report it immediately. Do not give any medication without medical instruction.",
      },
      footer1: "Act together with the flight surgeon.",
      footer2: "Don't wait for the transmission to ask for help.",
      start: "Start protocol",
    },
    "estres-salud-mental": {
      title: "Stress and mental health",
      description: "Daily mood check-ins, guided breaks and a support session with the team on Earth.",
      subtitle: "A pause to regain your balance, with support from Earth.",
      steps: {
        1: { title: "Log how you feel", detail: "Describe your mood, rest and tension level." },
        2: { title: "Take a guided break", detail: "Find a quiet spot and breathe comfortably." },
        3: { title: "Connect with your support team", detail: "Share how you feel with the team on Earth." },
        4: { title: "Agree on the next check-in", detail: "Log any changes and confirm the next session." },
      },
      guidance: {
        body: "Take this moment for yourself. Share how you feel; the support team is with you from Earth.",
        noteTitle: "You don't have to do this alone",
        noteText: "If the discomfort grows or you don't feel safe, contact the flight surgeon immediately.",
      },
      footer1: "Your well-being is part of the mission too.",
      footer2: "Share how you feel with the team.",
      start: "Start check-in",
    },
    "cuidado-oseo-muscular": {
      title: "Musculoskeletal care",
      description: "Resistance routine and bone density monitoring to keep the body strong in microgravity.",
      subtitle: "Movement and follow-up to care for your body in microgravity.",
      steps: {
        1: { title: "Review today's plan", detail: "Confirm the assigned load and equipment with Earth." },
        2: { title: "Warm up your body", detail: "Do the prescribed mobility work before starting." },
        3: { title: "Complete the guided resistance", detail: "Follow the prescribed sets and check your restraints." },
        4: { title: "Recover and log how you feel", detail: "Finish with the prescribed recovery and hydration." },
        5: { title: "Send your follow-up", detail: "Share the session and the scheduled bone checks." },
      },
      guidance: {
        body: "Consistency protects your strength. Follow your personalized routine and tell us how your body responds.",
        noteTitle: "Your body sets the limit",
        noteText: "Don't increase the load on your own. Stop exercising if you feel pain or dizziness and report it.",
      },
      footer1: "Use only the load prescribed by Earth.",
      footer2: "If you feel pain, stop the routine and report it.",
      start: "Start routine",
    },
  },
}

export default protocols
