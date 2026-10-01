// Todos los textos de Hush Jar, en cada idioma. Para añadir un idioma: súmalo a `Lang` y a `LANGS`
// y escribe su diccionario; TypeScript avisa si falta alguna frase.
//
// Cada tarro tiene un solo idioma, que ven todos (el lienzo de FigJam es compartido) y que también
// usa la ventanita privada. Lo que escribe la gente (la pregunta, las ideas) no se traduce.

export type Lang = 'es' | 'en'
export type FormatId = 'single' | 'retro' | 'ssc'
// Los ids de columna se guardan con cada idea: no cambiarlos aunque estén en español.
export type ColumnId = 'idea' | 'bien' | 'mejorar' | 'probar' | 'empezar' | 'dejar' | 'seguir'

// Cada idioma se nombra en su propio idioma, para que cualquiera encuentre el suyo.
export const LANGS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
]
export const DEFAULT_LANG: Lang = 'en'

export function isLang(value: unknown): value is Lang {
  return LANGS.some((l) => l.id === value)
}

// Textos de la ventanita privada. Viajan al iframe en el mensaje `init`, así que son texto plano:
// {s} son los segundos de espera y {col} el nombre de la columna.
export interface PanelStrings {
  eyebrow: string
  fallbackQuestion: string
  column: string
  placeholder: string
  cancel: string
  seal: string
  saveChanges: string
  mine: string
  edit: string
  remove: string
  sure: string
  close: string
  saving: string
  savingEdit: string
  removing: string
  delay: string
  saved: string
  savedIn: string
  next: string
  late: string
  editing: string
  edited: string
  removed: string
}

export interface Strings {
  panel: PanelStrings
  panelTitle: string
  formats: { [id in FormatId]: string }
  columns: { [id in ColumnId]: string }
  suggestions: string[]
  // preparación
  round: (n: number) => string
  labelTitle: string
  labelQuestion: (round: number) => string
  placeholderQuestion: string
  placeholderTitle: (format: FormatId) => string
  orPick: string
  lateInJar: (n: number) => string
  hintColumns: string
  hintSingle: string
  start: (round: number) => string
  // tarro abierto a ideas
  back: string
  noIdeasYet: string
  ideas: (n: number) => string
  people: (n: number) => string
  nobodyReads: string
  write: string
  open: string
  timer: string
  // confirmación con pocas personas
  nobodyWrote: string
  onlyWrote: (n: number) => string
  easyToGuess: (min: number) => string
  wait: string
  openAnyway: string
  // tarro abierto
  opened: (n: number) => string
  newIdeas: (n: number) => string
  showIdeas: string
  newRound: string
  ledBy: (name: string) => string
  // avisos
  onlyFacilitator: (name: string) => string
  pressStartFirst: string
  whoAreYou: string
  needQuestion: string
  alreadyOut: string
  noTimer: string
  timerStarted: (minutes: number) => string
  timerFailed: string
  emptyJar: string
  sectionsMissing: string
  cantGoBack: string
  nowYouLead: (name: string) => string
  // menú del widget
  menuLanguage: string
  menuTakeover: string
  menuReset: string
}

