// Prueba de humo de Hush Jar: simula una sesión completa con varias personas contra una API de
// Figma simulada. Comprueba el flujo, el anonimato (nada identifica a quien escribe) y los casos
// raros (idea que llega tarde, ventana cerrada antes de tiempo) y los dos idiomas. Los tiempos se
// aceleran x100. Además guarda el dibujo del tarro en varios estados en scripts/preview-tarro.html
// y la ventanita privada en español e inglés en scripts/preview-ventana.html.
import { readFileSync, writeFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('../dist/code.js', import.meta.url), 'utf8')
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'))
let activeUsers = []
const SPEED = 100
const realSetTimeout = setTimeout
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms))

// ---------- widget simulado ----------
class FakeSyncedMap {
  constructor() { this.m = new Map() }
  get size() { return this.m.size }
  get length() { return this.m.size }
  has(k) { return this.m.has(k) }
  get(k) { return this.m.get(k) }
  set(k, v) { this.m.set(k, JSON.parse(JSON.stringify(v))) }
  delete(k) { this.m.delete(k) }
  keys() { return [...this.m.keys()] }
  values() { return [...this.m.values()] }
  entries() { return [...this.m.entries()] }
}
const maps = {}
const state = new Map()
let registered = null
let propertyHandler = null
let menuItems = []
let effects = []
const tasks = []
const h = (type, props, ...children) => {
  const all = { ...(props || {}), children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false) }
  return typeof type === 'function' ? type(all) : { type, props: all }
}
const widgetApi = {
  register: (fn) => { registered = fn },
  h, Fragment: 'Fragment', AutoLayout: 'AutoLayout', Text: 'Text', Input: 'Input', SVG: 'SVG',
  useSyncedMap: (name) => (maps[name] ||= new FakeSyncedMap()),
  useSyncedState: (name, def) => {
    const d = typeof def === 'function' ? def() : def
    const cur = state.has(name) ? state.get(name) : d
    return [cur, (v) => { const prev = state.has(name) ? state.get(name) : d; state.set(name, typeof v === 'function' ? v(prev) : v) }]
  },
  usePropertyMenu: (items, onChange) => { menuItems = items; propertyHandler = onChange },
  useWidgetNodeId: () => '1:23',
  useEffect: (fn) => { effects.push(fn) },
  waitForTask: (task) => { tasks.push(task) },
}

// ---------- documento simulado ----------
let nextId = 100
const nodes = new Map()
function makeNode(type, extra = {}) {
  const node = {
    id: `9:${nextId++}`, type, x: 0, y: 0, width: 240, height: 240, parent: null, children: [], name: '',
    appendChild(child) { if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1); child.parent = this; this.children.push(child) },
    remove() { nodes.delete(this.id); if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); for (const c of [...this.children]) c.remove() },
    resizeWithoutConstraints(w, hh) { this.width = w; this.height = hh },
    ...extra,
  }
  // Los nodos de primer nivel están en coordenadas absolutas; basta con reflejar x, y, ancho y alto.
  Object.defineProperty(node, 'absoluteBoundingBox', {
    get() { return { x: this.x, y: this.y, width: this.width, height: this.height } },
    configurable: true,
  })
  nodes.set(node.id, node)
  return node
}
const widgetNode = makeNode('WIDGET', { x: 100, y: 100, width: 380, height: 520 })
nodes.delete(widgetNode.id); widgetNode.id = '1:23'; nodes.set('1:23', widgetNode)
Object.defineProperty(widgetNode, 'widgetSyncedState', { get: () => Object.fromEntries(state) })

const listeners = {}
function emit(type) { for (const fn of listeners[type] || []) fn() }
const devices = { A: new Map(), B: new Map(), C: new Map() }
let device = devices.A
const users = {
  jorge: { id: '111', name: 'Jorge Molina', sessionId: 1 },
  ana: { id: '222', name: 'Ana', sessionId: 2 },
  luis: { id: '333', name: 'Luis', sessionId: 3 },
}
let currentUser = users.jorge
const notices = []
let ui = null

const figma = {
  widget: widgetApi,
  get currentUser() { return currentUser },
  // Como en Figma: sin el permiso «activeusers» en manifest.json, leerlo da error.
  get activeUsers() { if (!manifest.permissions?.includes('activeusers')) throw new Error('falta el permiso activeusers'); return activeUsers },
  set activeUsers(v) { activeUsers = v },
  clientStorage: {
    getAsync: async (k) => (device.has(k) ? JSON.parse(device.get(k)) : undefined),
    setAsync: async (k, v) => { device.set(k, JSON.stringify(v)) },
  },
  getNodeByIdAsync: async (id) => nodes.get(id) || null,
  get currentPage() { return { children: [...nodes.values()].filter((n) => !n.parent) } },
  createSection: () => makeNode('SECTION'),
  createSticky: () => makeNode('STICKY', { text: { fontName: { family: 'Inter', style: 'Medium' }, characters: '' }, authorVisible: true, authorName: currentUser.name }),
  loadFontAsync: async () => {},
  on: (t, fn) => { (listeners[t] ||= []).push(fn) },
  off: (t, fn) => { listeners[t] = (listeners[t] || []).filter((f) => f !== fn) },
  notify: (m) => { notices.push(m) },
  viewport: { last: null, scrollAndZoomIntoView(nodesInView) { this.last = nodesInView } },
  constants: { colors: { figJamBaseLight: { lightYellow: '#FFE8A3', lightGreen: '#AFF4C6', lightRed: '#FFC7C2', lightBlue: '#BDE3FF' } } },
  timer: { state: 'STOPPED', startedWith: null, start(s) { this.startedWith = s; this.state = 'RUNNING' } },
  showUI: () => {
    const token = Math.random().toString(16).slice(2)
    realSetTimeout(() => ui.onmessage && ui.onmessage({ type: 'ready', token }), 1)
  },
}
ui = { onmessage: null, posted: [], postMessage(m) { this.posted.push(m) } }
figma.ui = ui

