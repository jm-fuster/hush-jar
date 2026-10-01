// Prueba de humo del laboratorio guiado: recorre las 6 pruebas pulsando sus botones contra una
// API de Figma simulada y comprueba el veredicto en lenguaje llano que enseña cada paso,
// además de la navegación (no invitar a saltarse pruebas sin hacer).
// Los tiempos se aceleran x100. No valida el comportamiento real de Figma: eso se ve en FigJam.
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('../dist/code.js', import.meta.url), 'utf8')
const SPEED = 100
const realSetTimeout = setTimeout
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms))

// ---------- modelo mínimo de widget ----------
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
let widgetNodeId = '1:23'
let registered = null
let propertyHandler = null

const h = (type, props, ...children) => {
  const all = { ...(props || {}), children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false) }
  return typeof type === 'function' ? type(all) : { type, props: all }
}
const widgetApi = {
  register: (fn) => { registered = fn },
  h,
  Fragment: 'Fragment',
  AutoLayout: 'AutoLayout',
  Text: 'Text',
  useSyncedMap: (name) => (maps[name] ||= new FakeSyncedMap()),
  useSyncedState: (name, def) => {
    const d = typeof def === 'function' ? def() : def
    const cur = state.has(name) ? state.get(name) : d
    return [cur, (v) => { const prev = state.has(name) ? state.get(name) : d; state.set(name, typeof v === 'function' ? v(prev) : v) }]
  },
  usePropertyMenu: (items, onChange) => { propertyHandler = onChange },
  useWidgetNodeId: () => widgetNodeId,
  useEffect: () => {},
  waitForTask: () => {},
}

// ---------- modelo mínimo del documento ----------
let nextId = 100
const nodes = new Map()
function makeNode(type, extra = {}) {
  const node = {
    id: `9:${nextId++}`, type, x: 0, y: 0, width: 240, height: 240, parent: null, children: [], pluginData: {},
    appendChild(child) { if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1); child.parent = this; this.children.push(child) },
    remove() { nodes.delete(this.id); if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); for (const c of [...this.children]) c.remove() },
    resizeWithoutConstraints(w, hh) { this.width = w; this.height = hh },
    setSharedPluginData(ns, k, v) { (this.pluginData[ns] ||= {})[k] = v; if (v === '') delete this.pluginData[ns][k] },
    getSharedPluginDataKeys(ns) { return Object.keys(this.pluginData[ns] || {}) },
    ...extra,
  }
  nodes.set(node.id, node)
  return node
}
const WIDGET_W = 760
function makeWidget(id) {
  const w = makeNode('WIDGET', { width: WIDGET_W, height: 1400, widgetId: 'widget-id-hushjarlab01' })
  nodes.delete(w.id); w.id = id; nodes.set(id, w)
  w.absoluteBoundingBox = { x: 0, y: 0, width: WIDGET_W, height: 1400 }
  return w
}
const original = makeWidget('1:23')
// El estado del original se lee de `state`; el de las copias, de su propio objeto.
Object.defineProperty(original, 'widgetSyncedState', { get: () => Object.fromEntries(state) })
const textSublayer = () => ({ fontName: { family: 'Inter', style: 'Medium' }, characters: '' })

const listeners = {}
let ui = null
const storage = new Map()
const timer = {
  state: 'STOPPED', remaining: 0, total: 0,
  start(s) { this.state = 'RUNNING'; this.remaining = s; this.total = s; emit('timerstart'); realSetTimeout(() => { this.state = 'STOPPED'; this.remaining = 0; emit('timerdone'); emit('timerstop') }, (s * 1000) / SPEED) },
  pause() {}, resume() {}, stop() { this.state = 'STOPPED' },
}
function emit(type) { for (const fn of listeners[type] || []) fn() }
const currentUser = { id: '123', name: 'Jorge', sessionId: 7, photoUrl: null, color: '#f00' }
const page = {
  loadAsync: async () => {},
  findWidgetNodesByWidgetId: (id) => [...nodes.values()].filter((n) => n.type === 'WIDGET' && n.widgetId === id),
}

