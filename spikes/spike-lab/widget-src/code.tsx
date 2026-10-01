// Hush Jar · Laboratorio (v0.3)
// Guía paso a paso para comprobar en FigJam lo que Hush Jar necesita antes de construir el MVP.
// La interfaz habla en lenguaje llano. El detalle técnico de cada prueba se guarda en `results`
// y se replica en sharedPluginData(NS, clave) para leerlo desde el plugin puente.
// Correspondencia con la propuesta: privado=E3, apertura=S5+E1, temporizador=S3, carga=S4, copias=E2,
// memoria=S2+S6. S1 (firma de las stickies) se resolvió desde el plugin puente: authorName no tiene setter.

const { widget } = figma
const { AutoLayout, Text, useSyncedMap, useSyncedState, usePropertyMenu, useWidgetNodeId } = widget

// Solo para comprobar con `typeof` si existen en el hilo principal del widget.
declare const crypto: unknown
declare const TextEncoder: unknown

type Status = 'pass' | 'fail' | 'warn' | 'info' | 'todo'
type Tone = 'neutral' | 'primary' | 'good' | 'bad'
type Refs = { [key: string]: string }

interface Result {
  status: Status
  summary: string
  at: string
  by: string
  data?: any
}

interface Slip {
  c: number
  t: string
}

interface LabAction {
  label: string
  run: () => Promise<void>
  tone?: Tone
}

interface Task {
  text: string
  actions?: LabAction[]
}

interface Verdict {
  status: Status
  text: string
}

interface Step {
  key: string
  title: string
  why: string
  tasks: Task[]
  verdict: Verdict | null
  note?: string
}

const NS = 'hushjar_lab'
const LAB_VERSION = '0.3.0'
const WIDTH = 760
const OPEN_COUNT = 150
const LOAD_COUNT = 1000
const TIMER_SECONDS = 10

const VERDICT_STYLE: { [K in Status]: { fg: string; bg: string; dot: string; icon: string } } = {
  pass: { fg: '#0B6B2E', bg: '#E3F5E8', dot: '#1E9E4A', icon: '✅' },
  fail: { fg: '#A1161B', bg: '#FDE7E7', dot: '#D93A3A', icon: '❌' },
  warn: { fg: '#8A5300', bg: '#FFF1D6', dot: '#E39B1B', icon: '⚠️' },
  info: { fg: '#1C4E9C', bg: '#E6EEFB', dot: '#3D7BE0', icon: 'ℹ️' },
  todo: { fg: '#4B2E8C', bg: '#EFE9FB', dot: '#B9A6F5', icon: '👉' },
}

const TONE_STYLE: { [K in Tone]: { fill: string; hover: string; text: string; stroke: string } } = {
  neutral: { fill: '#FFFFFF', hover: '#F0F0EC', text: '#1D1D1F', stroke: '#CFCFC8' },
  primary: { fill: '#1D1D1F', hover: '#3A3A3C', text: '#FFFFFF', stroke: '#1D1D1F' },
  good: { fill: '#E3F5E8', hover: '#CDEBD6', text: '#0B6B2E', stroke: '#9CD3AE' },
  bad: { fill: '#FDE7E7', hover: '#F8CFCF', text: '#A1161B', stroke: '#EBA3A5' },
}

const TIMER_EVENTS: ArgFreeEventType[] = ['timerstart', 'timerstop', 'timerpause', 'timerresume', 'timeradjust', 'timerdone']

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Aleatoriedad débil a propósito: el producto generará las claves con crypto en el iframe.
function hex(length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 16).toString(16)
  return out
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

function sessionId(): number {
  return figma.currentUser ? figma.currentUser.sessionId : -1
}

function whoAmI(): string {
  const user = figma.currentUser
  return user ? `${user.name}#${user.sessionId}` : 'desconocido'
}

