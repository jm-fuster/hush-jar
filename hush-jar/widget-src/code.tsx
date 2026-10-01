// Hush Jar (v0.4)
// Tarro de ideas para FigJam: cada persona escribe en privado y quien dirige abre el tarro
// cuando quiere; las ideas salen barajadas como notas sin firma, agrupadas por columna.
//
// Anonimato por construcción:
// - Las ideas se guardan en `slips` bajo claves aleatorias generadas en el iframe, sin autor ni hora.
// - Quién ha escrito se cuenta con un token aleatorio por dispositivo (`people`), nunca con el usuario.
// - Las notas las crea quien abre el tarro, con la firma oculta: FigJam no deja cambiar el autor.
// - Cada idea se guarda con un retraso al azar para que el momento del clic no delate a nadie.
// - El tarro no pinta los papelitos con el color de su columna: así nadie deduce, por el color que
//   aparece justo después de un clic, en qué columna escribió cada persona.
//
// Idiomas: los textos están en textos.ts. Cada tarro tiene uno, que se cambia desde su menú.

import { jarSvg } from './tarro'
import { DEFAULT_LANG, isLang, LANGS, strings } from './textos'
import type { ColumnId, FormatId, Lang, Strings } from './textos'

const { widget } = figma
const { AutoLayout, Text, Input, SVG, useSyncedMap, useSyncedState, usePropertyMenu, useWidgetNodeId, useEffect, waitForTask } = widget

type Phase = 'setup' | 'open' | 'confirm' | 'revealed'
type Tone = 'primary' | 'secondary'

interface Person {
  id: string
  name: string
}

interface Slip {
  t: string
  c?: string
}

interface Reveal {
  count: number
  sectionIds?: string[]
  sectionId?: string // versiones anteriores
  counts?: { [column: string]: number }
}

interface ColumnDef {
  id: ColumnId
  paletteKey: string // clave en figma.constants.colors.figJamBaseLight
  hex: string // el mismo color, para pintarlo sin llamar a la API
}

interface Column extends ColumnDef {
  label: string
}

interface Format {
  id: FormatId
  name: string
  columns: Column[]
}

// Los nombres de formatos y columnas están en textos.ts, en cada idioma.
const FORMAT_DEFS: { id: FormatId; columns: ColumnDef[] }[] = [
  {
    id: 'single',
    columns: [{ id: 'idea', paletteKey: 'lightYellow', hex: '#FFE8A3' }],
  },
  {
    id: 'retro',
    columns: [
      { id: 'bien', paletteKey: 'lightGreen', hex: '#AFF4C6' },
      { id: 'mejorar', paletteKey: 'lightRed', hex: '#FFC7C2' },
      { id: 'probar', paletteKey: 'lightBlue', hex: '#BDE3FF' },
    ],
  },
  {
    id: 'ssc',
    columns: [
      { id: 'empezar', paletteKey: 'lightGreen', hex: '#AFF4C6' },
      { id: 'dejar', paletteKey: 'lightRed', hex: '#FFC7C2' },
      { id: 'seguir', paletteKey: 'lightBlue', hex: '#BDE3FF' },
    ],
  },
]

const MIN_PEOPLE = 3
const MAX_CHARS = 280
const MAX_QUESTION = 140
// Medido con Inter en Figma: las pestañas en español ocupan 379 px de los 392 de contenido.
const WIDTH = 440
const TIMER_MINUTES = [3, 5, 10]
const SECTION_GAP = 40
const INK = '#1D1D1F'
const MUTED = '#6B6B66'
// Último idioma elegido en este ordenador: con él empiezan los tarros nuevos que pongas.
const LANG_KEY = 'hushjar:idioma'

function formatsIn(t: Strings): Format[] {
  return FORMAT_DEFS.map((f) => ({
    id: f.id,
    name: t.formats[f.id],
    columns: f.columns.map((c) => ({ ...c, label: t.columns[c.id] })),
  }))
}

