// Genera las imágenes que pide Figma para publicar el widget:
//   publicar/icono.png            128 × 128
//   publicar/instantanea-en.png   el widget solo, con fondo transparente (y -es, en español)
//   publicar/portada-en.png       1920 × 1080 (la miniatura de la ficha en la Comunidad)
//   publicar/portada-es.png       1920 × 1080 (la misma, en español, por si la quieres en el carrusel)
// Usa el mismo dibujo del tarro y los mismos textos que el widget, y las fotografía con Edge sin
// ventana. Las páginas HTML intermedias se quedan en publicar/fuentes/ por si quieres retocarlas.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { jarSvg } from '../widget-src/tarro.ts'
import { LANGS, strings } from '../widget-src/textos.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = join(root, 'publicar')
const srcDir = join(outDir, 'fuentes')
mkdirSync(srcDir, { recursive: true })

const EDGE = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => existsSync(p))
if (!EDGE) throw new Error('No encuentro Microsoft Edge para hacer las capturas.')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const FONT = '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=block" rel="stylesheet">'

// ---------- icono ----------
const icon = `<!doctype html><meta charset="utf-8">
<style>
html,body{margin:0;width:128px;height:128px;overflow:hidden}
.bg{width:128px;height:128px;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#FFEDB5 0%,#FFD66B 100%)}
.bg svg{width:92px;height:108px;margin-top:6px}
</style>
<div class="bg">${jarSvg(17, false)}</div>`

// ---------- textos propios de las imágenes ----------
const COPY = {
  en: {
    pill: 'FigJam widget',
    lead: 'Everyone writes in private.<br>Ideas come out anonymous.',
    steps: ['Write in a window only you can see', 'The jar fills up, but nobody can read it', 'Open it: ideas land as anonymous stickies'],
    typed: 'Our Monday meetings run too long, and nobody dares to say it.',
    stickies: ['Fewer status meetings', 'Pair up on tricky bugs', 'Demo something every Friday'],
    leader: 'Alex',
  },
  es: {
    pill: 'Widget para FigJam',
    lead: 'Cada persona escribe en privado.<br>Las ideas salen anónimas.',
    steps: ['Escribe en una ventana que solo ves tú', 'El tarro se llena, pero nadie puede leerlo', 'Ábrelo: salen como notas anónimas'],
    typed: 'Las reuniones de los lunes se alargan demasiado y nadie se atreve a decirlo.',
    stickies: ['Menos reuniones de seguimiento', 'Programar en pareja los bugs difíciles', 'Enseñar algo cada viernes'],
    leader: 'Alex',
  },
}

// ---------- réplica del widget con el tarro abierto a ideas ----------
// Mismas medidas, colores y textos que widget-src/code.tsx.
const CARD_CSS = `
.card{width:440px;padding:20px 24px;background:#fff;border:2px solid #E6E2D8;border-radius:28px;box-shadow:0 6px 20px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;gap:16px}
.head{width:100%;height:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B6B66}
.head .brand{font-weight:700;letter-spacing:.6px}
.group{width:100%;display:flex;flex-direction:column;align-items:center}
.title{font-size:20px;font-weight:700;text-align:center}
.jar svg{display:block;width:170px;height:200px}
.count{font-size:16px;font-weight:600}
.hint{font-size:13px;line-height:19px;color:#6B6B66;text-align:center}
.btn{width:100%;padding:12px 16px;border-radius:12px;text-align:center;font-size:15px;font-weight:600}
.btn.primary{background:#1D1D1F;color:#fff;border:1px solid #1D1D1F}
.btn.secondary{background:#fff;border:1px solid #D8D4CA}
.timer{display:flex;gap:6px;align-items:center;font-size:12px;color:#6B6B66}
.chip{padding:7px 11px;border-radius:999px;background:#F4F2EC;border:1px solid #E0DBCF;font-size:13px;color:#1D1D1F}
.foot{font-size:12px;color:#6B6B66}`

