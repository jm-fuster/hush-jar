// Prueba de humo: ejecuta dist/code.js con una API de widgets simulada y renderiza una vez.
// No sustituye a probar en FigJam; solo detecta errores de render (undefined, props mal pasadas...).
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('../dist/code.js', import.meta.url), 'utf8')

class FakeSyncedMap {
  constructor() { this.m = new Map() }
  get size() { return this.m.size }
  get length() { return this.m.size }
  has(k) { return this.m.has(k) }
  get(k) { return this.m.get(k) }
  set(k, v) { this.m.set(k, v) }
  delete(k) { this.m.delete(k) }
  keys() { return [...this.m.keys()] }
  values() { return [...this.m.values()] }
  entries() { return [...this.m.entries()] }
}

const maps = {}
let registered = null
let propertyMenu = null
const intrinsic = (type) => (props) => ({ type, props })
const h = (type, props, ...children) => {
  const allProps = { ...(props || {}), children: children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false) }
  return typeof type === 'function' ? type(allProps) : { type, props: allProps }
}

const widgetApi = {
  register: (fn) => { registered = fn },
  h,
  Fragment: intrinsic('Fragment'),
  AutoLayout: 'AutoLayout',
  Text: 'Text',
  useSyncedMap: (name) => (maps[name] ||= new FakeSyncedMap()),
  useSyncedState: (name, def) => [typeof def === 'function' ? def() : def, () => {}],
  usePropertyMenu: (items) => { propertyMenu = items },
  useWidgetNodeId: () => '1:23',
  useEffect: () => {},
  waitForTask: () => {},
}

const sandbox = { figma: { widget: widgetApi }, console, setTimeout, clearTimeout, setInterval, clearInterval }
vm.createContext(sandbox)
vm.runInContext(code, sandbox)

if (!registered) throw new Error('widget.register no se llamó')

// Render vacío y render con resultados de todos los estados.
let tree = registered()
const count = (node) => (node && typeof node === 'object' ? 1 + (node.props?.children || []).reduce((s, c) => s + count(c), 0) : 0)
console.log('render vacío OK · nodos:', count(tree), '· menú:', propertyMenu.length, 'items')

const results = maps.results
for (const [i, status] of ['pass', 'fail', 'warn', 'info', 'todo'].entries()) {
  results.set(`S${i + 1}.prueba`, { status, summary: `resumen ${status}`, at: new Date().toISOString(), by: 'Test#1' })
}
results.set('E3.tarro', { status: 'info', summary: 'x', at: 'corto', by: 'Test#1' })
maps.jar.set('k', { c: 0, t: 'hola' })
tree = registered()
console.log('render con resultados OK · nodos:', count(tree))

// Comprueba que cada botón tiene un onClick función.
const buttons = []
const walk = (node) => {
  if (!node || typeof node !== 'object') return
  if (node.type === 'AutoLayout' && typeof node.props.onClick === 'function') buttons.push(node)
  for (const c of node.props?.children || []) walk(c)
}
walk(tree)
console.log('botones con onClick:', buttons.length)