function shuffle<T>(items: T[]): T[] {
  const a = items.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

// Separador de miles al estilo español (1.000) sin depender de Intl, que puede no existir en el sandbox.
function thousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function seconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace('.', ',')} s`
}

// Abre el iframe del laboratorio y espera a que informe de su entorno.
function openPanel(options: ShowUIOptions): Promise<unknown> {
  return new Promise((resolve) => {
    figma.showUI(__html__, options)
    figma.ui.onmessage = (msg) => {
      if (msg && msg.type === 'ready') resolve(msg.probe)
    }
  })
}

function waitForPanelClose(): Promise<void> {
  return new Promise((resolve) => {
    figma.ui.onmessage = (msg) => {
      if (msg && msg.type === 'close') resolve()
    }
  })
}

function Button(props: LabAction) {
  const tone = TONE_STYLE[props.tone || 'neutral']
  return (
    <AutoLayout
      padding={{ vertical: 9, horizontal: 14 }}
      cornerRadius={8}
      fill={tone.fill}
      stroke={tone.stroke}
      hoverStyle={{ fill: tone.hover }}
      onClick={props.run}
    >
      <Text fontSize={14} fontWeight={600} fill={tone.text}>
        {props.label}
      </Text>
    </AutoLayout>
  )
}

function VerdictBox(props: { verdict: Verdict }) {
  const style = VERDICT_STYLE[props.verdict.status]
  return (
    <AutoLayout direction="horizontal" width="fill-parent" padding={16} spacing={10} cornerRadius={12} fill={style.bg}>
      <Text fontSize={16}>{style.icon}</Text>
      <Text fontSize={15} fill={style.fg} width="fill-parent" lineHeight={22}>
        {props.verdict.text}
      </Text>
    </AutoLayout>
  )
}

function SpikeLab() {
  const widgetNodeId = useWidgetNodeId()
  const results = useSyncedMap<Result>('results')
  const jar = useSyncedMap<Slip>('jar')
  const mini = useSyncedMap<Slip>('mini')
  const load = useSyncedMap<Slip>('load')
  const [step, setStep] = useSyncedState<number>('step', 0)
  const [miniStatus, setMiniStatus] = useSyncedState<string>('miniStatus', 'vacío')
  const [homeNodeId, setHomeNodeId] = useSyncedState<string>('homeNodeId', '')
  const [copyProbe, setCopyProbe] = useSyncedState<string[]>('copyProbe', [])
  const [refs, setRefs] = useSyncedState<Refs>('refs', {})
  const isCopy = homeNodeId !== '' && homeNodeId !== widgetNodeId

  // ---------- utilidades (solo se usan dentro de handlers) ----------

  async function record(key: string, status: Status, summary: string, data?: unknown): Promise<void> {
    const result: Result = { status, summary, at: new Date().toISOString(), by: whoAmI() }
    if (data !== undefined) result.data = data
    results.set(key, result)
    console.log(`[HushJarLab] ${key} · ${status} · ${summary}`)
    try {
      const node = await figma.getNodeByIdAsync(widgetNodeId)
      if (node) node.setSharedPluginData(NS, key, JSON.stringify(result))
    } catch (e) {
      console.warn('[HushJarLab] no se pudo replicar en sharedPluginData', e)
    }
  }

  function guard(stepKey: string, run: () => Promise<void>): () => Promise<void> {
    return async () => {
      try {
        await run()
      } catch (e) {
        await record(`${stepKey}.error`, 'fail', errMsg(e))
      }
    }
  }

  async function widgetBox(): Promise<{ x: number; y: number; width: number; height: number }> {
    const node = await figma.getNodeByIdAsync(widgetNodeId)
    if (!node || node.type !== 'WIDGET') throw new Error('No encuentro el nodo del widget')
    const box = node.absoluteBoundingBox
    return box ? box : { x: node.x, y: node.y, width: node.width, height: node.height }
  }

  // Crea (o recrea) la sección de una prueba a un lado del laboratorio.
  async function freshSection(key: string, name: string, side: 'left' | 'right', width: number, height: number): Promise<SectionNode> {
    const previous = refs[key] ? await figma.getNodeByIdAsync(refs[key]) : null
    if (previous && previous.type === 'SECTION') previous.remove()
    const box = await widgetBox()
    const section = figma.createSection()
    section.name = name
    section.x = side === 'right' ? box.x + box.width + 160 : box.x - width - 160
    section.y = box.y
    section.resizeWithoutConstraints(width, height)
    setRefs((prev) => ({ ...prev, [key]: section.id }))
    return section
  }

  async function sectionById(key: string): Promise<SectionNode | null> {
    const node = refs[key] ? await figma.getNodeByIdAsync(refs[key]) : null
    return node && node.type === 'SECTION' ? node : null
  }

  // ---------- 1 · Escribir en privado (E3) ----------

  async function writeIdea() {
    const session = sessionId()
    await openPanel({ title: 'Tu idea · solo la ves tú', width: 360, height: 300 })
    figma.ui.postMessage({
      type: 'log',
      text: 'Escribe una idea y pulsa «Sellar». Se guardará en el tarro dentro de unos segundos, al azar, para que nadie sepa quién la escribió por el momento en que aparece.',
    })
    figma.ui.postMessage({ type: 'compose' })
    let pendingText = ''
    let attempt = ''
    let sealedAt = 0
    let written = false
    let writeTimer = 0

    const write = (how: string) => {
      if (written || !pendingText) return
      written = true
      jar.set(hex(24), { c: 0, t: pendingText })
      // Sin await a propósito: si el widget se está cerrando, al menos results.set ya se ha ejecutado.
      void record(`privado.guardado.${attempt}`, 'pass', `Guardada ${how}, ${seconds(Date.now() - sealedAt)} después de sellar. Tarro: ${jar.size}.`, { how, session })
    }
    const onClose = () => write('al cerrar la ventana')
    figma.on('close', onClose)

    await new Promise<void>((resolve) => {
      figma.ui.onmessage = (msg) => {
        if (!msg) return
        if (msg.type === 'seal' && !pendingText) {
          pendingText = String(msg.text).slice(0, 280)
          attempt = hex(6)
          sealedAt = Date.now()
          void record(`privado.sellado.${attempt}`, 'info', `Sellada por la sesión ${session}; pendiente de guardar.`, { session })
          const delay = 3000 + Math.floor(Math.random() * 5000)
          figma.ui.postMessage({ type: 'log', text: `Sellando… se guardará dentro de ${Math.round(delay / 1000)} s.` })
          writeTimer = setTimeout(() => {
            write('con retraso')
            figma.ui.postMessage({ type: 'log', text: 'Sellado ✓' })
            setTimeout(resolve, 1500)
          }, delay)
        }
        if (msg.type === 'close') {
          clearTimeout(writeTimer)
          write('al pulsar Cerrar')
          resolve()
        }
      }
    })
    figma.off('close', onClose)
  }

  async function checkIdeas() {
    await record('privado.comprobar', 'info', `Comprobado. Tarro: ${jar.size} ideas.`, { jar: jar.size })
  }

  // ---------- 2 · Abrir el tarro y deshacer (S5 + E1) ----------

  async function fillJar() {
    for (const key of mini.keys()) mini.delete(key)
    for (let i = 0; i < OPEN_COUNT; i++) mini.set(hex(24), { c: i % 4, t: `Idea de prueba ${i + 1}` })
    setMiniStatus('cerrado')
    await record('apertura.llenar', 'info', `Tarro con ${OPEN_COUNT} papelitos en el mapa «mini».`)
  }

  async function openJar() {
    const entries = shuffle(mini.entries())
    if (!entries.length) {
      await record('apertura.abrir', 'todo', 'Tarro vacío al abrir.', { empty: true })
      return
    }
    const cols = 15
    const section = await freshSection('apertura', 'Prueba · Tarro abierto', 'left', cols * 260 + 80, Math.ceil(entries.length / cols) * 260 + 120)
    const t0 = Date.now()
    const probe = figma.createSticky()
    await figma.loadFontAsync(probe.text.fontName as FontName)
    probe.remove()
    for (let i = 0; i < entries.length; i++) {
      const [key, slip] = entries[i]
      const sticky = figma.createSticky()
      section.appendChild(sticky)
      sticky.x = 40 + (i % cols) * 260
      sticky.y = 80 + Math.floor(i / cols) * 260
      sticky.text.characters = slip.t
      sticky.authorVisible = false
      mini.delete(key)
    }
    const ms = Date.now() - t0
    setMiniStatus('abierto')
    await record('apertura.abrir', ms < 3000 ? 'pass' : ms < 8000 ? 'warn' : 'fail', `${entries.length} stickies en ${ms} ms; mapa vaciado.`, { n: entries.length, ms })
  }

  async function checkUndo() {
    const opened = results.get('apertura.abrir')
    const n = opened && opened.data && opened.data.n ? opened.data.n : OPEN_COUNT
    const section = await sectionById('apertura')
    const left = section ? section.children.filter((c) => c.type === 'STICKY').length : 0
    await record(
      'apertura.deshacer',
      'info',
      `Tras Ctrl+Z: ${left}/${n} stickies, ${mini.size} papelitos en el mapa, estado «${miniStatus}», sección ${section ? 'presente' : 'borrada'}.`,
      { n, left, slips: mini.size, status: miniStatus, section: !!section },
    )
  }

  // ---------- 3 · Temporizador (S3) ----------

  async function tryTimer() {
    const timer = figma.timer
    if (!timer) {
      await record('temporizador.resultado', 'fail', 'figma.timer no existe dentro del widget.', { reason: 'no-api' })
      return
    }
    const t0 = Date.now()
    const events: string[] = []
    const handlers = TIMER_EVENTS.map((type) => {
      const handler = () => {
        events.push(`${type}@${((Date.now() - t0) / 1000).toFixed(1)}s`)
      }
      figma.on(type, handler)
      return { type, handler }
    })
    const unsubscribe = () => handlers.forEach(({ type, handler }) => figma.off(type, handler))

    await openPanel({ title: 'Probando el temporizador', width: 320, height: 160 })
    figma.ui.postMessage({ type: 'countdown', seconds: TIMER_SECONDS })
    try {
      timer.start(TIMER_SECONDS)
    } catch (e) {
      unsubscribe()
      await record('temporizador.resultado', 'fail', `timer.start lanzó: ${errMsg(e)}`, { reason: 'start' })
      return
    }
    await record('temporizador.api', 'info', `timer.start(${TIMER_SECONDS}) sin error: state=${timer.state}, remaining=${timer.remaining}, total=${timer.total}.`)

    const outcome = await new Promise<string>((resolve) => {
      let done = false
      let poll = 0
      let limit = 0
      const finish = (reason: string) => {
        if (done) return
        done = true
        clearInterval(poll)
        clearTimeout(limit)
        resolve(reason)
      }
      poll = setInterval(() => {
        if (events.some((e) => e.indexOf('timerdone') === 0)) finish('done')
      }, 250)
      limit = setTimeout(() => finish('timeout'), (TIMER_SECONDS + 25) * 1000)
      figma.ui.onmessage = (msg) => {
        if (msg && msg.type === 'close') finish('closed')
      }
    })
    await sleep(1500) // por si llegan eventos justo detrás (p. ej. timerstop)
    unsubscribe()
    await record(
      'temporizador.resultado',
      outcome === 'done' ? 'pass' : 'fail',
      `${outcome}. Eventos: ${events.join(', ') || 'ninguno'}. Estado final: state=${timer.state}, remaining=${timer.remaining}.`,
      { reason: outcome, events, finalState: timer.state },
    )
  }

  // ---------- 4 · Muchas ideas (S4) ----------

  async function loadMany() {
    for (const key of load.keys()) load.delete(key)
    const t0 = Date.now()
    let error = ''
    try {
      for (let i = 0; i < LOAD_COUNT; i++) load.set(hex(24), { c: i % 4, t: 'x'.repeat(280) })
    } catch (e) {
      error = errMsg(e)
    }
    const ms = Date.now() - t0
    const kb = Math.round((load.size * 324) / 1024)
    await record(
      'carga.meter',
      error ? 'fail' : ms < 3000 ? 'pass' : 'warn',
      `${load.size}/${LOAD_COUNT} papelitos de 280 caracteres (~${kb} kB) en ${ms} ms.${error ? ` Error: ${error}` : ''}`,
      { stored: load.size, ms, kb, error },
    )
  }

  async function clearMany() {
    const t0 = Date.now()
    const n = load.size
    for (const key of load.keys()) load.delete(key)
    await record('carga.vaciar', 'info', `${n} papelitos borrados en ${Date.now() - t0} ms.`, { n, ms: Date.now() - t0 })
  }

  // ---------- 5 · Copias del tarro (E2) ----------

  async function markOriginal() {
    setHomeNodeId(widgetNodeId)
    setCopyProbe(['Idea sellada 1', 'Idea sellada 2', 'Idea sellada 3'])
    await record('copias.marcar', 'info', `Original = ${widgetNodeId}; 3 ideas de prueba en copyProbe.`)
  }

  async function otherLabs(): Promise<WidgetNode[]> {
    await figma.currentPage.loadAsync()
    return figma.currentPage.findWidgetNodesByWidgetId(figma.widgetId || '').filter((n) => n.id !== widgetNodeId)
  }

  async function findCopies() {
    if (!homeNodeId) {
      await record('copias.buscar', 'todo', 'No hay original marcado.', { reason: 'unmarked' })
      return
    }
    if (isCopy) {
      await record('copias.buscar', 'todo', 'Pulsado en la copia.', { reason: 'in-copy' })
      return
    }
    const copies = await otherLabs()
    const info = copies.map((n) => {
      const state = n.widgetSyncedState
      return { id: n.id, keys: Object.keys(state), home: state.homeNodeId, carries: JSON.stringify(state).indexOf('Idea sellada') >= 0 }
    })
    await record('copias.buscar', copies.length ? 'pass' : 'todo', `${copies.length} copias: ${JSON.stringify(info)}`, {
      copies: copies.length,
      carries: info.some((i) => i.carries),
      info,
    })
  }

  async function wipeCopies() {
    if (isCopy) {
      await record('copias.buscar', 'todo', 'Pulsado en la copia.', { reason: 'in-copy' })
      return
    }
    const copies = await otherLabs()
    const errors: string[] = []
    let wiped = 0
    for (const copy of copies) {
      try {
        copy.setWidgetSyncedState({}, {})
        if (JSON.stringify(copy.widgetSyncedState).indexOf('Idea sellada') < 0) wiped++
        copy.remove()
      } catch (e) {
        errors.push(errMsg(e))
      }
    }
    await record('copias.vaciar', errors.length || wiped < copies.length ? 'fail' : 'pass', `${wiped}/${copies.length} copias vaciadas y borradas.${errors.length ? ` Errores: ${errors.join('; ')}` : ''}`, {
      copies: copies.length,
      wiped,
      errors,
    })
  }

  // ---------- 6 · Te reconoce al volver (S2 + S6) ----------

  async function saveMark() {
    const user = figma.currentUser
    const mark = { token: hex(24), id: user ? user.id : null, session: sessionId(), at: new Date().toISOString() }
    await figma.clientStorage.setAsync('lab:mark', mark)
    const iframe = await openPanel({ visible: false })
    const env = {
      setTimeout: typeof setTimeout,
      setInterval: typeof setInterval,
      crypto: typeof crypto,
      TextEncoder: typeof TextEncoder,
      editorType: figma.editorType,
      widgetId: figma.widgetId,
      apiVersion: figma.apiVersion,
      timer: !!figma.timer,
    }
    const active = figma.activeUsers.map((a) => ({ id: a.id, name: a.name, sessionId: a.sessionId }))
    await record('memoria.guardar', 'info', `Marca guardada: id ${mark.id}, sesión ${mark.session}. crypto en el widget: ${env.crypto}; en el iframe: ${JSON.stringify(iframe)}.`, {
      mark,
      env,
      iframe,
      active,
    })
  }

  async function checkMark() {
    const user = figma.currentUser
    const session = sessionId()
    const mark = await figma.clientStorage.getAsync('lab:mark')
    if (!mark) {
      await record('memoria.comprobar', 'fail', 'No hay marca en clientStorage.', { reason: 'missing', session })
      return
    }
    if (mark.session === session) {
      await record('memoria.comprobar', 'todo', `Misma sesión (${session}): no parece que se haya recargado.`, { reason: 'same-session', session })
      return
    }
    const sameId = !!user && mark.id === user.id
    await record(
      'memoria.comprobar',
      sameId ? 'pass' : 'warn',
      `Marca de la sesión ${mark.session} leída en la sesión ${session}. id antes ${mark.id}, ahora ${user ? user.id : null}.`,
      { reason: sameId ? 'ok' : 'id-changed', before: mark.id, now: user ? user.id : null, session },
    )
  }

  // ---------- menú del widget ----------

  async function exportAll() {
    const all: { [key: string]: Result } = {}
    for (const [key, value] of results.entries()) all[key] = value
    await openPanel({ title: 'Resultados del laboratorio', width: 480, height: 400 })
    figma.ui.postMessage({ type: 'log', text: 'Copia el texto (Ctrl+C) y pégalo en el chat si Claude te lo pide.' })
    figma.ui.postMessage({ type: 'export', text: JSON.stringify({ version: LAB_VERSION, exportedAt: new Date().toISOString(), results: all }, null, 2) })
    await waitForPanelClose()
  }

  async function resetAll() {
    for (const key of Object.keys(refs)) {
      const node = await figma.getNodeByIdAsync(refs[key])
      if (node && node.type === 'SECTION') node.remove()
    }
    setRefs({})
    const node = await figma.getNodeByIdAsync(widgetNodeId)
    if (node) for (const key of node.getSharedPluginDataKeys(NS)) node.setSharedPluginData(NS, key, '')
    for (const map of [results, jar, mini, load]) for (const key of map.keys()) map.delete(key)
    setStep(0)
    setMiniStatus('vacío')
    setHomeNodeId('')
    setCopyProbe([])
  }

  usePropertyMenu(
    [
      { itemType: 'action', propertyName: 'export', tooltip: 'Exportar resultados' },
      { itemType: 'action', propertyName: 'reset', tooltip: 'Empezar de cero' },
    ],
    async ({ propertyName }) => {
      if (propertyName === 'export') await exportAll()
      if (propertyName === 'reset') await resetAll()
    },
  )

  // ---------- veredictos en lenguaje llano (se calculan solo a partir del estado) ----------

  const all = results.entries()
  const withPrefix = (prefix: string) => all.filter(([key]) => key.indexOf(prefix) === 0)

  // Si lo último que pasó en una prueba fue un error, se enseña el error.
  function withError(key: string, verdict: Verdict | null): Verdict | null {
    const error = results.get(`${key}.error`)
    if (!error) return verdict
    const latest = withPrefix(`${key}.`)
      .filter(([k]) => k !== `${key}.error`)
      .reduce((max, [, r]) => (r.at > max ? r.at : max), '')
    if (latest && latest > error.at) return verdict
    return { status: 'fail', text: `Algo ha fallado: «${error.summary}». Díselo a Claude en el chat.` }
  }

  function privateVerdict(): Verdict | null {
    const sealed = withPrefix('privado.sellado.')
    if (!sealed.length) return null
    const savedFor = (sealedKey: string) => results.get(`privado.guardado.${sealedKey.slice('privado.sellado.'.length)}`)
    const check = results.get('privado.comprobar')
    const lost = sealed.filter(([k, r]) => !savedFor(k) && check && r.at < check.at)
    const pending = sealed.filter(([k, r]) => !savedFor(k) && (!check || r.at >= check.at))
    const saved = withPrefix('privado.guardado.')
    const savedOnClose = saved.some(([, r]) => r.data && r.data.how === 'al cerrar la ventana')
    if (lost.length) {
      return {
        status: 'fail',
        text: `Se ha perdido ${lost.length === 1 ? 'una idea' : `${lost.length} ideas`} al cerrar la ventanita justo después de sellar. Es importante: en Hush Jar la idea se guardará al momento si alguien cierra la ventanita.`,
      }
    }
    if (pending.length) return { status: 'todo', text: 'Tu idea se está guardando. Si ya has cerrado la ventanita, pulsa «Comprobar».' }
    if (savedOnClose) return { status: 'pass', text: 'Las ideas se guardan siempre, también si cierras la ventanita nada más sellar. El retraso al azar funciona.' }
    return { status: 'todo', text: 'La idea se ha guardado. Ahora repite, pero cierra la ventanita con la X nada más pulsar «Sellar», y luego pulsa «Comprobar».' }
  }

  function openVerdict(): Verdict | null {
    const fill = results.get('apertura.llenar')
    const open = results.get('apertura.abrir')
    const undo = results.get('apertura.deshacer')
    if (undo && undo.data && (!open || undo.at >= open.at)) {
      const { n, left, slips } = undo.data
      const time = open && open.data && open.data.ms !== undefined ? `Sacó ${n} ideas en ${seconds(open.data.ms)}. ` : ''
      if (left === 0 && slips === n) return { status: 'pass', text: `${time}Un Ctrl+Z deshace la apertura entera: las ideas vuelven al tarro y no se pierde ninguna.` }
      if (left === 0 && slips === 0)
        return { status: 'fail', text: `${time}Ctrl+Z borra las notas pero las ideas no vuelven al tarro, así que se perderían. Hush Jar tendrá que avisar antes de deshacer.` }
      if (left === n && slips === n)
        return { status: 'warn', text: `${time}Ctrl+Z vuelve a llenar el tarro pero deja las notas: al abrirlo otra vez saldrían repetidas. Lo evitaremos marcando las ideas ya abiertas.` }
      if (left === n && slips === 0)
        return { status: 'todo', text: `${time}Ctrl+Z no ha cambiado nada. Vuelve a llenar y abrir el tarro, y pulsa Ctrl+Z justo después, sin hacer clic en otra cosa.` }
      return { status: 'warn', text: `${time}Ctrl+Z solo deshizo una parte: quedan ${left} de ${n} notas y ${slips} ideas en el tarro.` }
    }
    if (open && open.data && open.data.empty) return { status: 'todo', text: 'El tarro estaba vacío. Pulsa primero «Llenar el tarro».' }
    if (open && open.data) {
      const slow = open.data.ms >= 3000 ? ' Es lento: el tarro abrirá las ideas por tandas.' : ''
      return { status: 'todo', text: `Sacó ${open.data.n} ideas en ${seconds(open.data.ms)}.${slow} Ahora pulsa Ctrl+Z una vez y después «Ya he pulsado Ctrl+Z».` }
    }
    if (fill) return { status: 'todo', text: 'El tarro está lleno. Ahora pulsa «Abrir el tarro».' }
    return null
  }

  function timerVerdict(): Verdict | null {
    const result = results.get('temporizador.resultado')
    const started = results.get('temporizador.api')
    if (result && result.data && (!started || result.at >= started.at)) {
      const reason = result.data.reason
      if (reason === 'done') return { status: 'pass', text: 'Sí: el tarro puede poner en marcha el temporizador de FigJam y enterarse de cuándo termina la ronda.' }
      if (reason === 'closed') return { status: 'todo', text: 'Cerraste la ventanita antes de que terminara. Vuelve a probar y espera sin tocar nada.' }
      if (reason === 'timeout')
        return { status: 'warn', text: 'El temporizador arrancó, pero el tarro no se enteró de cuándo terminaba. Hush Jar lo comprobará en el siguiente clic.' }
      return { status: 'fail', text: 'El tarro no puede usar el temporizador de FigJam. Hush Jar llevará su propia cuenta atrás.' }
    }
    if (started) return { status: 'todo', text: 'Esperando a que termine el temporizador… No toques nada.' }
    return null
  }

  function loadVerdict(): Verdict | null {
    const put = results.get('carga.meter')
    const clear = results.get('carga.vaciar')
    if (!put || !put.data) return null
    if (put.data.error) return { status: 'fail', text: `No pudo guardar tantas ideas (se atascó en ${thousands(put.data.stored)}). Hush Jar pondrá un límite más bajo.` }
    const base = `Aguanta ${thousands(put.data.stored)} ideas largas: tardó ${seconds(put.data.ms)} en guardarlas.`
    if (put.data.ms >= 3000) return { status: 'warn', text: `${base} Es algo lento, así que Hush Jar pondrá un límite por sesión.` }
    if (!clear || clear.at < put.at) return { status: 'todo', text: `${base} Mira si el laboratorio sigue yendo fluido y pulsa «Vaciar».` }
    return { status: 'pass', text: `${base} Un tarro normal (menos de 300 ideas) no tendrá problema.` }
  }

  function copiesVerdict(): Verdict | null {
    const mark = results.get('copias.marcar')
    const find = results.get('copias.buscar')
    const wipe = results.get('copias.vaciar')
    if (wipe && wipe.data && (!find || wipe.at >= find.at)) {
      if (wipe.data.copies === 0) return { status: 'todo', text: 'No había copias que vaciar. Duplica el laboratorio (Ctrl+D) y vuelve a buscar.' }
      return wipe.status === 'pass'
        ? { status: 'pass', text: 'Se detectan las copias y el original puede vaciarlas y borrarlas. Nadie podrá abrir las ideas de otras personas en una copia.' }
        : { status: 'warn', text: 'Se detectan las copias, pero el original no pudo vaciarlas. Hush Jar hará que cada copia se vacíe sola en cuanto alguien la toque.' }
    }
    if (find && find.data) {
      if (find.data.reason === 'in-copy') return { status: 'todo', text: 'Has pulsado en la copia. Pulsa «Buscar copias» en el laboratorio original.' }
      if (find.data.reason === 'unmarked') return { status: 'todo', text: 'Primero pulsa «Marcar como original».' }
      if (find.data.copies > 0) {
        const carries = find.data.carries ? 'se lleva las ideas selladas del original' : 'no se lleva las ideas selladas'
        return { status: 'todo', text: `Encontrada: la copia ${carries}. Ahora pulsa «Vaciar y borrar copias».` }
      }
      return { status: 'todo', text: 'No encuentro ninguna copia. Selecciona el laboratorio y pulsa Ctrl+D.' }
    }
    if (mark) return { status: 'todo', text: 'Ahora duplica el laboratorio: selecciónalo y pulsa Ctrl+D.' }
    return null
  }

  function memoryVerdict(): Verdict | null {
    const check = results.get('memoria.comprobar')
    const saved = results.get('memoria.guardar')
    if (check && check.data && (!saved || check.at >= saved.at)) {
      const reason = check.data.reason
      if (reason === 'ok')
        return { status: 'pass', text: 'Te reconoce al volver. Hush Jar podrá recordar qué ideas son tuyas para que las edites o las retires, sin guardar tu nombre junto a ellas.' }
      if (reason === 'same-session') return { status: 'todo', text: 'Parece que no has recargado. Cierra la pestaña de este tablero, vuelve a abrirlo y pulsa «Ya he vuelto».' }
      if (reason === 'missing') return { status: 'fail', text: 'No te reconoce al volver. Solo podrás editar tus ideas mientras tengas la ventanita abierta.' }
      return { status: 'warn', text: 'Te reconoce, pero tu identificador de usuario cambió al volver. Hush Jar usará la marca guardada y no ese identificador.' }
    }
    if (saved) return { status: 'todo', text: 'Ahora cierra la pestaña de este tablero, vuelve a abrirlo y pulsa «Ya he vuelto».' }
    return null
  }

  // ---------- pasos ----------

  const steps: Step[] = [
    {
      key: 'privado',
      title: 'Escribe una idea en privado',
      why: 'Es el corazón de Hush Jar: cada persona escribe en una ventanita que solo ve ella. Comprobamos que la idea llega al tarro aunque se cierre la ventanita enseguida.',
      tasks: [
        {
          text: 'Pulsa «Escribir una idea». En la ventanita que se abre, escribe cualquier cosa y pulsa «Sellar». Espera a que ponga «Sellado ✓».',
          actions: [{ label: 'Escribir una idea', tone: 'primary', run: guard('privado', writeIdea) }],
        },
        {
          text: 'Repite, pero esta vez cierra la ventanita con la X de arriba a la derecha nada más pulsar «Sellar».',
          actions: [{ label: 'Escribir otra idea', run: guard('privado', writeIdea) }],
        },
        { text: 'Pulsa «Comprobar».', actions: [{ label: 'Comprobar', run: guard('privado', checkIdeas) }] },
      ],
      verdict: withError('privado', privateVerdict()),
      note: `Ideas en el tarro: ${jar.size}`,
    },
    {
      key: 'apertura',
      title: 'Abre un tarro lleno y deshaz',
      why: 'Al abrir el tarro salen todas las ideas de golpe como notas. Medimos cuánto tarda con 150 ideas y qué pasa si alguien pulsa Ctrl+Z (deshacer) por error.',
      tasks: [
        { text: 'Llena el tarro con 150 ideas de prueba.', actions: [{ label: 'Llenar el tarro', tone: 'primary', run: guard('apertura', fillJar) }] },
        {
          text: 'Ábrelo. Aparecerán 150 notas a la izquierda del laboratorio (aleja el zoom si no las ves).',
          actions: [{ label: 'Abrir el tarro', run: guard('apertura', openJar) }],
        },
        {
          text: 'Pulsa Ctrl+Z (deshacer) una sola vez, sin hacer clic en nada más, y después este botón.',
          actions: [{ label: 'Ya he pulsado Ctrl+Z', run: guard('apertura', checkUndo) }],
        },
      ],
      verdict: withError('apertura', openVerdict()),
      note: `Ideas dentro del tarro de prueba: ${mini.size}`,
    },
    {
      key: 'temporizador',
      title: '¿Puede usar el temporizador de FigJam?',
      why: 'Las rondas de escritura duran unos minutos. Lo ideal es usar el temporizador que ya tiene FigJam en vez de inventar otro.',
      tasks: [
        {
          text: `Pulsa el botón. Arriba del tablero arrancará un temporizador de ${TIMER_SECONDS} segundos y se abrirá una ventanita.`,
          actions: [{ label: 'Probar el temporizador', tone: 'primary', run: guard('temporizador', tryTimer) }],
        },
        { text: 'Espera a que termine sin hacer clic en nada. La ventanita se cerrará sola.' },
      ],
      verdict: withError('temporizador', timerVerdict()),
    },
    {
      key: 'carga',
      title: '¿Aguanta muchas ideas?',
      why: 'En una sesión grande puede haber cientos de ideas. Metemos 1.000 ideas largas de golpe para ver si el tarro se atasca.',
      tasks: [
        {
          text: 'Pulsa el botón y espera unos segundos.',
          actions: [{ label: 'Meter 1.000 ideas', tone: 'primary', run: guard('carga', loadMany) }],
        },
        { text: 'Mueve un poco el laboratorio para ver si va fluido y pulsa «Vaciar».', actions: [{ label: 'Vaciar', run: guard('carga', clearMany) }] },
      ],
      verdict: withError('carga', loadVerdict()),
      note: `Ideas de prueba ahora: ${load.size}`,
    },
    {
      key: 'copias',
      title: '¿Qué pasa si alguien duplica el tarro?',
      why: 'Si alguien copia un tarro sellado, la copia no debería servir para abrir las ideas de otras personas.',
      tasks: [
        { text: 'Marca este laboratorio como el original.', actions: [{ label: 'Marcar como original', tone: 'primary', run: guard('copias', markOriginal) }] },
        { text: 'Duplícalo: haz clic en el borde del laboratorio para seleccionarlo y pulsa Ctrl+D.' },
        {
          text: 'En el laboratorio original, pulsa «Buscar copias» y después «Vaciar y borrar copias».',
          actions: [
            { label: 'Buscar copias', run: guard('copias', findCopies) },
            { label: 'Vaciar y borrar copias', run: guard('copias', wipeCopies) },
          ],
        },
      ],
      verdict: withError('copias', copiesVerdict()),
    },
    {
      key: 'memoria',
      title: '¿Te reconoce cuando vuelves?',
      why: 'Para que puedas editar o retirar tu idea más tarde, el tarro tiene que reconocerte al volver, sin guardar tu nombre junto a la idea.',
      tasks: [
        { text: 'Guarda una marca en este ordenador.', actions: [{ label: 'Guardar mi marca', tone: 'primary', run: guard('memoria', saveMark) }] },
        { text: 'Cierra la pestaña de este tablero y vuelve a abrirlo.' },
        { text: 'Pulsa el botón.', actions: [{ label: 'Ya he vuelto', run: guard('memoria', checkMark) }] },
      ],
      verdict: withError('memoria', memoryVerdict()),
    },
  ]

  // ---------- render ----------

  const current = Math.max(0, Math.min(step, steps.length))
  const isSummary = current === steps.length
  const isFinished = (s: Step) => !!s.verdict && s.verdict.status !== 'todo'
  const done = steps.filter(isFinished).length
  const allDone = done === steps.length
  const firstPending = steps.findIndex((s) => !isFinished(s))
  const currentDone = !isSummary && isFinished(steps[current])
  const isLast = current === steps.length - 1

  return (
    <AutoLayout direction="vertical" width={WIDTH} padding={32} spacing={24} fill="#FFFFFF" cornerRadius={20} stroke="#E4E4DE" strokeWidth={1.5}>
      <AutoLayout direction="horizontal" width="fill-parent" spacing={14} verticalAlignItems="center">
        <Text fontSize={36}>🫙</Text>
        <AutoLayout direction="vertical" spacing={4} width="fill-parent">
          <Text fontSize={24} fontWeight={700} fill="#1D1D1F">
            Laboratorio de Hush Jar
          </Text>
          <Text fontSize={14} fill="#6B6B66" width="fill-parent" lineHeight={20}>
            Seis pruebas cortas para comprobar que FigJam deja hacer lo que Hush Jar necesita. En cada una, pulsa los botones de «Qué tienes que hacer» y espera al resultado.
          </Text>
        </AutoLayout>
      </AutoLayout>

      {isCopy ? (
        <AutoLayout width="fill-parent" padding={12} cornerRadius={10} fill="#FFF1D6">
          <Text fontSize={14} fill="#8A5300" width="fill-parent">
            📎 Esto es una copia del laboratorio. Vuelve al original para seguir.
          </Text>
        </AutoLayout>
      ) : null}

      <AutoLayout direction="horizontal" width="fill-parent" spacing="auto" verticalAlignItems="center">
        <AutoLayout direction="horizontal" spacing={8} verticalAlignItems="center">
          {steps.map((s, i) => (
            <AutoLayout
              key={s.key}
              width={i === current ? 30 : 14}
              height={14}
              cornerRadius={7}
              fill={s.verdict && s.verdict.status !== 'todo' ? VERDICT_STYLE[s.verdict.status].dot : '#E2E2DC'}
              stroke={i === current ? '#1D1D1F' : undefined}
              strokeWidth={2}
              onClick={async () => setStep(i)}
            />
          ))}
          <AutoLayout
            width={isSummary ? 30 : 14}
            height={14}
            cornerRadius={7}
            fill={done === steps.length ? '#1D1D1F' : '#E2E2DC'}
            stroke={isSummary ? '#1D1D1F' : undefined}
            strokeWidth={2}
            onClick={async () => setStep(steps.length)}
          />
        </AutoLayout>
        <Text fontSize={13} fill="#8A8A85">
          {done} de {steps.length} pruebas hechas
        </Text>
      </AutoLayout>

      {isSummary ? (
        <AutoLayout direction="vertical" width="fill-parent" spacing={14}>
          <Text fontSize={24} fontWeight={700} fill="#1D1D1F">
            Resumen
          </Text>
          {steps.map((s, i) => (
            <AutoLayout key={s.key} direction="vertical" width="fill-parent" spacing={6}>
              <Text fontSize={15} fontWeight={700} fill="#1D1D1F">
                {i + 1}. {s.title}
              </Text>
              {s.verdict ? (
                <VerdictBox verdict={s.verdict} />
              ) : (
                <Text fontSize={14} fill="#8A8A85">
                  Sin hacer todavía.
                </Text>
              )}
            </AutoLayout>
          ))}
          {allDone ? (
            <AutoLayout width="fill-parent" padding={18} cornerRadius={12} fill="#1D1D1F">
              <Text fontSize={15} fill="#FFFFFF" width="fill-parent" lineHeight={22}>
                ¡Hecho! Último paso: abre el plugin «Figma Desktop Bridge» (menú principal → Plugins → Desarrollo) y escribe «listo» en el chat. Claude leerá los resultados y te dirá qué significan.
              </Text>
            </AutoLayout>
          ) : (
            <AutoLayout width="fill-parent" padding={18} cornerRadius={12} fill="#FFF1D6">
              <Text fontSize={15} fill="#8A5300" width="fill-parent" lineHeight={22}>
                {steps.length - done === 1 ? 'Te falta 1 prueba.' : `Te faltan ${steps.length - done} pruebas.`} Pulsa «Ir a la prueba que falta» y haz sus pasos: cuando aparezca el resultado, sigue con la siguiente.
              </Text>
            </AutoLayout>
          )}
        </AutoLayout>
      ) : (
        <AutoLayout direction="vertical" width="fill-parent" spacing={20}>
          <AutoLayout direction="vertical" width="fill-parent" spacing={8}>
            <Text fontSize={13} fontWeight={700} fill="#8A8A85" letterSpacing={0.5}>
              PRUEBA {current + 1} DE {steps.length}
            </Text>
            <Text fontSize={26} fontWeight={700} fill="#1D1D1F" width="fill-parent">
              {steps[current].title}
            </Text>
            <Text fontSize={15} fill="#55554F" width="fill-parent" lineHeight={23}>
              {steps[current].why}
            </Text>
          </AutoLayout>

          <AutoLayout direction="vertical" width="fill-parent" spacing={16} padding={20} cornerRadius={14} fill="#F6F6F2">
            <AutoLayout direction="vertical" width="fill-parent" spacing={4}>
              <Text fontSize={13} fontWeight={700} fill="#1D1D1F" letterSpacing={0.5}>
                QUÉ TIENES QUE HACER
              </Text>
              <Text fontSize={13} fill="#6B6B66" width="fill-parent">
                Haz los pasos en orden. El resultado aparecerá debajo, en un recuadro de color.
              </Text>
            </AutoLayout>
            {steps[current].tasks.map((task, i) => (
              <AutoLayout key={`${steps[current].key}-${i}`} direction="horizontal" width="fill-parent" spacing={12} verticalAlignItems="start">
                <AutoLayout width={26} height={26} cornerRadius={13} fill="#1D1D1F" horizontalAlignItems="center" verticalAlignItems="center">
                  <Text fontSize={13} fontWeight={700} fill="#FFFFFF">
                    {i + 1}
                  </Text>
                </AutoLayout>
                <AutoLayout direction="vertical" width="fill-parent" spacing={10}>
                  <Text fontSize={15} fill="#1D1D1F" width="fill-parent" lineHeight={23}>
                    {task.text}
                  </Text>
                  {task.actions ? (
                    <AutoLayout direction="horizontal" width="fill-parent" spacing={8} wrap>
                      {task.actions.map((action) => (
                        <Button key={action.label} {...action} />
                      ))}
                    </AutoLayout>
                  ) : null}
                </AutoLayout>
              </AutoLayout>
            ))}
          </AutoLayout>

          {steps[current].note ? (
            <Text fontSize={13} fill="#8A8A85">
              {steps[current].note}
            </Text>
          ) : null}

          {steps[current].verdict ? <VerdictBox verdict={steps[current].verdict as Verdict} /> : null}
        </AutoLayout>
      )}

      <AutoLayout direction="horizontal" width="fill-parent" spacing="auto" verticalAlignItems="center">
        {current > 0 ? <Button label="← Anterior" run={async () => setStep(current - 1)} /> : <Text fontSize={13} fill="#B0B0AA">v{LAB_VERSION}</Text>}
        {isSummary ? (
          allDone ? (
            <Button label="Volver al principio" run={async () => setStep(0)} />
          ) : (
            <Button label="Ir a la prueba que falta →" tone="primary" run={async () => setStep(firstPending)} />
          )
        ) : currentDone ? (
          <Button label={isLast ? 'Ver resumen →' : 'Siguiente prueba →'} tone="primary" run={async () => setStep(current + 1)} />
        ) : (
          <Button label={isLast ? 'Saltar y ver resumen' : 'Saltar esta prueba'} run={async () => setStep(current + 1)} />
        )}
      </AutoLayout>
    </AutoLayout>
  )
}

widget.register(SpikeLab)