const es: Strings = {
  panel: {
    eyebrow: '🔒 Solo tú ves esta ventana',
    fallbackQuestion: '¿Qué quieres compartir?',
    column: 'Columna',
    placeholder: 'Escribe tu idea. Nadie sabrá que es tuya.',
    cancel: 'Cancelar',
    seal: 'Echar al tarro',
    saveChanges: 'Guardar cambios',
    mine: 'Tus ideas en este tarro (solo tú las ves)',
    edit: 'Editar',
    remove: 'Retirar',
    sure: '¿Seguro?',
    close: 'Cerrar',
    saving: 'Guardando en el tarro',
    savingEdit: 'Guardando los cambios',
    removing: 'Retirando la idea del tarro',
    delay: '… (unos {s} s, al azar para que nadie sepa cuándo lo hiciste)',
    saved: '✓ Guardada.',
    savedIn: '✓ Guardada en «{col}».',
    next: 'Puedes escribir otra, cambiarla abajo o cerrar la ventana.',
    late: 'El tarro ya se había abierto, así que saldrá en la próxima ronda.',
    editing: 'Editando tu idea. Nadie más la verá hasta que se abra el tarro.',
    edited: '✓ Cambios guardados.',
    removed: '✓ Idea retirada del tarro.',
  },
  panelTitle: 'Tu idea',
  // Los tooltips de los widgets los coloca Figma y salen descuadrados: por eso el nombre completo.
  formats: { single: 'Una pregunta', retro: 'Retrospectiva', ssc: 'Empezar · Dejar · Seguir' },
  columns: {
    idea: 'Ideas',
    bien: 'Qué fue bien',
    mejorar: 'Qué mejorar',
    probar: 'Qué probar',
    empezar: 'Empezar a hacer',
    dejar: 'Dejar de hacer',
    seguir: 'Seguir haciendo',
  },
  suggestions: ['¿Qué podríamos mejorar?', '¿Qué ha ido bien?', '¿Qué te preocupa?', '¿Qué deberíamos dejar de hacer?'],
  round: (n) => `Ronda ${n}`,
  labelTitle: 'TÍTULO (OPCIONAL)',
  labelQuestion: (round) => (round === 1 ? 'PREGUNTA PARA EL EQUIPO' : `PREGUNTA PARA LA RONDA ${round}`),
  placeholderQuestion: 'Escribe aquí la pregunta…',
  placeholderTitle: (format) => `Por ejemplo: ${format === 'retro' ? 'Retro del sprint 12' : 'Revisión del trimestre'}`,
  orPick: 'O elige una:',
  lateInJar: (n) =>
    n === 1 ? 'En el tarro hay 1 idea que llegó tarde: saldrá en esta ronda.' : `En el tarro hay ${n} ideas que llegaron tarde: saldrán en esta ronda.`,
  hintColumns: 'Al abrir el tarro, las ideas saldrán agrupadas por columna y anónimas.',
  hintSingle: 'Cada persona responderá en privado. Tú decides cuándo abrir el tarro y las ideas saldrán anónimas.',
  start: (round) => (round === 1 ? 'Empezar' : `Empezar la ronda ${round}`),
  back: '← Volver',
  noIdeasYet: 'Todavía no hay ideas',
  ideas: (n) => (n === 1 ? '1 idea' : `${n} ideas`),
  people: (n) => (n === 1 ? '1 persona' : `${n} personas`),
  nobodyReads: 'Nadie puede leerlas hasta que se abra el tarro.',
  write: 'Escribir una idea',
  open: 'Abrir el tarro',
  timer: '⏱ Temporizador:',
  nobodyWrote: 'Aún no ha escrito nadie en esta ronda',
  onlyWrote: (n) => (n === 1 ? 'Solo ha escrito 1 persona' : `Solo han escrito ${n} personas`),
  easyToGuess: (min) => `Con menos de ${min} personas es fácil adivinar quién escribió cada idea.`,
  wait: 'Esperar',
  openAnyway: 'Abrir igualmente',
  opened: (n) => `Tarro abierto: ${n === 1 ? '1 idea' : `${n} ideas`}`,
  newIdeas: (n) => (n === 1 ? 'Hay 1 idea nueva para la próxima ronda.' : `Hay ${n} ideas nuevas para la próxima ronda.`),
  showIdeas: 'Ver las ideas',
  newRound: 'Nueva ronda',
  ledBy: (name) => `Dirige: ${name}`,
  onlyFacilitator: (name) => `Solo ${name} puede hacer esto: es quien dirige la sesión.`,
  pressStartFirst: 'Primero alguien tiene que pulsar «Empezar».',
  whoAreYou: 'No he podido saber quién eres.',
  needQuestion: 'Escribe una pregunta o elige una de las sugerencias.',
  alreadyOut: 'Esa idea ya no está en el tarro: se abrió y ya está en el tablero.',
  noTimer: 'Este tablero no tiene temporizador.',
  timerStarted: (minutes) => `Temporizador en marcha: ${minutes} minutos para escribir.`,
  timerFailed: 'No he podido poner el temporizador. Puedes lanzarlo desde la barra de FigJam.',
  emptyJar: 'El tarro está vacío: todavía nadie ha echado ideas.',
  sectionsMissing: 'No encuentro las secciones con las ideas. ¿Las habéis borrado?',
  cantGoBack: 'Ya ha escrito alguien en esta ronda, así que ya no se puede volver atrás.',
  nowYouLead: (name) => `Ahora diriges tú la sesión, ${name}.`,
  menuLanguage: 'Idioma',
  menuTakeover: 'Dirigir yo la sesión',
  menuReset: 'Vaciar el tarro y empezar de cero',
}