const sandbox = {
  figma, console, __html__: '<html></html>',
  setTimeout: (fn, ms) => realSetTimeout(fn, (ms || 0) / SPEED),
  clearTimeout,
  setInterval: (fn, ms) => setInterval(fn, Math.max(1, (ms || 0) / SPEED)),
  clearInterval,
}
vm.createContext(sandbox)
vm.runInContext(code, sandbox)

// ---------- utilidades ----------
function walk(node, visit) {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const c of node.props?.children || []) walk(c, visit)
}
// Como en Figma: después de cada render se ejecutan los efectos.
const tree = () => { effects = []; const out = registered(); for (const fn of effects) fn(); return out }
// Renderiza y espera a las tareas de los efectos (p. ej. leer el idioma guardado en el ordenador).
const settle = async () => { tree(); while (tasks.length) await tasks.shift() }
const texts = () => { const out = []; walk(tree(), (n) => { if (n.type === 'Text') out.push((n.props.children || []).join('')); if (n.type === 'Input' && n.props.value) out.push(n.props.value) }); return out }
const svgSrc = () => { let s = ''; walk(tree(), (n) => { if (n.type === 'SVG') s = n.props.src }); return s }
function button(label) {
  let found = null
  walk(tree(), (n) => { if (n.type === 'AutoLayout' && typeof n.props.onClick === 'function' && n.props.children?.[0]?.props?.children?.join?.('') === label) found = n })
  if (!found) throw new Error(`No hay botón «${label}». Textos: ${texts().join(' | ')}`)
  return found.props.onClick
}
const failures = []
function check(name, ok, detail = '') {
  console.log(`${ok ? 'OK ' : 'MAL'} ${name.padEnd(46)} ${detail}`)
  if (!ok) failures.push(name)
}
const shows = (fragment) => texts().some((t) => t.includes(fragment))
const previews = []
const snap = (label) => previews.push({ label, svg: svgSrc() })

const writeLabel = () => (state.get('lang') === 'en' ? 'Write an idea' : 'Escribir una idea')

// Abre la ventanita, sella una idea y, según el caso, espera a que se guarde o cierra antes.
async function writeIdea(text, { closeEarly = false, beforeSave } = {}) {
  ui.posted.length = 0
  const running = button(writeLabel())()
  await sleep(10)
  ui.onmessage({ type: 'seal', key: Math.random().toString(16).slice(2, 26), text })
  if (closeEarly) {
    emit('close') // la persona cierra la ventana con la X antes del retraso
    return
  }
  if (beforeSave) await beforeSave()
  for (let i = 0; i < 100 && !ui.posted.some((m) => m.type === 'saved'); i++) await sleep(5)
  const saved = ui.posted.find((m) => m.type === 'saved')
  ui.onmessage({ type: 'close' })
  await running
  return saved
}

// ---------- sesión ----------
const menu = async (name, value) => { tree(); await propertyHandler({ propertyName: name, propertyValue: value }) }
const menuNow = () => { tree(); return menuItems }
const input = () => { let found = null; walk(tree(), (n) => { if (n.type === 'Input') found = n }); return found }
const isYellow = (s) => { const c = s.fills?.[0]?.color; return !!c && Math.round(c.r * 255) === 255 && Math.round(c.g * 255) === 232 && Math.round(c.b * 255) === 163 }

// Jorge ya eligió español alguna vez en su ordenador: su tarro nuevo empieza en español.
devices.A.set('hushjar:idioma', JSON.stringify('es'))
await settle()
check('idioma · el tarro nuevo usa tu último idioma', state.get('lang') === 'es' && shows('Una pregunta'), state.get('lang'))
const langMenu = menuNow()
check('idioma · en la preparación el menú solo tiene el idioma', langMenu.length === 1 && langMenu[0].itemType === 'dropdown' && langMenu[0].selectedOption === 'es' && langMenu[0].options.map((o) => o.label).join('/') === 'Español/English')

snap('Preparación')
check('preparación · campo vacío con texto de ejemplo', input()?.props.value === '' && input()?.props.placeholder?.includes('Escribe aquí'))
check('preparación · el campo se ve como campo', !!input()?.props.inputFrameProps?.stroke && input()?.props.inputFrameProps?.fill === '#FFFFFF')
check('preparación · sugerencias, sin pista ni frase bajo las pestañas', shows('¿Qué ha ido bien?') && shows('¿Qué te preocupa?') && !shows('Haz clic en el recuadro') && !shows('responden a la misma pregunta'))

await button('Empezar')()
check('empezar sin pregunta · avisa y no empieza', state.get('phase') !== 'open' && notices.at(-1)?.includes('Escribe una pregunta'), notices.at(-1))

input().props.onTextEditEnd({ characters: '  ¿Qué podríamos mejorar como equipo?  ' })
check('escribir la pregunta en el campo', state.get('question') === '¿Qué podríamos mejorar como equipo?')
await button('¿Qué te preocupa?')()
check('elegir una sugerencia la pone como pregunta', state.get('question') === '¿Qué te preocupa?')
input().props.onTextEditEnd({ characters: '¿Qué podríamos mejorar como equipo?' })