function formatById(formats: Format[], id: string): Format {
  return formats.find((f) => f.id === id) || formats[0]
}

// Las ideas de una columna que ya no existe (p. ej. llegaron tarde de otra ronda) van a la primera.
function columnOf(slip: Slip, format: Format): string {
  return slip.c && format.columns.some((c) => c.id === slip.c) ? slip.c : format.columns[0].id
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

function hexToRgb(hex: string): RGB {
  return {
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  }
}


function Button(props: { label: string; onClick: () => Promise<void> | void; tone?: Tone }) {
  const primary = (props.tone || 'primary') === 'primary'
  return (
    <AutoLayout
      width="fill-parent"
      padding={{ vertical: 12, horizontal: 16 }}
      cornerRadius={12}
      horizontalAlignItems="center"
      fill={primary ? INK : '#FFFFFF'}
      stroke={primary ? INK : '#D8D4CA'}
      hoverStyle={{ fill: primary ? '#3A3A3C' : '#F4F2EC' }}
      onClick={props.onClick}
    >
      <Text fontSize={15} fontWeight={600} fill={primary ? '#FFFFFF' : INK}>
        {props.label}
      </Text>
    </AutoLayout>
  )
}

function Chip(props: { label: string; active: boolean; onClick: () => Promise<void> | void }) {
  return (
    <AutoLayout
      padding={{ vertical: 7, horizontal: 11 }}
      cornerRadius={999}
      fill={props.active ? INK : '#F4F2EC'}
      stroke={props.active ? INK : '#E0DBCF'}
      hoverStyle={{ fill: props.active ? '#3A3A3C' : '#EAE6DB' }}
      onClick={props.onClick}
    >
      <Text fontSize={13} fill={props.active ? '#FFFFFF' : INK}>
        {props.label}
      </Text>
    </AutoLayout>
  )
}

// Pestañas clásicas: la activa en negrita y subrayada; las demás en gris, con fondo al pasar el ratón.
function Tabs(props: { items: { id: string; label: string }[]; active: string; onSelect: (id: string) => void }) {
  return (
    <AutoLayout direction="vertical" width="fill-parent" spacing={0}>
      <AutoLayout direction="horizontal" width="fill-parent" spacing={4} verticalAlignItems="end">
        {props.items.map((item) => {
          const on = item.id === props.active
          return (
            <AutoLayout
              key={item.id}
              direction="vertical"
              spacing={8}
              padding={{ top: 9, horizontal: 8 }}
              horizontalAlignItems="center"
              cornerRadius={{ topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 }}
              hoverStyle={on ? undefined : { fill: '#F4F2EC' }}
              onClick={() => props.onSelect(item.id)}
            >
              <Text fontSize={13} fontWeight={on ? 700 : 500} fill={on ? INK : MUTED}>
                {item.label}
              </Text>
              <AutoLayout width="fill-parent" height={3} cornerRadius={2} fill={on ? INK : undefined} />
            </AutoLayout>
          )
        })}
      </AutoLayout>
      <AutoLayout width="fill-parent" height={1} fill="#E6E2D8" />
    </AutoLayout>
  )
}

// Columna con su color y, si se pasa, cuántas ideas tiene (solo se enseña con el tarro abierto).
function ColumnTag(props: { column: Column; count?: number }) {
  return (
    <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center">
      <AutoLayout width={12} height={12} cornerRadius={6} fill={props.column.hex} stroke="#C9C4B8" />
      <Text fontSize={props.count === undefined ? 12 : 13} fill={INK}>
        {props.column.label}
      </Text>
      {props.count === undefined ? null : (
        <Text fontSize={13} fontWeight={700} fill={INK}>
          {props.count}
        </Text>
      )}
    </AutoLayout>
  )
}

function Label(props: { children: string }) {
  return (
    <Text fontSize={12} fontWeight={700} fill={MUTED} letterSpacing={0.4}>
      {props.children}
    </Text>
  )
}

function Hint(props: { children: string }) {
  return (
    <Text fontSize={13} fill={MUTED} width="fill-parent" horizontalAlignText="center" lineHeight={19}>
      {props.children}
    </Text>
  )
}

function HushJar() {
  const nodeId = useWidgetNodeId()
  const [phase, setPhase] = useSyncedState<Phase>('phase', 'setup')
  const [question, setQuestion] = useSyncedState<string>('question', '')
  const [formatId, setFormatId] = useSyncedState<FormatId>('format', 'single')
  const [facilitator, setFacilitator] = useSyncedState<Person | null>('facilitator', null)
  const [round, setRound] = useSyncedState<number>('round', 1)
  const [reveal, setReveal] = useSyncedState<Reveal | null>('reveal', null)
  const [storedLang, setLang] = useSyncedState<string>('lang', '')
  const slips = useSyncedMap<Slip>('slips')
  const people = useSyncedMap<number>('people')

  const lang: Lang = isLang(storedLang) ? storedLang : DEFAULT_LANG
  const t = strings(lang)
  const formats = formatsIn(t)
  const format = formatById(formats, formatId)
  const multi = format.columns.length > 1
  // Una retro sin título se llama como su formato, en el idioma que tenga el tarro en cada momento.
  const title = question || format.name
  const ideas = slips.size
  const writers = people.keys().filter((key) => key.indexOf(`${round}:`) === 0).length
  // Se puede volver a la preparación mientras nadie haya escrito en esta ronda (las ideas que
  // llegaron tarde de la anterior no cuentan: saldrán igual).
  const canGoBack = phase === 'open' && writers === 0

  // Un tarro recién puesto empieza en el último idioma que eligió en su ordenador quien lo pone.
  useEffect(() => {
    if (storedLang) return
    waitForTask(
      figma.clientStorage.getAsync(LANG_KEY).then(
        (saved) => setLang(isLang(saved) ? saved : DEFAULT_LANG),
        () => setLang(DEFAULT_LANG),
      ),
    )
  })

  // ---------- quién es quién (solo dentro de handlers) ----------

  function me(): Person | null {
    const user = figma.currentUser
    if (!user) return null
    return { id: user.id || `sesion-${user.sessionId}`, name: user.name }
  }

  function onlyFacilitator(): boolean {
    const current = me()
    if (facilitator && current && current.id === facilitator.id) return true
    figma.notify(facilitator ? t.onlyFacilitator(facilitator.name) : t.pressStartFirst)
    return false
  }

  // Antes de la primera ronda cualquiera puede prepararla; después, solo quien dirige.
  function canPrepare(): boolean {
    return !facilitator || onlyFacilitator()
  }

  // ---------- preparación ----------

  function editQuestion(text: string) {
    if (!canPrepare()) return
    setQuestion(text.trim().slice(0, MAX_QUESTION))
  }

  function chooseQuestion(text: string) {
    if (!canPrepare()) return
    setQuestion(text)
  }

  function chooseFormat(id: FormatId) {
    if (!canPrepare()) return
    setFormatId(id)
  }

  async function start() {
    const current = me()
    if (!current) {
      figma.notify(t.whoAreYou)
      return
    }
    if (facilitator && !onlyFacilitator()) return
    if (!question.trim() && !multi) {
      figma.notify(t.needQuestion)
      return
    }
    if (!facilitator) setFacilitator(current)
    setPhase('open')
  }

  // Por si empezaste con el formato o la pregunta equivocados: vuelve a la preparación con todo
  // como estaba.
  async function goBack() {
    if (!onlyFacilitator()) return
    if (!canGoBack) {
      figma.notify(t.cantGoBack)
      return
    }
    setPhase('setup')
  }

  // ---------- escribir ----------

  async function writeIdea() {
    // En este ordenador (clientStorage) se guardan dos cosas que nunca van al tarro:
    // un token al azar para contar personas sin saber quiénes son, y las claves de tus ideas,
    // para que solo tú puedas editarlas o retirarlas.
    const tokenKey = `hushjar:${nodeId}:persona`
    const mineKey = `hushjar:${nodeId}:mias`
    let token: string | undefined
    let mineKeys: string[] = []
    try {
      token = await figma.clientStorage.getAsync(tokenKey)
      const stored = await figma.clientStorage.getAsync(mineKey)
      if (Array.isArray(stored)) mineKeys = stored.filter((key) => typeof key === 'string' && slips.has(key))
    } catch (e) {
      // Sin clientStorage no se puede recordar entre ventanas qué ideas son tuyas.
    }
    const saveMine = async () => {
      try {
        await figma.clientStorage.setAsync(mineKey, mineKeys)
      } catch (e) {
        // Igual que arriba: sin clientStorage la lista solo vale para esta ventana.
      }
    }
    await saveMine() // de paso olvida las ideas que ya salieron del tarro
    const myIdeas = () =>
      mineKeys.filter((key) => slips.has(key)).map((key) => {
        const slip = slips.get(key) as Slip
        return { key, t: slip.t, c: columnOf(slip, format) }
      })
    let roundNow = round
    const openedIn = round

    figma.showUI(__html__, { width: 380, height: multi ? 380 : 336, title: t.panelTitle, themeColors: true })
    figma.ui.postMessage({
      type: 'init',
      lang,
      text: t.panel,
      question: title,
      columns: format.columns.map((c) => ({ id: c.id, label: c.label, hex: c.hex })),
      mine: myIdeas(),
    })

    await new Promise<void>((resolve) => {
      // Echar, editar o retirar se aplica tras unos segundos al azar: así el momento del clic
      // no delata a nadie. `run(live)`: live=false cuando la ventana se está cerrando.
      let pending: { run: (live: boolean) => void; timer: number } | null = null

      const flush = () => {
        if (!pending) return
        const { run, timer } = pending
        pending = null
        clearTimeout(timer)
        run(false)
      }
      // Si alguien cierra la ventana antes de que termine el retraso, se aplica ya.
      const onClose = () => flush()
      figma.on('close', onClose)

      const later = (action: 'seal' | 'edit' | 'retract', run: (live: boolean, late: boolean) => void) => {
        const delay = 2000 + Math.floor(Math.random() * 3000)
        const timer = setTimeout(async () => {
          // Relee el estado: quizá el tarro se abrió o cambió de ronda mientras tanto.
          const node = await figma.getNodeByIdAsync(nodeId)
          const state = node && node.type === 'WIDGET' ? node.widgetSyncedState : {}
          if (typeof state.round === 'number') roundNow = state.round
          // Tarde = el tarro se abrió, o empezó otra ronda, desde que se abrió la ventanita. Si quien
          // dirige solo ha vuelto a la preparación, la idea sigue siendo de esta ronda.
          const late = state.phase === 'revealed' || roundNow !== openedIn
          pending = null
          run(true, late)
        }, delay)
        pending = { run: (live) => run(live, false), timer }
        figma.ui.postMessage({ type: 'sealing', action, seconds: Math.round(delay / 1000) })
      }

      const alreadyOut = (key: string) => {
        mineKeys = mineKeys.filter((k) => k !== key)
        void saveMine()
        figma.ui.postMessage({ type: 'refused', key, text: t.alreadyOut })
      }

      figma.ui.onmessage = async (msg) => {
        if (!msg) return
        if (msg.type === 'close') {
          flush()
          figma.off('close', onClose)
          resolve()
          return
        }
        if (msg.type === 'resize') {
          figma.ui.resize(380, Math.max(300, Math.min(640, Math.round(Number(msg.height) || 0))))
          return
        }
        if (msg.type === 'ready' && !token) {
          token = String(msg.token)
          try {
            await figma.clientStorage.setAsync(tokenKey, token)
          } catch (e) {
            // Sin clientStorage el token solo vale para esta ventana: esa persona podría contar dos veces.
          }
          return
        }
        if (pending) return // una operación cada vez; la ventanita bloquea los botones mientras tanto

        const key = String(msg.key || '')
        const text = String(msg.text || '').trim().slice(0, MAX_CHARS)
        const c = columnOf({ t: text, c: String(msg.c || '') }, format)

        if (msg.type === 'seal') {
          if (!text || !key) return
          // Primero se programa el guardado (sin esperas), para que cerrar la ventana justo
          // después de sellar no pierda la idea; luego se apunta como tuya en este ordenador.
          later('seal', (live, late) => {
            slips.set(key, { t: text, c })
            if (token) people.set(`${roundNow}:${token}`, 1)
            if (live) figma.ui.postMessage({ type: 'saved', key, t: text, c, late })
          })
          mineKeys.push(key)
          void saveMine()
        }

        if (msg.type === 'edit') {
          if (!text || mineKeys.indexOf(key) < 0) return // solo tus propias ideas
          if (!slips.has(key)) return alreadyOut(key)
          later('edit', (live, late) => {
            if (late || !slips.has(key)) {
              if (live) alreadyOut(key)
              return
            }
            slips.set(key, { t: text, c })
            if (live) figma.ui.postMessage({ type: 'edited', key, t: text, c })
          })
        }

        if (msg.type === 'retract') {
          if (mineKeys.indexOf(key) < 0) return
          if (!slips.has(key)) return alreadyOut(key)
          later('retract', (live, late) => {
            if (late || !slips.has(key)) {
              if (live) alreadyOut(key)
              return
            }
            slips.delete(key)
            mineKeys = mineKeys.filter((k) => k !== key)
            void saveMine()
            if (live) figma.ui.postMessage({ type: 'retracted', key })
          })
        }
      }
    })
  }

  // ---------- temporizador ----------

  async function startTimer(minutes: number) {
    if (!onlyFacilitator()) return
    const timer = figma.timer
    if (!timer) {
      figma.notify(t.noTimer)
      return
    }
    try {
      timer.start(minutes * 60)
      figma.notify(t.timerStarted(minutes))
    } catch (e) {
      figma.notify(t.timerFailed)
    }
  }

  // ---------- abrir el tarro ----------

  // Baja desde `y` hasta encontrar un hueco del tamaño pedido que no pise nada del tablero.
  function freeTop(x: number, y: number, width: number, height: number): number {
    const boxes: Rect[] = []
    for (const child of figma.currentPage.children) {
      if (child.id === nodeId || !('absoluteBoundingBox' in child) || !child.absoluteBoundingBox) continue
      boxes.push(child.absoluteBoundingBox)
    }
    let top = y
    for (let i = 0; i < 200; i++) {
      const hit = boxes.find((b) => b.x < x + width && b.x + b.width > x && b.y < top + height && b.y + b.height > top)
      if (!hit) break
      top = hit.y + hit.height + SECTION_GAP * 2
    }
    return top
  }

  async function openJar(force: boolean) {
    if (!onlyFacilitator()) return
    const entries = slips.entries()
    if (!entries.length) {
      figma.notify(t.emptyJar)
      return
    }
    if (!force && writers < MIN_PEOPLE) {
      setPhase('confirm')
      return
    }
    const node = await figma.getNodeByIdAsync(nodeId)
    if (!node || node.type !== 'WIDGET') return
    const box = node.absoluteBoundingBox || { x: node.x, y: node.y, width: node.width, height: node.height }

    const probe = figma.createSticky()
    await figma.loadFontAsync(probe.text.fontName as FontName)
    probe.remove()
    const palette: { [key: string]: string } = figma.constants.colors.figJamBaseLight

    // Primero se mide todo, para buscar un hueco donde quepan todas las secciones sin pisar
    // las de rondas anteriores ni nada más del tablero.
    const layout = format.columns.map((column) => {
      const items = shuffle(entries.filter(([, slip]) => columnOf(slip, format) === column.id))
      const perRow = multi ? 2 : Math.max(1, Math.min(4, items.length))
      const rows = Math.max(1, Math.ceil(items.length / perRow))
      return { column, items, perRow, width: perRow * 260 + 60, height: rows * 260 + 100 }
    })
    const left = box.x + box.width + 120
    const totalWidth = layout.reduce((sum, l) => sum + l.width, 0) + SECTION_GAP * (layout.length - 1)
    const totalHeight = Math.max(...layout.map((l) => l.height))
    const top = freeTop(left, box.y, totalWidth, totalHeight)

    const sections: SectionNode[] = []
    const counts: { [column: string]: number } = {}
    let x = left
    for (const { column, items, perRow, width, height } of layout) {
      counts[column.id] = items.length
      const section = figma.createSection()
      section.name = multi ? `${column.label} · ${title}` : title
      section.x = x
      section.y = top
      section.resizeWithoutConstraints(width, height)
      x += width + SECTION_GAP

      const color = hexToRgb(palette[column.paletteKey] || column.hex)
      items.forEach(([key, slip], i) => {
        const sticky = figma.createSticky()
        section.appendChild(sticky)
        sticky.x = 40 + (i % perRow) * 260
        sticky.y = 70 + Math.floor(i / perRow) * 260
        sticky.text.characters = slip.t
        sticky.authorVisible = false
        sticky.fills = [{ type: 'SOLID', color }]
        slips.delete(key)
      })
      sections.push(section)
    }

    setReveal({ count: entries.length, sectionIds: sections.map((s) => s.id), counts })
    setPhase('revealed')
    figma.viewport.scrollAndZoomIntoView([node, ...sections])
  }

  async function keepWaiting() {
    if (onlyFacilitator()) setPhase('open')
  }

  async function showIdeas() {
    const ids = reveal ? reveal.sectionIds || (reveal.sectionId ? [reveal.sectionId] : []) : []
    const found: SceneNode[] = []
    for (const id of ids) {
      const node = await figma.getNodeByIdAsync(id)
      if (node && node.type === 'SECTION') found.push(node)
    }
    if (!found.length) {
      figma.notify(t.sectionsMissing)
      return
    }
    figma.viewport.scrollAndZoomIntoView(found)
  }

  // Cada ronda empieza eligiendo su pregunta. Las ideas que llegaron tarde siguen en el tarro.
  async function newRound() {
    if (!onlyFacilitator()) return
    for (const key of people.keys()) people.delete(key)
    setRound(round + 1)
    setReveal(null)
    setQuestion('')
    setPhase('setup')
  }

  // El idioma está siempre en el menú; cualquiera puede cambiarlo y se ve igual para todos.
  const languageItem: WidgetPropertyMenuItem = {
    itemType: 'dropdown',
    propertyName: 'lang',
    tooltip: t.menuLanguage,
    selectedOption: lang,
    options: LANGS.map((l) => ({ option: l.id, label: l.label })),
  }

  usePropertyMenu(
    phase === 'setup'
      ? [languageItem]
      : [
          languageItem,
          { itemType: 'separator' },
          { itemType: 'action', propertyName: 'takeover', tooltip: t.menuTakeover },
          { itemType: 'action', propertyName: 'reset', tooltip: t.menuReset },
        ],
    async ({ propertyName, propertyValue }) => {
      if (propertyName === 'lang') {
        if (!isLang(propertyValue)) return
        setLang(propertyValue)
        try {
          await figma.clientStorage.setAsync(LANG_KEY, propertyValue)
        } catch (e) {
          // Sin clientStorage el idioma cambia en este tarro, pero los siguientes no lo recordarán.
        }
      }
      if (propertyName === 'takeover') {
        const current = me()
        if (!current) return
        setFacilitator(current)
        figma.notify(t.nowYouLead(current.name))
      }
      if (propertyName === 'reset') {
        if (!onlyFacilitator()) return
        for (const key of slips.keys()) slips.delete(key)
        for (const key of people.keys()) people.delete(key)
        setReveal(null)
        setRound(1)
        setQuestion('')
        setFormatId('single')
        setFacilitator(null)
        setPhase('setup')
      }
    },
  )

  // ---------- render ----------

  const revealedCounts = phase === 'revealed' && reveal && reveal.counts ? reveal.counts : null

  return (
    <AutoLayout
      direction="vertical"
      width={WIDTH}
      padding={{ top: 20, bottom: 20, horizontal: 24 }}
      spacing={16}
      cornerRadius={28}
      fill="#FFFFFF"
      stroke="#E6E2D8"
      strokeWidth={2}
      horizontalAlignItems="center"
      effect={{ type: 'drop-shadow', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 6 }, blur: 20 }}
    >
      <AutoLayout direction="horizontal" width="fill-parent" height={20} verticalAlignItems="center" spacing="auto">
        {canGoBack ? (
          <AutoLayout padding={{ vertical: 2 }} onClick={goBack}>
            <Text fontSize={13} fontWeight={600} fill={MUTED} hoverStyle={{ fill: INK }}>
              {t.back}
            </Text>
          </AutoLayout>
        ) : (
          <Text fontSize={12} fontWeight={700} fill={MUTED} letterSpacing={0.6}>
            HUSH JAR
          </Text>
        )}
        {round > 1 || phase !== 'setup' ? (
          <Text fontSize={12} fill={MUTED}>
            {t.round(round)}
          </Text>
        ) : null}
      </AutoLayout>

      {phase === 'setup' ? (
        <AutoLayout direction="vertical" width="fill-parent" spacing={18} horizontalAlignItems="center">
          <SVG src={jarSvg(ideas, false)} width={92} height={108} />

          <AutoLayout direction="vertical" width="fill-parent" spacing={10}>
            <Tabs items={formats.map((f) => ({ id: f.id, label: f.name }))} active={formatId} onSelect={(id) => chooseFormat(id as FormatId)} />
            {multi ? (
              <AutoLayout direction="horizontal" width="fill-parent" spacing={12} wrap>
                {format.columns.map((c) => (
                  <ColumnTag key={c.id} column={c} />
                ))}
              </AutoLayout>
            ) : null}
          </AutoLayout>

          <AutoLayout direction="vertical" width="fill-parent" spacing={8}>
            <Label>{multi ? t.labelTitle : t.labelQuestion(round)}</Label>
            <Input
              value={question}
              placeholder={multi ? t.placeholderTitle(format.id) : t.placeholderQuestion}
              onTextEditEnd={(e) => editQuestion(e.characters)}
              fontSize={17}
              fontWeight={500}
              fill={INK}
              width="fill-parent"
              inputBehavior="wrap"
              placeholderProps={{ fill: '#A39D90' }}
              inputFrameProps={{
                fill: '#FFFFFF',
                stroke: '#BDB7A9',
                strokeWidth: 1.5,
                cornerRadius: 10,
                padding: { vertical: 13, horizontal: 14 },
                hoverStyle: { stroke: INK },
              }}
            />
          </AutoLayout>

          {multi ? null : (
            <AutoLayout direction="vertical" width="fill-parent" spacing={8}>
              <Text fontSize={12} fill={MUTED}>
                {t.orPick}
              </Text>
              <AutoLayout direction="horizontal" width="fill-parent" spacing={6} wrap>
                {t.suggestions.map((s) => (
                  <Chip key={s} label={s} active={question === s} onClick={() => chooseQuestion(s)} />
                ))}
              </AutoLayout>
            </AutoLayout>
          )}

          <Hint>{ideas > 0 ? t.lateInJar(ideas) : multi ? t.hintColumns : t.hintSingle}</Hint>
          <Button label={t.start(round)} onClick={start} />
        </AutoLayout>
      ) : (
        <AutoLayout direction="vertical" width="fill-parent" spacing={14} horizontalAlignItems="center">
          <Text fontSize={20} fontWeight={700} fill={INK} width="fill-parent" horizontalAlignText="center">
            {title}
          </Text>
          <SVG src={jarSvg(ideas, phase === 'revealed')} width={170} height={200} />
          {multi && !revealedCounts ? (
            <AutoLayout direction="horizontal" spacing={12} wrap horizontalAlignItems="center">
              {format.columns.map((c) => (
                <ColumnTag key={c.id} column={c} />
              ))}
            </AutoLayout>
          ) : null}
        </AutoLayout>
      )}

      {phase === 'open' ? (
        <AutoLayout direction="vertical" width="fill-parent" spacing={12} horizontalAlignItems="center">
          <AutoLayout direction="vertical" spacing={4} horizontalAlignItems="center" width="fill-parent">
            <Text fontSize={16} fontWeight={600} fill={INK}>
              {ideas === 0 ? t.noIdeasYet : writers > 0 ? `${t.ideas(ideas)} · ${t.people(writers)}` : t.ideas(ideas)}
            </Text>
            <Hint>{t.nobodyReads}</Hint>
          </AutoLayout>
          <Button label={t.write} onClick={writeIdea} />
          <Button label={t.open} tone="secondary" onClick={() => openJar(false)} />
          <AutoLayout direction="horizontal" spacing={6} verticalAlignItems="center">
            <Text fontSize={12} fill={MUTED}>
              {t.timer}
            </Text>
            {TIMER_MINUTES.map((m) => (
              <Chip key={`t${m}`} label={`${m} min`} active={false} onClick={() => startTimer(m)} />
            ))}
          </AutoLayout>
        </AutoLayout>
      ) : null}

      {phase === 'confirm' ? (
        <AutoLayout direction="vertical" width="fill-parent" spacing={12}>
          <AutoLayout direction="vertical" width="fill-parent" padding={14} spacing={4} cornerRadius={12} fill="#FFF1D6">
            <Text fontSize={14} fontWeight={600} fill="#8A5300">
              {writers === 0 ? t.nobodyWrote : t.onlyWrote(writers)}
            </Text>
            <Text fontSize={13} fill="#8A5300" width="fill-parent" lineHeight={19}>
              {t.easyToGuess(MIN_PEOPLE)}
            </Text>
          </AutoLayout>
          <AutoLayout direction="horizontal" width="fill-parent" spacing={8}>
            <Button label={t.wait} tone="secondary" onClick={keepWaiting} />
            <Button label={t.openAnyway} onClick={() => openJar(true)} />
          </AutoLayout>
        </AutoLayout>
      ) : null}

      {phase === 'revealed' && reveal ? (
        <AutoLayout direction="vertical" width="fill-parent" spacing={12} horizontalAlignItems="center">
          <AutoLayout direction="vertical" spacing={4} horizontalAlignItems="center" width="fill-parent">
            <Text fontSize={16} fontWeight={600} fill={INK}>
              {t.opened(reveal.count)}
            </Text>
            {multi && revealedCounts ? (
              <AutoLayout direction="horizontal" spacing={14} wrap horizontalAlignItems="center">
                {format.columns.map((c) => (
                  <ColumnTag key={c.id} column={c} count={revealedCounts[c.id] || 0} />
                ))}
              </AutoLayout>
            ) : null}
            {ideas > 0 ? <Hint>{t.newIdeas(ideas)}</Hint> : null}
          </AutoLayout>
          <AutoLayout direction="horizontal" width="fill-parent" spacing={8}>
            <Button label={t.showIdeas} tone="secondary" onClick={showIdeas} />
            <Button label={t.newRound} onClick={newRound} />
          </AutoLayout>
        </AutoLayout>
      ) : null}

      {facilitator ? (
        <Text fontSize={12} fill={MUTED}>
          {t.ledBy(facilitator.name)}
        </Text>
      ) : null}
    </AutoLayout>
  )
}

widget.register(HushJar)
