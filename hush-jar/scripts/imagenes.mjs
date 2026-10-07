// Genera las imágenes que pide Figma para publicar el widget:
//   publicar/icono.png            128 × 128
//   publicar/instantanea-en.png   el widget solo, con fondo transparente (y -es, en español)
//   publicar/portada-en.png       1920 × 1080 (la miniatura de la ficha en la Comunidad)
//   publicar/portada-es.png       1920 × 1080 (la misma, en español, por si la quieres en el carrusel)
//   publicar/pasos-en.png         1920 × 1080 (cómo funciona, en tres pasos: README y carrusel; y -es)
//   publicar/votar-en.png         1920 × 1080 (la votación anónima, para el carrusel; y -es)
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

// Chrome primero: Edge, cuando está a medio actualizar, a veces termina sin devolver nada.
const EDGE = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find((p) => existsSync(p))
if (!EDGE) throw new Error('No encuentro Chrome ni Edge para hacer las capturas.')

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
    steps: ['Write in a window only you can see', 'The jar fills up, but nobody can read it', 'Open it and vote, all without names'],
    typed: 'Our Monday meetings run too long, and nobody dares to say it.',
    stickies: ['Fewer status meetings', 'Pair up on tricky bugs', 'Demo something every Friday'],
    leader: 'Alex',
    howPill: 'How it works',
    howTitle: 'Three steps, zero names.',
    how: [
      ['Write in private', 'Everyone opens their own window. You can edit or remove your ideas until the jar is opened.'],
      ['The jar fills up', 'The board only shows how many ideas there are and how many people have written. Nobody can read a thing.'],
      ['Open the jar', 'Ideas land shuffled, as regular FigJam stickies with no names. Then everyone votes anonymously on what to discuss first.'],
    ],
    votePill: 'New: voting',
    voteTitle: 'Then vote, without names.',
    voteLead: 'Everyone gets 3 secret votes. The top ideas go first.',
    retroTitle: 'Sprint 12 retro',
    voteNotes: [['mejorar', 'Monday meetings run long', true], ['probar', 'Pair up on tricky bugs', true], ['bien', 'Demo day went great', false], ['mejorar', 'Unclear priorities', true], ['probar', 'Async daily updates', false], ['bien', 'Faster code reviews', false]],
    top: [[5, 'Monday meetings run long'], [4, 'Unclear priorities'], [3, 'Pair up on tricky bugs']],
    retro: { bien: ['Demo day went great', 'Faster code reviews'], mejorar: ['Monday meetings run long', 'Unclear priorities'], probar: ['Pair up on tricky bugs', 'Async daily updates'] },
  },
  es: {
    pill: 'Widget para FigJam',
    lead: 'Cada persona escribe en privado.<br>Las ideas salen anónimas.',
    steps: ['Escribe en una ventana que solo ves tú', 'El tarro se llena, pero nadie puede leerlo', 'Ábrelo y votad, todo sin nombres'],
    typed: 'Las reuniones de los lunes se alargan demasiado y nadie se atreve a decirlo.',
    stickies: ['Menos reuniones de seguimiento', 'Programar en pareja los bugs difíciles', 'Enseñar algo cada viernes'],
    leader: 'Alex',
    howPill: 'Cómo funciona',
    howTitle: 'Tres pasos, ningún nombre.',
    how: [
      ['Escribe en privado', 'Cada persona abre su propia ventana. Puedes editar o retirar tus ideas hasta que se abra el tarro.'],
      ['El tarro se llena', 'En el tablero solo se ve cuántas ideas hay y cuántas personas han escrito. Nadie puede leer nada.'],
      ['Abre el tarro', 'Las ideas salen mezcladas, como notas normales de FigJam y sin nombre. Después cada persona vota, en secreto, qué tratar primero.'],
    ],
    votePill: 'Novedad: votar',
    voteTitle: 'Después, votad sin nombres.',
    voteLead: 'Cada persona tiene 3 votos secretos. Las más votadas van primero.',
    retroTitle: 'Retro del sprint 12',
    voteNotes: [['mejorar', 'Los lunes, reuniones eternas', true], ['probar', 'Bugs difíciles en pareja', true], ['bien', 'La demo salió genial', false], ['mejorar', 'Prioridades poco claras', true], ['probar', 'Dailies por escrito', false], ['bien', 'Revisiones más rápidas', false]],
    top: [[5, 'Los lunes, reuniones eternas'], [4, 'Prioridades poco claras'], [3, 'Bugs difíciles en pareja']],
    retro: { bien: ['La demo salió genial', 'Revisiones más rápidas'], mejorar: ['Los lunes, reuniones eternas', 'Prioridades poco claras'], probar: ['Bugs difíciles en pareja', 'Dailies por escrito'] },
  },
}