const en: Strings = {
  panel: {
    eyebrow: '🔒 Only you can see this window',
    fallbackQuestion: 'What would you like to share?',
    column: 'Column',
    placeholder: 'Write your idea. No one will know it’s yours.',
    cancel: 'Cancel',
    seal: 'Drop in the jar',
    saveChanges: 'Save changes',
    mine: 'Your ideas in this jar (only you can see them)',
    edit: 'Edit',
    remove: 'Remove',
    sure: 'Sure?',
    close: 'Close',
    saving: 'Dropping it in the jar',
    savingEdit: 'Saving your changes',
    removing: 'Taking the idea out of the jar',
    delay: '… (about {s} s, random so no one knows when you did it)',
    saved: '✓ Saved.',
    savedIn: '✓ Saved in “{col}”.',
    next: 'You can write another one, change it below or close this window.',
    late: 'The jar had already been opened, so it will come out next round.',
    editing: 'Editing your idea. No one else will see it until the jar is opened.',
    edited: '✓ Changes saved.',
    removed: '✓ Idea removed from the jar.',
  },
  panelTitle: 'Your idea',
  formats: { single: 'One question', retro: 'Retrospective', ssc: 'Start · Stop · Continue' },
  columns: {
    idea: 'Ideas',
    bien: 'Went well',
    mejorar: 'To improve',
    probar: 'To try',
    empezar: 'Start doing',
    dejar: 'Stop doing',
    seguir: 'Continue doing',
  },
  suggestions: ['What could we improve?', 'What went well?', 'What worries you?', 'What should we stop doing?'],
  round: (n) => `Round ${n}`,
  labelTitle: 'TITLE (OPTIONAL)',
  labelQuestion: (round) => (round === 1 ? 'QUESTION FOR THE TEAM' : `QUESTION FOR ROUND ${round}`),
  placeholderQuestion: 'Type the question here…',
  placeholderTitle: (format) => `For example: ${format === 'retro' ? 'Sprint 12 retro' : 'Quarterly review'}`,
  orPick: 'Or pick one:',
  lateInJar: (n) =>
    n === 1 ? 'There’s 1 late idea in the jar: it will come out this round.' : `There are ${n} late ideas in the jar: they will come out this round.`,
  hintColumns: 'When you open the jar, the ideas come out anonymous and grouped by column.',
  hintSingle: 'Everyone answers privately. You decide when to open the jar, and the ideas come out anonymous.',
  start: (round) => (round === 1 ? 'Start' : `Start round ${round}`),
  back: '← Back',
  noIdeasYet: 'No ideas yet',
  ideas: (n) => (n === 1 ? '1 idea' : `${n} ideas`),
  people: (n) => (n === 1 ? '1 person' : `${n} people`),
  nobodyReads: 'No one can read them until the jar is opened.',
  write: 'Write an idea',
  open: 'Open the jar',
  timer: '⏱ Timer:',
  nobodyWrote: 'Nobody has written yet this round',
  onlyWrote: (n) => (n === 1 ? 'Only 1 person has written' : `Only ${n} people have written`),
  easyToGuess: (min) => `With fewer than ${min} people, it’s easy to guess who wrote each idea.`,
  wait: 'Wait',
  openAnyway: 'Open anyway',
  opened: (n) => `Jar opened: ${n === 1 ? '1 idea' : `${n} ideas`}`,
  newIdeas: (n) => (n === 1 ? 'There’s 1 new idea for the next round.' : `There are ${n} new ideas for the next round.`),
  showIdeas: 'Show the ideas',
  newRound: 'New round',
  ledBy: (name) => `Led by ${name}`,
  onlyFacilitator: (name) => `Only the facilitator, ${name}, can do this.`,
  pressStartFirst: 'Someone has to press “Start” first.',
  whoAreYou: 'Couldn’t tell who you are.',
  needQuestion: 'Write a question or pick one of the suggestions.',
  alreadyOut: 'That idea isn’t in the jar anymore: the jar was opened and it’s on the board.',
  noTimer: 'This board doesn’t have a timer.',
  timerStarted: (minutes) => `Timer running: ${minutes} minutes to write.`,
  timerFailed: 'Couldn’t start the timer. You can start it from the FigJam toolbar.',
  emptyJar: 'The jar is empty: nobody has dropped in an idea yet.',
  sectionsMissing: 'Can’t find the sections with the ideas. Were they deleted?',
  cantGoBack: 'Someone has already written this round, so you can’t go back now.',
  nowYouLead: (name) => `You’re leading the session now, ${name}.`,
  menuLanguage: 'Language',
  menuTakeover: 'Lead the session myself',
  menuReset: 'Empty the jar and start over',
}

const STRINGS: { [id in Lang]: Strings } = { es, en }

export function strings(lang: Lang): Strings {
  return STRINGS[lang]
}