await button('Empezar')()
check('empezar · quien pulsa dirige', state.get('facilitator')?.name === 'Jorge Molina', `dirige: ${state.get('facilitator')?.name}`)
check('empezar · la pregunta pasa a ser el título', state.get('phase') === 'open' && shows('¿Qué podríamos mejorar como equipo?') && !input())
check('volver · recién empezado se puede volver', shows('← Volver') && !shows('HUSH JAR'))
currentUser = users.ana; device = devices.B
await button('← Volver')()
check('volver · solo quien dirige', state.get('phase') === 'open' && notices.at(-1)?.includes('Solo Jorge Molina'), notices.at(-1))
currentUser = users.jorge; device = devices.A
await button('← Volver')()
check('volver · a la preparación, con todo como estaba', state.get('phase') === 'setup' && input()?.props.value === '¿Qué podríamos mejorar como equipo?' && state.get('facilitator')?.name === 'Jorge Molina' && shows('HUSH JAR'))
await button('Empezar')()

let saved = await writeIdea('Las reuniones de los lunes son demasiado largas')
check('Jorge escribe · se guarda', saved && !saved.late && maps.slips.size === 1)
await writeIdea('Echo de menos las demos de los viernes')
check('Jorge escribe otra · 1 persona, 2 ideas', maps.people.size === 1 && maps.slips.size === 2, texts().find((t) => t.includes('ideas ·')))

currentUser = users.ana; device = devices.B
await writeIdea('Nadie se atreve a decir que el plan no llega a tiempo')
check('Ana escribe desde otro ordenador · 2 personas', maps.people.size === 2, texts().find((t) => t.includes('ideas ·')))
snap('3 ideas')

// Nada de lo guardado identifica a nadie
const stored = JSON.stringify({ slips: maps.slips.entries(), people: maps.people.entries() })
check('anonimato · ni nombres ni ids en el estado', !/Jorge|Ana/.test(stored) && !stored.includes('"111"') && !stored.includes('"222"'))

await button('Abrir el tarro')()
check('Ana no puede abrir el tarro', state.get('phase') === 'open' && notices.at(-1)?.includes('Solo Jorge Molina'), notices.at(-1))

currentUser = users.jorge; device = devices.A
check('volver · cuando ya ha escrito alguien, no se ofrece', !shows('← Volver') && shows('HUSH JAR'))
await button('Abrir el tarro')()
check('con 2 personas pide confirmación', state.get('phase') === 'confirm' && shows('Solo han escrito 2 personas'))
await button('Esperar')()
check('«Esperar» vuelve a abrir la escritura', state.get('phase') === 'open')

currentUser = users.luis; device = devices.C
await writeIdea('Me gustaría tener más tiempo para aprender')
await writeIdea('Idea que llega tarde', {
  beforeSave: async () => {
    // Mientras Luis espera el guardado, Jorge abre el tarro
    const who = currentUser, dev = device
    currentUser = users.jorge; device = devices.A
    await button('Abrir el tarro')()
    currentUser = who; device = dev
  },
})
const late = ui.posted.find((m) => m.type === 'saved')
check('3 personas · se abre sin pedir confirmación', state.get('phase') === 'revealed')
const section = [...nodes.values()].find((n) => n.type === 'SECTION')
const stickies = section ? section.children.filter((c) => c.type === 'STICKY') : []
check('abrir · sección con la pregunta', section?.name === '¿Qué podríamos mejorar como equipo?')
check('abrir · 4 notas con la firma oculta', stickies.length === 4 && stickies.every((s) => s.authorVisible === false), `${stickies.length} notas`)
check('abrir · notas amarillas de la paleta de FigJam', stickies.length > 0 && stickies.every(isYellow))
check('abrir · las notas llevan los textos', stickies.some((s) => s.text.characters.includes('plan no llega')))
check('idea tardía · se avisa y se guarda para la próxima ronda', late?.late === true && maps.slips.size === 1 && shows('1 idea nueva'))
snap('Tarro abierto (con 1 idea tardía)')

currentUser = users.jorge; device = devices.A
await button('Nueva ronda')()
check('nueva ronda · se elige otra pregunta (ronda 2)', state.get('round') === 2 && state.get('phase') === 'setup' && state.get('question') === '' && shows('PREGUNTA PARA LA RONDA 2'))
check('nueva ronda · personas a cero y aviso de la idea tardía', maps.people.size === 0 && shows('hay 1 idea que llegó tarde'))

currentUser = users.ana; device = devices.B
input().props.onTextEditEnd({ characters: 'Pregunta de Ana' })
check('ronda 2 · solo quien dirige cambia la pregunta', state.get('question') === '' && notices.at(-1)?.includes('Solo Jorge Molina'), notices.at(-1))
await button('Empezar la ronda 2')()
check('ronda 2 · solo quien dirige la empieza', state.get('phase') === 'setup')

currentUser = users.jorge; device = devices.A
await button('¿Qué ha ido bien?')()
await button('Empezar la ronda 2')()
check('ronda 2 · empieza con su pregunta y la idea tardía dentro', state.get('phase') === 'open' && shows('¿Qué ha ido bien?') && maps.slips.size === 1, texts().find((t) => t.includes('idea')))
check('volver · la idea tardía de otra ronda no lo impide', shows('← Volver'))