// ---------- réplica del widget con el tarro abierto a ideas ----------
// Mismas medidas, colores y textos que widget-src/code.tsx.
// Bocadillo con las ideas y barra de quién ha escrito, como en el widget.
const BITS = `
.jarbox{position:relative;width:100%;height:200px;display:flex;justify-content:center}
.bubble{position:absolute;left:234px;top:4px;padding:7px 12px;border-radius:14px;background:#fff;border:1.5px solid #D8D4CA;font-size:15px;font-weight:700;white-space:nowrap}
.bubble:after{content:'';position:absolute;left:12px;bottom:-6px;width:10px;height:10px;background:#fff;border-right:1.5px solid #D8D4CA;border-bottom:1.5px solid #D8D4CA;transform:rotate(45deg) skew(10deg,10deg)}
.prog{width:200px;height:6px;border-radius:3px;background:#EEEAE0;overflow:hidden}
.prog i{display:block;height:100%;border-radius:3px;background:#1D1D1F}
.wrote{font-size:13px;color:#6B6B66}`

const CARD_CSS = `
.card{width:440px;padding:20px 24px;background:#fff;border:2px solid #E6E2D8;border-radius:28px;box-shadow:0 6px 20px rgba(0,0,0,.08);display:flex;flex-direction:column;align-items:center;gap:16px}
.head{width:100%;height:20px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B6B66}
.head .brand{font-weight:700;letter-spacing:.6px}
.group{width:100%;display:flex;flex-direction:column;align-items:center}
.title{font-size:20px;font-weight:700;text-align:center}
.jar svg{display:block;width:170px;height:200px}
.count{font-size:16px;font-weight:600}
${BITS}
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
  <div class="group" style="gap:14px"><div class="title">${esc(t.suggestions[0])}</div><div class="jarbox"><div class="jar">${jarSvg(14, false)}</div><span class="bubble">${esc(t.ideas(14))}</span></div></div>
  <div class="group" style="gap:12px">
    <div class="group" style="gap:6px"><div class="prog"><i style="width:83%"></i></div><div class="wrote">${esc(t.wroteOf(5, 6))}</div></div>
    <div class="btn primary">${esc(t.write)}</div>
    <div class="btn secondary">${esc(t.open)}</div>
    <div class="timer"><span>${esc(t.timer)}</span><span class="chip">3 min</span><span class="chip">5 min</span><span class="chip">10 min</span></div>
  </div>
  <div class="foot">${esc(t.ledBy(COPY[lang].leader))}</div>
</div>`
}

// ---------- réplica de la ventanita privada (ui.html), con una idea a medio escribir ----------
const WINDOW_CSS = `
.window{width:380px;background:#fff;border-radius:12px;box-shadow:0 18px 50px rgba(0,0,0,.20),0 0 0 1px rgba(0,0,0,.07);overflow:hidden}
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
.status{margin:10px 0 0;font-size:13px;color:#1D1D1F}`

function privateWindow(lang) {
  const t = strings(lang)
  const c = COPY[lang]
  return `<div class="window">
  <div class="bar"><span>${esc(t.panelTitle)}</span><span>×</span></div>
  <div class="wbody">
    <p class="eyebrow">${esc(t.panel.eyebrow)}</p>
    <p class="wq">${esc(t.suggestions[0])}</p>
    <div class="area">${esc(c.typed)}<i></i></div>
    <div class="row"><span class="wcount">${c.typed.length}/280</span><span class="seal">${esc(t.panel.seal)}</span></div>
    
  </div>
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
${WINDOW_CSS}
.window{position:absolute;left:790px;top:560px;transform:scale(1.1);transform-origin:top left}
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
${privateWindow(lang)}
</body></html>`
}