function card(lang, extraClass = '') {
  const t = strings(lang)
  return `<div class="card ${extraClass}">
  <div class="head"><span class="brand">HUSH JAR</span><span>${esc(t.round(1))}</span></div>
  <div class="group" style="gap:14px"><div class="title">${esc(t.suggestions[0])}</div><div class="jar">${jarSvg(14, false)}</div></div>
  <div class="group" style="gap:12px">
    <div class="group" style="gap:4px"><div class="count">${esc(`${t.ideas(14)} · ${t.people(6)}`)}</div><div class="hint">${esc(t.nobodyReads)}</div></div>
    <div class="btn primary">${esc(t.write)}</div>
    <div class="btn secondary">${esc(t.open)}</div>
    <div class="timer"><span>${esc(t.timer)}</span><span class="chip">3 min</span><span class="chip">5 min</span><span class="chip">10 min</span></div>
  </div>
  <div class="foot">${esc(t.ledBy(COPY[lang].leader))}</div>
</div>`
}

// ---------- instantánea: el widget solo, con fondo transparente ----------
const SNAP_PAD = 40 // aire alrededor para que no se corte la sombra

function snapshot(lang) {
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8">${FONT}
<style>*{box-sizing:border-box} html,body{margin:0;background:transparent} body{display:inline-block;padding:${SNAP_PAD}px;font-family:Inter,system-ui,sans-serif;color:#1D1D1F}${CARD_CSS}</style>
<body>${card(lang)}
<script>document.fonts.ready.then(() => { document.title = String(Math.ceil(document.querySelector('.card').getBoundingClientRect().height)) })</script>
</body></html>`
}

// ---------- portada ----------
function cover(lang) {
  const t = strings(lang)
  const c = COPY[lang]
  const question = t.suggestions[0]
  const formats = [t.formats.single, t.formats.retro, t.formats.ssc].map(esc).join(' · ')
  const languages = [...LANGS].sort((a, b) => (a.id === lang ? -1 : b.id === lang ? 1 : 0)).map((l) => l.label).join(' · ')
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8">${FONT}
<style>
*{box-sizing:border-box}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{position:relative;font-family:Inter,system-ui,sans-serif;color:#1D1D1F;background:#F5F1E8}
.dots{position:absolute;inset:0;background-image:radial-gradient(#D9D2C3 1.6px,transparent 1.6px);background-size:28px 28px;opacity:.7}
.copy{position:absolute;left:130px;top:0;bottom:0;width:700px;display:flex;flex-direction:column;justify-content:center}
.pill{align-self:flex-start;padding:10px 20px;border-radius:999px;background:#1D1D1F;color:#fff;font-size:22px;font-weight:600;letter-spacing:.2px}
h1{margin:28px 0 18px;font-size:128px;line-height:1;font-weight:800;letter-spacing:-4px}
.lead{margin:0 0 46px;font-size:41px;line-height:1.28;font-weight:500;color:#3A3834}
.steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:22px}
.steps li{display:flex;align-items:center;gap:20px;font-size:27px;font-weight:500;color:#2A2926}
.steps b{flex:none;width:48px;height:48px;border-radius:50%;background:#FFD966;border:2px solid #1D1D1F;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700}
.meta{margin:52px 0 0;font-size:22px;line-height:1.6;color:#6B6B66}
${CARD_CSS}
.on-cover{position:absolute;left:1160px;top:140px;transform:scale(1.15);transform-origin:top left}
/* réplica de la ventanita privada */
.window{position:absolute;left:790px;top:560px;width:380px;background:#fff;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.20),0 0 0 1px rgba(0,0,0,.07);overflow:hidden;transform:scale(1.1);transform-origin:top left}
.bar{height:40px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 16px;border-bottom:1px solid #E9E9E9;font-size:11px;font-weight:600}
.bar span:last-child{font-size:16px;font-weight:400;color:#6B6B66}
.wbody{padding:18px 18px 16px;font-size:13px;line-height:1.5}
.eyebrow{display:inline-flex;margin:0 0 10px;padding:3px 9px;border-radius:999px;background:#F6F6F2;color:#6B6B66;font-size:11px;font-weight:600}
.wq{margin:0 0 12px;font-size:16px;line-height:1.35;font-weight:700}
.area{height:100px;padding:10px 12px;border:1px solid #1D1D1F;border-radius:10px;background:#F6F6F2;font-size:14px;line-height:1.45}
.area i{display:inline-block;width:1.5px;height:17px;margin-left:1px;background:#1D1D1F;vertical-align:-3px}
.row{display:flex;align-items:center;justify-content:space-between;margin-top:10px}
.wcount{color:#6B6B66;font-size:12px}
.seal{padding:8px 14px;border-radius:8px;background:#1D1D1F;color:#fff;font-weight:600}
.status{margin:10px 0 0;font-size:13px;color:#1D1D1F}
/* notas anónimas que salen del tarro */
.sticky{position:absolute;width:190px;height:190px;padding:20px;background:#FFE8A3;font-size:21px;line-height:1.3;font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,.08),0 12px 28px rgba(0,0,0,.12)}
</style>
<body>
<div class="dots"></div>
<section class="copy">
  <span class="pill">${esc(c.pill)}</span>
  <h1>Hush Jar</h1>
  <p class="lead">${c.lead}</p>
  <ol class="steps">${c.steps.map((s, i) => `<li><b>${i + 1}</b><span>${esc(s)}</span></li>`).join('')}</ol>
  <p class="meta">${formats}<br>${esc(languages)}</p>
</section>
<div class="sticky" style="left:1690px;top:130px;transform:rotate(5deg)">${esc(c.stickies[0])}</div>
<div class="sticky" style="left:1702px;top:395px;transform:rotate(-4deg)">${esc(c.stickies[1])}</div>
<div class="sticky" style="left:1692px;top:660px;transform:rotate(3deg)">${esc(c.stickies[2])}</div>
${card(lang, 'on-cover')}
<div class="window">
  <div class="bar"><span>${esc(t.panelTitle)}</span><span>×</span></div>
  <div class="wbody">
    <p class="eyebrow">${esc(t.panel.eyebrow)}</p>
    <p class="wq">${esc(question)}</p>
    <div class="area">${esc(c.typed)}<i></i></div>
    <div class="row"><span class="wcount">${c.typed.length}/280</span><span class="seal">${esc(t.panel.seal)}</span></div>
    <p class="status">${esc(t.panel.saving + t.panel.delay.replace('{s}', '3'))}</p>
  </div>
</div>
</body></html>`
}

// ---------- capturas ----------
const profile = join(tmpdir(), 'hushjar-edge-capturas')
const BASE_ARGS = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--virtual-time-budget=15000']

function edge(args) {
  return spawnSync(EDGE, [...BASE_ARGS, ...args], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 })
}