await writeIdea('Cerrar la ventana justo después de sellar', { closeEarly: true })
check('ventana cerrada antes del retraso · la idea no se pierde', maps.slips.size === 2)

for (let i = 0; i < 43; i++) maps.slips.set(`relleno${i}`, { t: `Idea ${i}` })
snap('45 ideas (tarro lleno)')

await menu('reset')
check('vaciar · vuelve a la preparación', state.get('phase') === 'setup' && maps.slips.size === 0 && !state.get('facilitator') && state.get('question') === '')

await button('¿Qué podríamos mejorar?')()
await button('Empezar')()
await button('← Volver')()
await button('Retrospectiva')()
check('volver · se puede cambiar el formato', state.get('phase') === 'setup' && state.get('format') === 'retro' && shows('Qué fue bien'))

// ---------- retro con columnas ----------
await menu('reset')
for (const n of [...nodes.values()]) if (n.type === 'SECTION') n.remove()
currentUser = users.jorge; device = devices.A
const textNode = (label) => { let f = null; walk(tree(), (n) => { if (n.type === 'Text' && (n.props.children || []).join('') === label) f = n }); return f }
check('pestañas · 3 opciones, «Una pregunta» activa', textNode('Una pregunta')?.props.fontWeight === 700 && textNode('Retrospectiva')?.props.fontWeight === 500 && textNode('Empezar · Dejar · Seguir')?.props.fontWeight === 500)
const tabTooltip = (label) => { let tip = null; walk(tree(), (n) => { if (n.type === 'AutoLayout' && n.props.onClick && n.props.children?.[0]?.props?.children?.join?.('') === label) tip = n.props.tooltip }); return tip }
check('pestañas · sin globos al pasar el ratón (Figma los descoloca)', !tabTooltip('Retrospectiva') && !tabTooltip('Una pregunta'))
await button('Retrospectiva')()
check('pestañas · al pulsar «Retrospectiva» pasa a ser la activa', textNode('Retrospectiva')?.props.fontWeight === 700 && textNode('Una pregunta')?.props.fontWeight === 500)
check('retro · formato elegido y columnas a la vista', state.get('format') === 'retro' && shows('Qué fue bien') && shows('Qué mejorar') && shows('Qué probar'))
check('retro · el título es opcional y no hay sugerencias', shows('TÍTULO (OPCIONAL)') && !shows('¿Qué ha ido bien?') && input()?.props.placeholder?.includes('Retro del sprint'))
await button('Empezar')()
check('retro · sin título se llama «Retrospectiva»', state.get('phase') === 'open' && state.get('question') === '' && shows('Retrospectiva'))
check('menú · con la sesión en marcha, idioma y acciones', menuNow().map((i) => i.propertyName || i.itemType).join(',') === 'lang,separator,takeover,reset')

const writeIn = async (text, c) => {
  ui.posted.length = 0
  const running = button(writeLabel())()
  await sleep(10)
  const init = ui.posted.find((m) => m.type === 'init')
  ui.onmessage({ type: 'seal', key: Math.random().toString(16).slice(2, 26), text, c })
  for (let i = 0; i < 100 && !ui.posted.some((m) => m.type === 'saved'); i++) await sleep(5)
  ui.onmessage({ type: 'close' })
  await running
  return init
}
const init = await writeIn('Las demos del viernes', 'bien')
check('retro · la ventanita recibe las 3 columnas', init?.columns?.length === 3 && init.columns[1].label === 'Qué mejorar')
await writeIn('Buen ambiente', 'bien')
currentUser = users.ana; device = devices.B
await writeIn('Demasiadas reuniones', 'mejorar')
await writeIn('Columna inventada', 'xxx')
currentUser = users.luis; device = devices.C
await writeIn('Falta foco', 'mejorar')
check('retro · cada idea guarda su columna', maps.slips.values().filter((s) => s.c === 'mejorar').length === 2 && maps.slips.values().filter((s) => s.c === 'bien').length === 3)
const jarBefore = svgSrc()
check('retro · el tarro no pinta el color de la columna', !jarBefore.includes('#AFF4C6') && !jarBefore.includes('#FFC7C2'))

currentUser = users.ana; device = devices.B
await button('5 min')()
check('temporizador · solo quien dirige lo pone', figma.timer.startedWith === null && notices.at(-1)?.includes('Solo Jorge Molina'))
currentUser = users.jorge; device = devices.A
await button('5 min')()
check('temporizador · pone el de FigJam a 5 minutos', figma.timer.startedWith === 300, notices.at(-1))