const figma = {
  widget: widgetApi,
  editorType: 'figjam', widgetId: 'widget-id-hushjarlab01', apiVersion: '1.0.0',
  currentUser, activeUsers: [currentUser], timer, currentPage: page,
  clientStorage: {
    getAsync: async (k) => (storage.has(k) ? JSON.parse(storage.get(k)) : undefined),
    setAsync: async (k, v) => { storage.set(k, JSON.stringify(v)) },
    deleteAsync: async (k) => { storage.delete(k) },
    keysAsync: async () => [...storage.keys()],
  },
  getNodeByIdAsync: async (id) => nodes.get(id) || null,
  createSection: () => makeNode('SECTION'),
  createSticky: () => makeNode('STICKY', { text: textSublayer(), authorVisible: false, authorName: 'Jorge', fills: [] }),
  createShapeWithText: () => makeNode('SHAPE_WITH_TEXT', { text: textSublayer(), shapeType: 'SQUARE', fills: [] }),
  loadFontAsync: async () => {},
  on: (t, fn) => { (listeners[t] ||= []).push(fn) },
  off: (t, fn) => { listeners[t] = (listeners[t] || []).filter((f) => f !== fn) },
  notify: () => {},
  showUI: () => { realSetTimeout(() => ui.onmessage && ui.onmessage({ type: 'ready', probe: { crypto: true, localStorage: 'error: mock' } }), 1) },
  closePlugin: () => {},
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

// ---------- utilidades de prueba ----------
function walk(node, visit) {
  if (!node || typeof node !== 'object') return
  visit(node)
  for (const c of node.props?.children || []) walk(c, visit)
}
function texts(tree) {
  const out = []
  walk(tree, (n) => { if (n.type === 'Text') out.push((n.props.children || []).join('')) })
  return out
}
function buttons(tree) {
  const found = []
  walk(tree, (n) => {
    if (n.type === 'AutoLayout' && typeof n.props.onClick === 'function') {
      found.push({ label: n.props.children?.[0]?.props?.children?.join?.('') ?? '', run: n.props.onClick })
    }
  })
  return found
}
function goTo(stepIndex) { state.set('step', stepIndex) }
async function click(label, during) {
  const button = buttons(registered()).find((b) => b.label === label)
  if (!button) throw new Error(`No hay botón «${label}» en el paso ${state.get('step')}`)
  const running = button.run()
  if (during) await during()
  await running
}
const failures = []
function expectVerdict(name, fragment) {
  const shown = texts(registered()).find((t) => t.includes(fragment))
  console.log(`${shown ? 'OK ' : 'MAL'} ${name.padEnd(34)} ${shown ? shown.slice(0, 120) : `(no aparece «${fragment}»)`}`)
  if (!shown) failures.push(name)
}
const NAV = /Siguiente prueba|Saltar|Ver resumen|Ir a la prueba|Volver al principio/
function expectNav(name, label) {
  const shown = buttons(registered()).map((b) => b.label).find((l) => NAV.test(l))
  const ok = shown === label
  console.log(`${ok ? 'OK ' : 'MAL'} ${name.padEnd(34)} botón de avance: «${shown}»`)
  if (!ok) failures.push(name)
}
function expectStep(name, index) {
  const ok = state.get('step') === index
  console.log(`${ok ? 'OK ' : 'MAL'} ${name.padEnd(34)} paso actual: ${state.get('step')}`)
  if (!ok) failures.push(name)
}
const errors = () => maps.results?.keys().filter((k) => k.endsWith('.error')) || []

// ---------- recorrido ----------
registered()
expectVerdict('portada', 'Seis pruebas cortas')
expectNav('navegación · prueba sin hacer', 'Saltar esta prueba')

// 1 · Escribir en privado
goTo(0)
await click('Escribir una idea', async () => { await sleep(20); ui.onmessage({ type: 'seal', text: 'El plan no llega a tiempo' }) })
expectVerdict('privado · 1ª idea guardada', 'Ahora repite')
expectNav('navegación · prueba a medias', 'Saltar esta prueba')
// 2º intento: sellar y cerrar con la X enseguida (Figma dispara «close» al cerrar la ventana)
const secondAttempt = click('Escribir otra idea', async () => { await sleep(20); ui.onmessage({ type: 'seal', text: 'Nadie modera los debates' }); await sleep(2); emit('close') })
await sleep(120)
await click('Comprobar')
expectVerdict('privado · se guarda al cerrar', 'Las ideas se guardan siempre')
expectNav('navegación · prueba terminada', 'Siguiente prueba →')
void secondAttempt
// Caso sintético: una idea sellada que nunca llega al tarro antes de «Comprobar» → debe decir que se perdió
maps.results.set('privado.sellado.zzzzzz', { status: 'info', summary: 'x', at: '2000-01-01T00:00:00.000Z', by: 't' })
expectVerdict('privado · detecta ideas perdidas', 'Se ha perdido una idea')
maps.results.delete('privado.sellado.zzzzzz')

// Resumen con pruebas pendientes: no debe mandar al chat todavía
goTo(6)
expectVerdict('resumen · faltan pruebas', 'Te faltan 5 pruebas')
expectNav('navegación · resumen incompleto', 'Ir a la prueba que falta →')
await click('Ir a la prueba que falta →')
expectStep('navegación · ir a la que falta', 1)

// 2 · Abrir y deshacer
goTo(1)
await click('Llenar el tarro')
expectVerdict('apertura · lleno', 'Ahora pulsa «Abrir el tarro»')
await click('Abrir el tarro')
expectVerdict('apertura · abierto', 'Ahora pulsa Ctrl+Z')
const opened = nodes.get(state.get('refs').apertura)
for (const c of [...opened.children]) c.remove() // simula un Ctrl+Z que borra las notas…
for (let i = 0; i < 150; i++) maps.mini.set(`k${i}`, { c: 0, t: 'x' }) // …y devuelve las ideas al tarro
await click('Ya he pulsado Ctrl+Z')
expectVerdict('apertura · deshacer coherente', 'no se pierde ninguna')

// 3 · Temporizador
goTo(2)
await click('Probar el temporizador')
expectVerdict('temporizador', 'enterarse de cuándo termina')

// 4 · Carga
goTo(3)
await click('Meter 1.000 ideas')
expectVerdict('carga · metidas', 'pulsa «Vaciar»')
await click('Vaciar')
expectVerdict('carga · vaciado', 'Un tarro normal')

// 5 · Copias
goTo(4)
await click('Marcar como original')
expectVerdict('copias · marcado', 'Ctrl+D')
const copy = makeWidget('1:99')
copy.widgetSyncedState = JSON.parse(JSON.stringify(Object.fromEntries(state)))
copy.setWidgetSyncedState = (st) => { copy.widgetSyncedState = st }
await click('Buscar copias')
expectVerdict('copias · encontrada', 'se lleva las ideas selladas')
await click('Vaciar y borrar copias')
expectVerdict('copias · vaciadas', 'Nadie podrá abrir')
console.log('     copias que quedan en la página:', page.findWidgetNodesByWidgetId('widget-id-hushjarlab01').length - 1)

// 6 · Memoria
goTo(5)
await click('Guardar mi marca')
expectVerdict('memoria · guardada', 'vuelve a abrirlo')
await click('Ya he vuelto')
expectVerdict('memoria · sin recargar', 'Parece que no has recargado')
currentUser.sessionId = 8 // simula recargar el tablero
await click('Ya he vuelto')
expectVerdict('memoria · reconocido', 'Te reconoce al volver')
expectNav('navegación · última prueba hecha', 'Ver resumen →')

// Resumen completo
goTo(6)
expectVerdict('resumen · completo', 'Figma Desktop Bridge')
const verdicts = texts(registered()).filter((t) => /^(Las ideas|Sacó|Sí:|Aguanta|Se detectan|Te reconoce)/.test(t)).length
console.log(`${verdicts === 6 ? 'OK ' : 'MAL'} resumen · veredictos                 ${verdicts} de 6`)
if (verdicts !== 6) failures.push('resumen · veredictos')
await click('Volver al principio')
expectStep('navegación · volver al principio', 0)

// Menú del widget: exportar y empezar de cero
const exporting = propertyHandler({ propertyName: 'export' })
await sleep(20); ui.onmessage({ type: 'close' }); await exporting
const exported = ui.posted.find((m) => m.type === 'export')
console.log(exported && JSON.parse(exported.text).results ? `OK  export                             JSON con ${Object.keys(JSON.parse(exported.text).results).length} resultados` : 'MAL export')
console.log('     sharedPluginData replicado:', original.getSharedPluginDataKeys('hushjar_lab').length, 'claves')
await propertyHandler({ propertyName: 'reset' })
console.log('     tras «Empezar de cero»:', maps.results.size, 'resultados,', original.getSharedPluginDataKeys('hushjar_lab').length, 'claves,', [...nodes.values()].filter((n) => n.type === 'SECTION').length, 'secciones')

if (errors().length || failures.length) {
  console.log('\nFALLOS:', [...failures, ...errors()].join(', '))
  for (const k of errors()) console.log('  ', k, maps.results.get(k).summary)
  process.exit(1)
}
console.log('\nLas 6 pruebas se recorren sin errores, cada paso enseña su veredicto y la navegación no invita a saltarse pruebas.')
process.exit(0)
