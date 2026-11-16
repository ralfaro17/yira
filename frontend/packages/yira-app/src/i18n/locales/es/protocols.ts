const protocols = {
  page: {
    title: "Protocolos",
    subtitle: "Guías de acción para emergencias y cuidado de la tripulación",
    view: "Ver protocolo",
  },
  category: {
    emergency: "Emergencia",
    observation: "Observación",
    preventive: "Preventivo",
  },
  /** "6 pasos · 12 min" */
  meta_one: "{{count}} paso · {{minutes}} min",
  meta_other: "{{count}} pasos · {{minutes}} min",
  guidance: {
    direction: "TIERRA  →  TRIPULACIÓN",
    team: "Equipo médico · Tierra",
  },
  detail: {
    back: "←  Volver a protocolos",
    actionPlan: "Plan de acción",
    completed: "{{completed}} / {{total}} completados",
    progress: "Progreso del plan de acción",
    step: "Paso {{number}}: {{title}}",
    started: "Protocolo iniciado · {{title}}",
    startedHint: "Marca cada paso del plan de acción a medida que lo completes.",
    finished: "Protocolo finalizado · {{title}}",
    finish: "Finalizar protocolo",
    completeAll: "Completa todos los pasos para finalizar",
  },
  consult: {
    trigger: "Consultar a Tierra",
    title: "Consultar a Tierra",
    description: "Envía un mensaje breve al equipo médico sobre el protocolo «{{title}}».",
    message: "Mensaje",
    placeholder: "Describe la situación o tu consulta…",
    cancel: "Cancelar",
    send: "Enviar",
    sent: "Mensaje enviado al equipo médico · Tierra",
  },
  items: {
    "crisis-cardiovascular": {
      title: "Crisis cardiovascular",
      description: "Activa el monitoreo continuo, avisa al médico de vuelo y prepara el resumen para la Tierra.",
      subtitle: "Respuesta inmediata y acompañamiento médico desde Tierra.",
      steps: {
        1: { title: "Interrumpe la actividad", detail: "Permanece acompañado y avisa al médico de vuelo." },
        2: { title: "Activa el monitoreo continuo", detail: "Comprueba los sensores y la señal de telemetría." },
        3: { title: "Comunica los síntomas", detail: "Describe qué sientes y cuándo comenzó." },
        4: { title: "Comparte los registros", detail: "Envía signos vitales y evolución al equipo en Tierra." },
        5: { title: "Sigue la indicación médica", detail: "Aplica solo las medidas indicadas por el médico." },
        6: { title: "Registra y reevalúa", detail: "Anota los cambios y mantén el enlace de seguimiento." },
      },
      guidance: {
        body: "Prioriza la seguridad del tripulante. Mantén la telemetría y la comunicación con el médico de vuelo.",
        noteTitle: "Atención prioritaria",
        noteText: "Ante un empeoramiento, avisa de inmediato. No administres medicación sin indicación médica.",
      },
      footer1: "Actúa con el médico de vuelo.",
      footer2: "No esperes al envío para solicitar ayuda.",
      start: "Iniciar protocolo",
    },
    "estres-salud-mental": {
      title: "Estrés y salud mental",
      description: "Seguimiento diario del ánimo, pausas guiadas y sesión de apoyo con el equipo en Tierra.",
      subtitle: "Una pausa para recuperar el equilibrio, con apoyo desde Tierra.",
      steps: {
        1: { title: "Registra cómo te sientes", detail: "Describe tu ánimo, descanso y nivel de tensión." },
        2: { title: "Haz una pausa guiada", detail: "Busca un espacio tranquilo y respira cómodamente." },
        3: { title: "Conecta con tu equipo de apoyo", detail: "Comparte tus sensaciones con el equipo en Tierra." },
        4: { title: "Acuerda el próximo seguimiento", detail: "Registra los cambios y confirma la próxima sesión." },
      },
      guidance: {
        body: "Reserva este momento para ti. Comparte cómo te sientes; el equipo de apoyo te acompaña desde Tierra.",
        noteTitle: "No tienes que hacerlo a solas",
        noteText: "Si el malestar aumenta o no te sientes seguro, contacta al médico de vuelo de inmediato.",
      },
      footer1: "Tu bienestar también forma parte de la misión.",
      footer2: "Comparte cómo te sientes con el equipo.",
      start: "Comenzar seguimiento",
    },
    "cuidado-oseo-muscular": {
      title: "Cuidado óseo-muscular",
      description:
        "Rutina de resistencia y control de densidad ósea para mantener el cuerpo fuerte en microgravedad.",
      subtitle: "Movimiento y seguimiento para cuidar tu cuerpo en microgravedad.",
      steps: {
        1: { title: "Revisa tu plan del día", detail: "Confirma con Tierra la carga y el equipo asignados." },
        2: { title: "Prepara el cuerpo", detail: "Realiza la movilidad indicada antes de comenzar." },
        3: { title: "Completa la resistencia guiada", detail: "Sigue las series prescritas y comprueba tus anclajes." },
        4: { title: "Recupera y registra sensaciones", detail: "Finaliza con la recuperación e hidratación indicadas." },
        5: { title: "Envía tu seguimiento", detail: "Comparte la sesión y los controles óseos programados." },
      },
      guidance: {
        body: "La constancia cuida tu fuerza. Sigue tu rutina personalizada y envíanos cómo responde tu cuerpo.",
        noteTitle: "Tu cuerpo marca el límite",
        noteText: "No aumentes la carga por tu cuenta. Detén el ejercicio si aparece dolor o mareo y comunícalo.",
      },
      footer1: "Sigue únicamente la carga prescrita por Tierra.",
      footer2: "Si aparece dolor, detén la rutina y comunícalo.",
      start: "Comenzar rutina",
    },
  },
}

export default protocols