// Carga la página y devuelve el alto que escribe en el título (para ajustar la captura al widget).
function measure(name, html) {
  const page = join(srcDir, `${name}.html`)
  writeFileSync(page, html)
  const run = edge(['--dump-dom', pathToFileURL(page).href])
  const found = /<title>(\d+)<\/title>/.exec(run.stdout || '')
  if (!found) throw new Error(`No he podido medir ${name}\n${run.stderr}`)
  return Number(found[1])
}

function shoot(name, html, width, height, { scale = 1, transparent = false } = {}) {
  const page = join(srcDir, `${name}.html`)
  const png = join(outDir, `${name}.png`)
  writeFileSync(page, html)
  const run = edge([
    `--force-device-scale-factor=${scale}`, `--window-size=${width},${height}`,
    ...(transparent ? ['--default-background-color=00000000'] : []),
    `--screenshot=${png}`, pathToFileURL(page).href,
  ])
  if (!existsSync(png)) throw new Error(`Edge no ha generado ${name}.png\n${run.stderr || run.stdout}`)
  const head = readFileSync(png)
  const w = head.readUInt32BE(16), h = head.readUInt32BE(20)
  const ok = w === width * scale && h === height * scale
  console.log(`${ok ? 'OK ' : 'MAL'} ${name}.png  ${w} × ${h}`)
  if (!ok) process.exitCode = 1
}

shoot('icono', icon, 128, 128)
for (const lang of ['en', 'es']) {
  const html = snapshot(lang)
  const height = measure(`instantanea-${lang}`, html)
  shoot(`instantanea-${lang}`, html, 440 + SNAP_PAD * 2, height + SNAP_PAD * 2, { scale: 2, transparent: true })
  shoot(`portada-${lang}`, cover(lang), 1920, 1080)
}