// Una ronda anterior ocupa el sitio de al lado del tarro: la retro no debe pisarla.
const previous = makeNode('SECTION', { name: 'Ronda anterior', x: 100 + 380 + 120, y: 100, width: 840, height: 360 })
await button('Abrir el tarro')()
const retroSections = [...nodes.values()].filter((n) => n.type === 'SECTION' && n.name.endsWith('· Retrospectiva'))
const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
check('retro · no pisa la ronda anterior', retroSections.length === 3 && retroSections.every((s) => !overlaps(s, previous)), retroSections.map((s) => `y=${s.y}`).join(' '))
check('retro · se coloca justo debajo de la ronda anterior', retroSections.every((s) => s.y === previous.y + previous.height + 80))
const byName = (name) => retroSections.find((s) => s.name === name)
const colorOf = (s) => { const c = s.fills?.[0]?.color; return c ? '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase() : '' }
const bien = byName('Qué fue bien · Retrospectiva'), mejorar = byName('Qué mejorar · Retrospectiva'), probar = byName('Qué probar · Retrospectiva')
check('retro · una sección por columna', retroSections.length === 3 && !!bien && !!mejorar && !!probar, retroSections.map((s) => s.name).join(' | '))
check('retro · cada idea en su columna', bien?.children.length === 3 && mejorar?.children.length === 2 && probar?.children.length === 0)
check('retro · colores de FigJam por columna', bien?.children.every((s) => colorOf(s) === '#AFF4C6') && mejorar?.children.every((s) => colorOf(s) === '#FFC7C2'))
check('retro · todas sin firma', [...bien.children, ...mejorar.children].every((s) => s.authorVisible === false))
const tagCounts = () => { const out = {}; walk(tree(), (n) => { const ch = n.props?.children || []; if (n.type === 'AutoLayout' && ch.length === 3 && ch[0].type === 'AutoLayout' && ch[1].type === 'Text' && ch[2].type === 'Text') out[ch[1].props.children.join('')] = ch[2].props.children.join('') }); return out }
check('retro · cada columna con su color y su número, en una fila', JSON.stringify(tagCounts()) === JSON.stringify({ 'Qué fue bien': '3', 'Qué mejorar': '2', 'Qué probar': '0' }), JSON.stringify(tagCounts()))
check('retro · sin la frase de «al lado» ni filas repetidas', !shows('de al lado') && texts().filter((t) => t === 'Qué fue bien').length === 1)
check('retro · secciones una al lado de otra', bien.x < mejorar.x && mejorar.x < probar.x)
await button('Ver las ideas')()
check('retro · «Ver las ideas» enseña las 3 secciones', figma.viewport.last?.length === 3)

// ---------- volver atrás con alguien escribiendo ----------
// Luis sella una idea y, durante el retraso, Jorge vuelve a la preparación: la idea es de esta
// ronda (no llega «tarde») y Luis aún puede editarla.
await menu('reset')
for (const n of [...nodes.values()]) if (n.type === 'SECTION') n.remove()
currentUser = users.jorge; device = devices.A
await button('¿Qué te preocupa?')()
await button('Empezar')()
currentUser = users.luis; device = devices.C
const backKey = 'cccc3333cccc'
const back = await panel([
  { msg: { type: 'seal', key: backKey, text: 'Escrita mientras se vuelve atrás' } },
  { do: async () => { currentUser = users.jorge; device = devices.A; await button('← Volver')(); currentUser = users.luis; device = devices.C }, wait: 'saved' },
  { msg: { type: 'edit', key: backKey, text: 'Editada en la preparación' }, wait: 'edited' },
])
const savedBack = back.posted.find((m) => m.type === 'saved')
check('volver · la idea que se estaba escribiendo no llega tarde', state.get('phase') === 'setup' && savedBack?.late === false && maps.slips.has(backKey))
check('volver · en la preparación se puede editar', maps.slips.get(backKey)?.t === 'Editada en la preparación' && !back.posted.some((m) => m.type === 'refused'))
currentUser = users.jorge; device = devices.A
await button('Empezar')()
check('volver · después ya no se ofrece (Luis ha escrito)', state.get('phase') === 'open' && !shows('← Volver'))

// ---------- editar y retirar ----------
await menu('reset')
for (const n of [...nodes.values()]) if (n.type === 'SECTION') n.remove()
currentUser = users.jorge; device = devices.A
await button('Una pregunta')()
await button('¿Qué te preocupa?')()
await button('Empezar')()

// Abre la ventanita, envía mensajes (o hace cosas en el tablero) y la cierra.
async function panel(steps) {
  ui.posted.length = 0
  const running = button(writeLabel())()
  await sleep(10)
  const opened = ui.posted.find((m) => m.type === 'init')
  for (const step of steps) {
    const before = ui.posted.length
    if (step.do) await step.do()
    if (step.msg) ui.onmessage(step.msg)
    if (step.wait) for (let i = 0; i < 200 && !ui.posted.slice(before).some((m) => m.type === step.wait); i++) await sleep(5)
  }
  const posted = [...ui.posted]
  ui.onmessage({ type: 'close' })
  await running
  return { init: opened, posted }
}

const k1 = 'aaaa1111aaaa', k2 = 'bbbb2222bbbb'
await panel([
  { msg: { type: 'seal', key: k1, text: 'Primera versión de mi idea' }, wait: 'saved' },
  { msg: { type: 'seal', key: k2, text: 'Idea que voy a retirar' }, wait: 'saved' },
])
let p = await panel([])
const initEs = p.init
check('editar · al volver ves tus ideas', p.init?.mine?.length === 2 && p.init.mine.some((m) => m.key === k1 && m.t === 'Primera versión de mi idea'))
check('ventanita · recibe sus textos en español', initEs?.lang === 'es' && initEs.text?.seal === 'Echar al tarro' && initEs.question === '¿Qué te preocupa?')
p = await panel([{ msg: { type: 'edit', key: k1, text: 'Versión corregida' }, wait: 'edited' }])
check('editar · cambia el texto sin cambiar el número de ideas', maps.slips.get(k1)?.t === 'Versión corregida' && maps.slips.size === 2)
check('editar · sin esperas', !p.posted.some((m) => m.type === 'sealing'))
p = await panel([{ msg: { type: 'retract', key: k2 }, wait: 'retracted' }])
check('retirar · la idea sale del tarro', !maps.slips.has(k2) && maps.slips.size === 1)
p = await panel([])
check('retirar · ya no aparece en tu lista', p.init?.mine?.length === 1 && p.init.mine[0].key === k1)

currentUser = users.ana; device = devices.B
p = await panel([{ msg: { type: 'edit', key: k1, text: 'Cambiado por Ana' } }, { msg: { type: 'retract', key: k1 } }, { do: () => sleep(80) }])
check('otra persona no ve tus ideas', p.init?.mine?.length === 0)
check('otra persona no puede editarlas ni retirarlas', maps.slips.get(k1)?.t === 'Versión corregida')

currentUser = users.jorge; device = devices.A
p = await panel([
  { do: async () => { await button('Abrir el tarro')(); await button('Abrir igualmente')() } },
  { msg: { type: 'edit', key: k1, text: 'Demasiado tarde' }, wait: 'refused' },
])
const opened = [...nodes.values()].find((n) => n.type === 'SECTION' && n.name === '¿Qué te preocupa?')
const texts2 = opened ? opened.children.map((s) => s.text.characters) : []
check('con el tarro ya abierto no se puede editar', p.posted.some((m) => m.type === 'refused') && texts2.includes('Versión corregida') && !texts2.includes('Demasiado tarde'))
check('la idea retirada no sale al abrir', !texts2.includes('Idea que voy a retirar'), texts2.join(' | '))

// ---------- idiomas ----------
await menu('reset')
for (const n of [...nodes.values()]) if (n.type === 'SECTION') n.remove()
currentUser = users.jorge; device = devices.A
await menu('lang', 'en')
check('idioma · el menú cambia todo el tarro', state.get('lang') === 'en' && shows('One question') && shows('What worries you?') && shows('QUESTION FOR THE TEAM') && !shows('Una pregunta'))
check('idioma · se recuerda en tu ordenador', devices.A.get('hushjar:idioma') === JSON.stringify('en'))

// Un tarro nuevo, puesto por alguien que nunca ha elegido idioma: empieza en inglés.
state.clear()
for (const m of Object.values(maps)) m.m.clear()
currentUser = users.luis; device = devices.C
await settle()
check('idioma · sin haber elegido nunca, empieza en inglés', state.get('lang') === 'en' && shows('Everyone answers privately. You decide when to open the jar, and the ideas come out anonymous.'))

// Todo lo que se ve en inglés se guarda para comprobar al final que no se ha colado nada en español.
const seenEn = []
const spanish = /[áéíóúñ¿¡«»]|\b(el|la|los|las|del|que|para|tarro|ronda|dirige|escribir|abrir|pregunta|empezar|idioma|ideas? nuevas?)\b/i
const lookEn = () => {
  seenEn.push(...texts())
  walk(tree(), (n) => { if (n.type === 'Input') seenEn.push(n.props.placeholder); if (n.props?.tooltip) seenEn.push(n.props.tooltip) })
  for (const item of menuItems) if (item.tooltip) seenEn.push(item.tooltip)
}
lookEn()

await button('Start · Stop · Continue')()
check('inglés · pestañas y columnas', shows('Start doing') && shows('Stop doing') && shows('Continue doing') && shows('TITLE (OPTIONAL)') && input()?.props.placeholder === 'For example: Quarterly review')
lookEn()
await button('Start')()
check('inglés · sin título se llama como el formato', state.get('phase') === 'open' && !state.get('question') && shows('Start · Stop · Continue') && shows('Led by Luis'))
check('inglés · volver', shows('← Back'))
lookEn()
await menu('lang', 'es')
check('idioma · a mitad de sesión se traduce todo, también el título', shows('Empezar · Dejar · Seguir') && shows('Escribir una idea') && shows('Ronda 1') && shows('Dirige: Luis'))
await menu('lang', 'en')

const enInit = await writeIn('More pairing on tricky bugs', 'empezar')
check('inglés · la ventanita recibe sus textos y columnas', enInit?.lang === 'en' && enInit.text?.seal === 'Drop in the jar' && enInit.question === 'Start · Stop · Continue' && enInit.columns.map((c) => c.label).join('/') === 'Start doing/Stop doing/Continue doing')
seenEn.push(...Object.values(enInit.text), ...enInit.columns.map((c) => c.label), enInit.question)
currentUser = users.ana; device = devices.B
await writeIn('Fewer status meetings', 'dejar')
currentUser = users.jorge; device = devices.A
await writeIn('Keep the Friday demos', 'seguir')
check('inglés · recuento de ideas y personas', shows('3 ideas') && shows('3 people'))
lookEn()

currentUser = users.ana; device = devices.B
await button('Open the jar')()
check('inglés · los avisos también', notices.at(-1) === 'Only the facilitator, Luis, can do this.', notices.at(-1))
seenEn.push(notices.at(-1))

// Luis tiene la ventanita abierta cuando abre el tarro e intenta editar su idea: ya es tarde.
currentUser = users.luis; device = devices.C
const enLate = await panel([
  { do: async () => { await button('Open the jar')() } },
  { msg: { type: 'edit', key: JSON.parse(devices.C.get('hushjar:1:23:mias'))[0], text: 'Too late' }, wait: 'refused' },
])
const refusedEn = enLate.posted.find((m) => m.type === 'refused')
check('inglés · la ventanita avisa si llegas tarde', refusedEn?.text === 'That idea isn’t in the jar anymore: the jar was opened and it’s on the board.', refusedEn?.text)
seenEn.push(refusedEn?.text || '')
const enSections = [...nodes.values()].filter((n) => n.type === 'SECTION').map((s) => s.name)
check('inglés · secciones con nombres en inglés', enSections.join(' | ') === 'Start doing · Start · Stop · Continue | Stop doing · Start · Stop · Continue | Continue doing · Start · Stop · Continue', enSections.join(' | '))
check('inglés · tarro abierto', shows('Jar opened: 3 ideas') && shows('Show the ideas') && shows('New round') && JSON.stringify(tagCounts()) === JSON.stringify({ 'Start doing': '1', 'Stop doing': '1', 'Continue doing': '1' }), JSON.stringify(tagCounts()))
lookEn()

// Segunda ronda con una sola persona: aviso de pocas personas y temporizador, en inglés.
await button('New round')()
check('inglés · nueva ronda', shows('TITLE (OPTIONAL)') && shows('Start round 2'))
await button('One question')()
check('inglés · sugerencias', shows('QUESTION FOR ROUND 2') && shows('What worries you?') && shows('Or pick one:'))
lookEn()
await button('What worries you?')()
await button('Start round 2')()
await writeIn('Deadlines', 'idea')
await button('Open the jar')()
check('inglés · aviso con pocas personas', state.get('phase') === 'confirm' && shows('Only 1 person has written') && shows('With fewer than 3 people, it’s easy to guess who wrote each idea.') && shows('Open anyway'))
lookEn()
await button('Wait')()
await button('3 min')()
check('inglés · temporizador', notices.at(-1) === 'Timer running: 3 minutes to write.', notices.at(-1))
seenEn.push(notices.at(-1))
const leaks = [...new Set(seenEn)].filter((s) => spanish.test(s))
check('inglés · no se cuela nada en español', seenEn.length > 50 && leaks.length === 0, leaks.length ? leaks.join(' | ') : `${new Set(seenEn).size} textos revisados`)

// ---------- mejoras v0.5: contador, columnas con nombre propio y votación ----------
await menu('lang', 'es')
await menu('reset')
for (const n of [...nodes.values()]) if (n.type === 'SECTION') n.remove()
currentUser = users.jorge; device = devices.A
figma.activeUsers = [users.jorge, users.ana, users.luis, { id: '444', name: 'Eva' }]
await button('Retrospectiva')()
const colInputs = () => { const out = []; walk(tree(), (n) => { if (n.type === 'Input' && n.props.placeholder && !n.props.placeholder.startsWith('Por ejemplo')) out.push(n) }); return out }
check('columnas · se pueden renombrar en la preparación', colInputs().length === 3 && colInputs()[0].props.value === 'Qué fue bien')
colInputs()[0].props.onTextEditEnd({ characters: '  Nos ha encantado  ' })
check('columnas · el nombre nuevo se guarda', state.get('labels')?.['retro:bien'] === 'Nos ha encantado' && colInputs()[0].props.value === 'Nos ha encantado')
await button('Empezar')()
await button('← Volver')()
currentUser = users.ana; device = devices.B
colInputs()[1].props.onTextEditEnd({ characters: 'De Ana' })
check('columnas · solo quien dirige las renombra', !state.get('labels')?.['retro:mejorar'])
currentUser = users.jorge; device = devices.A
colInputs()[2].props.onTextEditEnd({ characters: 'Qué probar' })
check('columnas · el nombre de siempre no se guarda', !('retro:probar' in (state.get('labels') || {})))
await button('Empezar')()
check('contador · 0 de 4 al empezar', shows('0 de 4 personas han escrito'), texts().find((x) => x.includes(' de ')))
const initCols = await writeIn('Las demos', 'bien')
check('columnas · la ventanita recibe el nombre nuevo', initCols?.columns?.[0]?.label === 'Nos ha encantado')
await writeIn('Buen ambiente', 'bien')
currentUser = users.ana; device = devices.B
await writeIn('Demasiadas reuniones', 'mejorar')
currentUser = users.luis; device = devices.C
await writeIn('Más pairing', 'probar')
check('contador · 3 de 4 han escrito', shows('3 de 4 personas han escrito') && shows('4 ideas'))
currentUser = users.jorge; device = devices.A
await button('Abrir el tarro')()
const vSections = [...nodes.values()].filter((n) => n.type === 'SECTION')
check('columnas · la sección usa el nombre nuevo', vSections.some((s) => s.name === 'Nos ha encantado · Retrospectiva'))

currentUser = users.ana; device = devices.B
await button('Votar las ideas')()
check('votar · solo quien dirige abre la votación', !state.get('vote') && notices.at(-1)?.includes('Solo Jorge Molina'))
currentUser = users.jorge; device = devices.A
await button('Votar las ideas')()
check('votar · votación abierta', state.get('vote')?.open === true && shows('Todavía no ha votado nadie') && shows('Votar (3 votos por persona)'))

async function votePanel(pick) {
  ui.posted.length = 0
  const running = button('Votar (3 votos por persona)')()
  await sleep(10)
  const init = ui.posted.find((m) => m.type === 'init')
  const ids = pick(init.notes)
  ui.onmessage({ type: 'vote', ids })
  for (let i = 0; i < 100 && !ui.posted.some((m) => m.type === 'voted' || m.type === 'refused'); i++) await sleep(5)
  const answer = ui.posted.find((m) => m.type === 'voted' || m.type === 'refused')
  ui.onmessage({ type: 'close' })
  await running
  return { init, answer }
}
const idOf = (notes, txt) => notes.find((n) => n.t === txt).id
let vp = await votePanel((ns) => [idOf(ns, 'Demasiadas reuniones'), idOf(ns, 'Las demos')])
const voteInit = vp.init
check('votar · la ventanita lista las 4 notas con 3 votos', vp.init?.mode === 'vote' && vp.init.notes.length === 4 && vp.init.max === 3 && vp.init.text?.saveVotes === 'Guardar mis votos')
currentUser = users.ana; device = devices.B
vp = await votePanel((ns) => [idOf(ns, 'Demasiadas reuniones'), idOf(ns, 'Demasiadas reuniones'), idOf(ns, 'Más pairing'), idOf(ns, 'Las demos'), idOf(ns, 'Buen ambiente')])
check('votar · sin repetir y máximo 3', vp.answer?.ids?.length === 3)
currentUser = users.luis; device = devices.C
await votePanel((ns) => [idOf(ns, 'Las demos')])
vp = await votePanel((ns) => [idOf(ns, 'Demasiadas reuniones')])
check('votar · al volver ves tus votos y puedes cambiarlos', vp.init.chosen.length === 1 && maps.votes.size === 3)
check('votar · cuenta quién ha votado, no quién es', shows('Han votado 3 personas') && !/Jorge|Ana|Luis|"111"|"222"|"333"/.test(JSON.stringify(maps.votes.entries())))
currentUser = users.jorge; device = devices.A
await button('Cerrar la votación')()
const res = state.get('vote')?.results || []
check('votar · resultados ordenados', res[0]?.t === 'Demasiadas reuniones' && res[0]?.n === 3 && res[1]?.t === 'Las demos' && res[1]?.n === 2, JSON.stringify(res.map((r) => r.t + ':' + r.n)))
check('votar · se ven las más votadas y se borran los votos', shows('LAS MÁS VOTADAS') && shows('3 votos') && maps.votes.size === 0)
const bienSec = vSections.find((s) => s.name.startsWith('Nos ha encantado'))
const first = bienSec.children.find((c) => c.x === 40 && c.y === 70)
check('votar · en cada sección la más votada va primero', first?.text.characters === 'Las demos')
currentUser = users.luis; device = devices.C
vp = { answer: null }
check('votar · cerrada ya no se ofrece votar', !shows('Votar (3 votos por persona)'))
currentUser = users.jorge; device = devices.A
await button('Nueva ronda')()
check('nueva ronda · la votación se borra', !state.get('vote'))

// Vista previa del dibujo del tarro
const html = `<!doctype html><meta charset="utf-8"><title>Tarro de Hush Jar</title>
<style>body{font:14px system-ui;background:#f4f2ec;display:flex;gap:24px;flex-wrap:wrap;padding:24px}figure{margin:0;background:#fff;border-radius:16px;padding:16px;text-align:center}figcaption{margin-top:8px;color:#555}</style>
${previews.map((p) => `<figure>${p.svg}<figcaption>${p.label}</figcaption></figure>`).join('\n')}`
writeFileSync(new URL('./preview-tarro.html', import.meta.url), html)

// Vista previa de la ventanita privada (el ui.html de verdad) con los mensajes que le manda el widget.
const uiHtml = readFileSync(new URL('../ui.html', import.meta.url), 'utf8')
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const windows = [
  { label: 'Español · una pregunta', messages: [initEs, { type: 'saved', key: 'vista1', t: 'Probar a hacer la daily de pie', c: 'idea', late: false }] },
  { label: 'English · Start · Stop · Continue', messages: [enLate.init, { type: 'saved', key: 'vista2', t: 'Pair on the release checklist', c: 'seguir', late: false }] },
  { label: 'Español · votar', messages: [{ ...voteInit, chosen: voteInit.notes.slice(0, 2).map((n) => n.id) }, { type: 'voted', ids: voteInit.notes.slice(0, 2).map((n) => n.id) }] },
]
const panelsHtml = `<!doctype html><meta charset="utf-8"><title>Ventanita de Hush Jar</title>
<style>body{font:14px system-ui;background:#f4f2ec;display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;padding:24px}figure{margin:0}iframe{display:block;width:380px;height:340px;border:0;border-radius:12px;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.08)}figcaption{margin-top:8px;color:#555;text-align:center}</style>
${windows.map((w, i) => `<figure><iframe id="v${i}" srcdoc="${attr(uiHtml)}"></iframe><figcaption>${w.label}</figcaption></figure>`).join('\n')}
<script>
const windows = ${JSON.stringify(windows.map((w) => w.messages))};
windows.forEach((messages, i) => {
  const frame = document.getElementById('v' + i);
  frame.addEventListener('load', () => { for (const m of messages) frame.contentWindow.postMessage({ pluginMessage: m }, '*'); });
});
// Como figma.ui.resize: cada ventanita pide el alto que necesita.
addEventListener('message', (e) => {
  const m = e.data && e.data.pluginMessage;
  if (!m || m.type !== 'resize') return;
  for (const f of document.querySelectorAll('iframe')) if (f.contentWindow === e.source) f.style.height = Math.max(300, Math.min(640, m.height)) + 'px';
});
</script>`
writeFileSync(new URL('./preview-ventana.html', import.meta.url), panelsHtml)

if (failures.length) {
  console.log('\nFALLOS:', failures.join(', '))
  process.exit(1)
}
console.log('\nLa sesión completa funciona, en español y en inglés: escribir en privado, contar personas sin saber quiénes son, abrir sin nombres y no perder ideas.')
process.exit(0)