// ---------- cómo funciona: los tres pasos (para el README y el carrusel de la ficha) ----------
function steps(lang) {
  const t = strings(lang)
  const c = COPY[lang]
  const columns = [['bien', '#AFF4C6'], ['mejorar', '#FFC7C2'], ['probar', '#BDE3FF']] // los de widget-src/code.tsx
  const sections = columns.map(([id, hex], i) => `<div class="section" style="--c:${hex}">
    <span class="stag">${esc(t.columns[id])}</span>
    ${c.retro[id].map((s, j) => `<div class="note" style="transform:rotate(${[-2, 1.5, -1, 2, -1.5, 1][i * 2 + j]}deg)">${esc(s)}</div>`).join('')}
  </div>`).join('')
  const visuals = [
    `<div class="w-wrap">${privateWindow(lang)}</div>`,
    `<div class="jar-wrap"><div class="jar-in">${jarSvg(14, false)}<span class="bubble big">${esc(t.ideas(14))}</span></div><div class="prog big"><i style="width:83%"></i></div><div class="hint">${esc(t.wroteOf(5, 6))}</div></div>`,
    `<div class="sections">${sections}</div>`,
  ]
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8">${FONT}
<style>
*{box-sizing:border-box}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{position:relative;font-family:Inter,system-ui,sans-serif;color:#1D1D1F;background:#F5F1E8}
.dots{position:absolute;inset:0;background-image:radial-gradient(#D9D2C3 1.6px,transparent 1.6px);background-size:28px 28px;opacity:.7}
header{position:absolute;left:110px;top:84px;display:flex;flex-direction:column;align-items:flex-start;gap:22px}
.pill{padding:10px 20px;border-radius:999px;background:#1D1D1F;color:#fff;font-size:22px;font-weight:600;letter-spacing:.2px}
h2{margin:0;font-size:72px;line-height:1;font-weight:800;letter-spacing:-2px}
.cards{position:absolute;left:110px;right:110px;top:300px;bottom:84px;display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
.step{display:flex;flex-direction:column;background:#fff;border:2px solid #E6E2D8;border-radius:28px;box-shadow:0 6px 20px rgba(0,0,0,.06);overflow:hidden}
.visual{height:470px;flex:none;display:flex;align-items:center;justify-content:center;background:#FBF9F4;border-bottom:2px solid #EFEBE2}
.caption{padding:30px 34px;display:flex;gap:20px;align-items:flex-start}
.caption b{flex:none;width:48px;height:48px;border-radius:50%;background:#FFD966;border:2px solid #1D1D1F;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700}
.caption h3{margin:4px 0 10px;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-.5px}
.caption p{margin:0;font-size:22px;line-height:1.4;color:#55534E}
${WINDOW_CSS}
${BITS}
.w-wrap{width:380px;transform:scale(1.08);transform-origin:center}
.window{box-shadow:0 12px 34px rgba(0,0,0,.14),0 0 0 1px rgba(0,0,0,.07)}
.jar-wrap{display:flex;flex-direction:column;align-items:center}
.jar-wrap svg{display:block;width:221px;height:260px}
.jar-in{position:relative}
.bubble.big{left:170px;top:0;font-size:22px;padding:9px 16px;border-radius:18px}
.prog.big{width:260px;height:8px;margin-top:22px}
.hint{margin-top:10px;font-size:19px;color:#6B6B66}
.sections{display:flex;gap:14px}
.section{position:relative;width:152px;padding:44px 12px 14px;border-radius:12px;background:color-mix(in srgb,var(--c) 28%,#fff);border:1.5px solid color-mix(in srgb,var(--c) 70%,#8C8676);display:flex;flex-direction:column;gap:12px}
.stag{position:absolute;left:10px;top:10px;padding:3px 9px;border-radius:6px;background:var(--c);font-size:13px;font-weight:600;white-space:nowrap}
.note{height:132px;padding:13px;background:var(--c);font-size:16px;line-height:1.3;font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,.08),0 6px 14px rgba(0,0,0,.10)}
</style>
<body>
<div class="dots"></div>
<header><span class="pill">${esc(c.howPill)}</span><h2>${esc(c.howTitle)}</h2></header>
<section class="cards">${c.how.map(([title, text], i) => `<article class="step">
  <div class="visual">${visuals[i]}</div>
  <div class="caption"><b>${i + 1}</b><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>
</article>`).join('')}</section>
</body></html>`
}

// ---------- votar: la ventanita de votos y el tarro con las más votadas ----------
const HEX = { bien: '#AFF4C6', mejorar: '#FFC7C2', probar: '#BDE3FF' } // los de widget-src/code.tsx

function voting(lang) {
  const t = strings(lang)
  const c = COPY[lang]
  const notes = c.voteNotes.map(([col, text, on]) => `<div class="vnote${on ? ' on' : ''}"><span class="dot" style="background:${HEX[col]}"></span><span class="vt">${esc(text)}</span><span class="check">${on ? '✓' : ''}</span></div>`).join('')
  const counts = { bien: 4, mejorar: 5, probar: 3 }
  const tags = Object.keys(HEX).map((id) => `<span class="tag"><span class="dot" style="background:${HEX[id]}"></span>${esc(t.columns[id])} <b>${counts[id]}</b></span>`).join('')
  const top = c.top.map(([n, text]) => `<div class="top"><b>${esc(t.votesCount(n))}</b><span>${esc(text)}</span></div>`).join('')
  return `<!doctype html><html lang="${lang}"><meta charset="utf-8">${FONT}
<style>
*{box-sizing:border-box}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{position:relative;font-family:Inter,system-ui,sans-serif;color:#1D1D1F;background:#F5F1E8}
.dots{position:absolute;inset:0;background-image:radial-gradient(#D9D2C3 1.6px,transparent 1.6px);background-size:28px 28px;opacity:.7}
header{position:absolute;left:110px;top:84px;width:700px;display:flex;flex-direction:column;align-items:flex-start;gap:24px}
.pill{padding:10px 20px;border-radius:999px;background:#1D1D1F;color:#fff;font-size:22px;font-weight:600}
h2{margin:0;font-size:72px;line-height:1.02;font-weight:800;letter-spacing:-2px}
.lead{margin:0;font-size:30px;line-height:1.35;color:#3A3834}
${CARD_CSS}
${WINDOW_CSS}
.dot{flex:none;width:10px;height:10px;border-radius:50%;border:1px solid rgba(0,0,0,.15)}
.help{margin:-4px 0 10px;color:#6B6B66}
.vnotes{display:flex;flex-direction:column;gap:6px}
.vnote{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1.5px solid #E2E2DC;border-radius:8px;font-size:13px}
.vnote.on{border-color:#1D1D1F;font-weight:600}
.vnote:not(.on){opacity:.45}
.vt{flex:1}
.check{width:18px;height:18px;border-radius:50%;border:1.5px solid #E2E2DC;display:grid;place-items:center;font-size:11px}
.vnote.on .check{background:#1D1D1F;border-color:#1D1D1F;color:#fff}
.vote-win{position:absolute;left:110px;top:450px;transform:scale(1.22);transform-origin:top left}
.on-right{position:absolute;left:1180px;top:80px;transform:scale(1.4);transform-origin:top left}
.tags{display:flex;gap:14px;font-size:13px}
.tag{display:flex;align-items:center;gap:6px}
.label{width:100%;font-size:12px;font-weight:700;color:#6B6B66;letter-spacing:.4px}
.top{width:100%;display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:8px;background:#F4F2EC;font-size:13px}
.top span{flex:1}
.btns{width:100%;display:flex;gap:8px}
.arrow{position:absolute;left:760px;top:640px;font-size:110px;font-weight:300;color:#1D1D1F}
</style>
<body>
<div class="dots"></div>
<header><span class="pill">${esc(c.votePill)}</span><h2>${esc(c.voteTitle)}</h2><p class="lead">${esc(c.voteLead)}</p></header>
<div class="window vote-win">
  <div class="bar"><span>${esc(t.vote(3))}</span><span>×</span></div>
  <div class="wbody">
    <p class="eyebrow">${esc(t.panel.voteEyebrow)}</p>
    <p class="wq">${esc(c.retroTitle)}</p>
    <p class="help">${esc(t.panel.voteHelp)}</p>
    <div class="vnotes">${notes}</div>
    <div class="row"><span class="wcount">${esc(t.panel.votesLeft.replace('{n}', '0').replace('{max}', '3'))}</span><span class="seal">${esc(t.panel.saveVotes)}</span></div>
  </div>
</div>
<div class="arrow">→</div>
<div class="card on-right">
  <div class="head"><span class="brand">HUSH JAR</span><span>${esc(t.round(1))}</span></div>
  <div class="title">${esc(c.retroTitle)}</div>
  <div class="jar" style="height:140px;display:flex;align-items:center"><div style="transform:scale(.7)">${jarSvg(0, true)}</div></div>
  <div class="count">${esc(t.opened(12))}</div>
  <div class="tags">${tags}</div>
  <div class="label">${esc(t.topIdeas)}</div>
  ${top}
  <div class="btns"><div class="btn secondary">${esc(t.showIdeas)}</div><div class="btn primary">${esc(t.newRound)}</div></div>
  <div class="foot">${esc(t.ledBy(c.leader))}</div>
</div>
</body></html>`
}

// ---------- capturas ----------
const BASE_ARGS = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--virtual-time-budget=15000']
// Un perfil nuevo en cada captura: si la anterior aún no ha cerrado y comparten perfil, Edge le
// pasa el trabajo a esa y devuelve vacío.
let shots = 0

function edge(args) {
  return spawnSync(EDGE, [...BASE_ARGS, `--user-data-dir=${join(tmpdir(), `hushjar-edge-${Date.now()}-${shots++}`)}`, ...args], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024 })
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
  shoot(`pasos-${lang}`, steps(lang), 1920, 1080)
  shoot(`votar-${lang}`, voting(lang), 1920, 1080)
}
