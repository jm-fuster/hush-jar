// Dibujo del tarro (SVG). Lo usan el widget y los scripts que generan el icono y la portada.

const SLIP_COLORS = ['#FFD966', '#F6A9BD', '#9FDCCB', '#BDB6F4', '#FFC58F']
const JAR_WIDTH = 180
const JAR_HEIGHT = 212
const JAR_MAX_SLIPS = 60

// Oscurece (amount < 0) o aclara (amount > 0) un color #RRGGBB.
function shade(hex: string, amount: number): string {
  const channel = (i: number) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + amount))))
  return '#' + [1, 3, 5].map((i) => channel(i).toString(16).padStart(2, '0')).join('')
}

// Tapa de madera vista como un cilindro: canto con degradado horizontal y cara superior en elipse.
function lidSvg(): string {
  let ribs = ''
  for (let k = 0; k < 11; k++) ribs += `<rect x="${-40 + k * 8}" y="-4" width="1.2" height="13" fill="#7A5C2E" fill-opacity="0.22"/>`
  return `<ellipse cx="0" cy="10" rx="46" ry="7" fill="#8C6E3C"/>
<rect x="-46" y="-6" width="92" height="16" fill="url(#lidSide)"/>
${ribs}
<ellipse cx="0" cy="-6" rx="46" ry="7" fill="url(#lidTop)" stroke="#9C7A45" stroke-width="1"/>
<ellipse cx="-10" cy="-8" rx="22" ry="2.5" fill="#FFFFFF" fill-opacity="0.35"/>`
}

// Dibujo del tarro con volumen: sombra en el suelo, cristal con reflejos, papelitos con canto y
// tapa cilíndrica. Los papelitos se apilan desde el fondo con posiciones fijas por índice, así que
// con el mismo número de ideas el dibujo es siempre el mismo.
export function jarSvg(count: number, lidOpen: boolean): string {
  let slips = ''
  for (let i = 0; i < Math.min(count, JAR_MAX_SLIPS); i++) {
    const row = i < 5 ? 0 : 1 + Math.floor((i - 5) / 6)
    const col = i < 5 ? i : (i - 5) % 6
    const x = (row === 0 ? 42 + col * 20 : 34 + col * 17.5 + (row % 2 ? 6 : 0)) + ((i * 37) % 7) - 3
    const y = 176 - row * 11 + ((i * 53) % 5) - 2
    const angle = ((i * 71) % 41) - 20
    const color = SLIP_COLORS[i % SLIP_COLORS.length]
    slips += `<g transform="rotate(${angle} ${x + 10} ${y + 6})"><rect x="${x}" y="${y + 2}" width="20" height="12" rx="2" fill="${shade(color, -0.28)}"/><rect x="${x}" y="${y}" width="20" height="12" rx="2" fill="${color}"/><rect x="${x + 2}" y="${y + 2}" width="15" height="2" rx="1" fill="#FFFFFF" fill-opacity="0.45"/></g>`
  }
  const lid = lidOpen
    ? `<g transform="translate(136 34) rotate(28) scale(0.8)">${lidSvg()}</g>`
    : `<g transform="translate(90 20)">${lidSvg()}</g>`
  const opening = lidOpen ? '<ellipse cx="90" cy="30" rx="36" ry="4.5" fill="#B5CFDA"/>' : ''
  return `<svg width="${JAR_WIDTH}" height="${JAR_HEIGHT}" viewBox="0 0 ${JAR_WIDTH} ${JAR_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="glassBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EEF6F9"/><stop offset="1" stop-color="#D3E5ED"/></linearGradient>
<linearGradient id="glassSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="0.35" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.8" stop-color="#6F97A8" stop-opacity="0"/><stop offset="1" stop-color="#6F97A8" stop-opacity="0.28"/></linearGradient>
<linearGradient id="neck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F4FAFC"/><stop offset="0.6" stop-color="#DCEAF0"/><stop offset="1" stop-color="#BCD3DD"/></linearGradient>
<linearGradient id="lidSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8C6E3C"/><stop offset="0.22" stop-color="#C9A66B"/><stop offset="0.45" stop-color="#E2C590"/><stop offset="0.78" stop-color="#C9A66B"/><stop offset="1" stop-color="#8C6E3C"/></linearGradient>
<linearGradient id="lidTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EDD4A2"/><stop offset="1" stop-color="#CFAE72"/></linearGradient>
</defs>
<ellipse cx="90" cy="201" rx="62" ry="8" fill="#000000" fill-opacity="0.08"/>
<ellipse cx="90" cy="200" rx="46" ry="5" fill="#000000" fill-opacity="0.08"/>
<rect x="24" y="44" width="132" height="152" rx="28" fill="url(#glassBack)"/>
${slips}
<rect x="24" y="44" width="132" height="152" rx="28" fill="url(#glassSide)"/>
<rect x="33" y="60" width="9" height="112" rx="4.5" fill="#FFFFFF" fill-opacity="0.6"/>
<rect x="46" y="64" width="3.5" height="46" rx="1.75" fill="#FFFFFF" fill-opacity="0.45"/>
<path d="M40 66 Q43 52 58 48" fill="none" stroke="#FFFFFF" stroke-opacity="0.8" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="90" cy="188" rx="44" ry="4" fill="#FFFFFF" fill-opacity="0.3"/>
<rect x="24" y="44" width="132" height="152" rx="28" fill="none" stroke="#8FB0BE" stroke-width="2"/>
<rect x="52" y="30" width="76" height="18" fill="url(#neck)" stroke="#8FB0BE" stroke-width="1.5"/>
<ellipse cx="90" cy="30" rx="38" ry="6" fill="#E6F1F5" stroke="#8FB0BE" stroke-width="1.5"/>
${opening}
${lid}
</svg>`
}
