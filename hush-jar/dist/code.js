"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // widget-src/tarro.ts
  var SLIP_COLORS = ["#FFD966", "#F6A9BD", "#9FDCCB", "#BDB6F4", "#FFC58F"];
  var JAR_WIDTH = 180;
  var JAR_HEIGHT = 212;
  var JAR_MAX_SLIPS = 60;
  function shade(hex, amount) {
    const channel = (i) => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 + amount))));
    return "#" + [1, 3, 5].map((i) => channel(i).toString(16).padStart(2, "0")).join("");
  }
  function lidSvg() {
    let ribs = "";
    for (let k = 0; k < 11; k++) ribs += `<rect x="${-40 + k * 8}" y="-4" width="1.2" height="13" fill="#7A5C2E" fill-opacity="0.22"/>`;
    return `<ellipse cx="0" cy="10" rx="46" ry="7" fill="#8C6E3C"/>
<rect x="-46" y="-6" width="92" height="16" fill="url(#lidSide)"/>
${ribs}
<ellipse cx="0" cy="-6" rx="46" ry="7" fill="url(#lidTop)" stroke="#9C7A45" stroke-width="1"/>
<ellipse cx="-10" cy="-8" rx="22" ry="2.5" fill="#FFFFFF" fill-opacity="0.35"/>`;
  }
  function jarSvg(count, lidOpen) {
    let slips = "";
    for (let i = 0; i < Math.min(count, JAR_MAX_SLIPS); i++) {
      const row = i < 5 ? 0 : 1 + Math.floor((i - 5) / 6);
      const col = i < 5 ? i : (i - 5) % 6;
      const x = (row === 0 ? 42 + col * 20 : 34 + col * 17.5 + (row % 2 ? 6 : 0)) + i * 37 % 7 - 3;
      const y = 176 - row * 11 + i * 53 % 5 - 2;
      const angle = i * 71 % 41 - 20;
      const color = SLIP_COLORS[i % SLIP_COLORS.length];
      slips += `<g transform="rotate(${angle} ${x + 10} ${y + 6})"><rect x="${x}" y="${y + 2}" width="20" height="12" rx="2" fill="${shade(color, -0.28)}"/><rect x="${x}" y="${y}" width="20" height="12" rx="2" fill="${color}"/><rect x="${x + 2}" y="${y + 2}" width="15" height="2" rx="1" fill="#FFFFFF" fill-opacity="0.45"/></g>`;
    }
    const lid = lidOpen ? `<g transform="translate(136 34) rotate(28) scale(0.8)">${lidSvg()}</g>` : `<g transform="translate(90 20)">${lidSvg()}</g>`;
    const opening = lidOpen ? '<ellipse cx="90" cy="30" rx="36" ry="4.5" fill="#B5CFDA"/>' : "";
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
</svg>`;
  }

  // widget-src/textos.ts
  var LANGS = [
    { id: "es", label: "Espa\xF1ol" },
    { id: "en", label: "English" }
  ];
  var DEFAULT_LANG = "en";
  function isLang(value) {
    return LANGS.some((l) => l.id === value);
  }
  var es = {
    panel: {
      eyebrow: "\u{1F512} Solo t\xFA ves esta ventana",
      fallbackQuestion: "\xBFQu\xE9 quieres compartir?",
      column: "Columna",
      placeholder: "Escribe tu idea. Nadie sabr\xE1 que es tuya.",
      cancel: "Cancelar",
      seal: "Echar al tarro",
      saveChanges: "Guardar cambios",
      mine: "Tus ideas en este tarro (solo t\xFA las ves)",
      edit: "Editar",
      remove: "Retirar",
      sure: "\xBFSeguro?",
      close: "Cerrar",
      saving: "Guardando en el tarro",
      savingEdit: "Guardando los cambios",
      removing: "Retirando la idea del tarro",
      delay: "\u2026 (unos {s} s, al azar para que nadie sepa cu\xE1ndo lo hiciste)",
      saved: "\u2713 Guardada.",
      savedIn: "\u2713 Guardada en \xAB{col}\xBB.",
      next: "Puedes escribir otra, cambiarla abajo o cerrar la ventana.",
      late: "El tarro ya se hab\xEDa abierto, as\xED que saldr\xE1 en la pr\xF3xima ronda.",
      editing: "Editando tu idea. Nadie m\xE1s la ver\xE1 hasta que se abra el tarro.",
      edited: "\u2713 Cambios guardados.",
      removed: "\u2713 Idea retirada del tarro.",
      voteClosed: "La votaci\xF3n ya se ha cerrado.",
      voteEyebrow: "\u{1F512} Nadie sabr\xE1 qu\xE9 has votado",
      voteHelp: "Elige las ideas que quieres tratar primero.",
      votesLeft: "Te quedan {n} de {max} votos",
      saveVotes: "Guardar mis votos",
      votesSaved: "\u2713 Votos guardados. Puedes cambiarlos hasta que se cierre la votaci\xF3n."
    },
    panelTitle: "Tu idea",
    // Los tooltips de los widgets los coloca Figma y salen descuadrados: por eso el nombre completo.
    formats: { single: "Una pregunta", retro: "Retrospectiva", ssc: "Empezar \xB7 Dejar \xB7 Seguir" },
    columns: {
      idea: "Ideas",
      bien: "Qu\xE9 fue bien",
      mejorar: "Qu\xE9 mejorar",
      probar: "Qu\xE9 probar",
      empezar: "Empezar a hacer",
      dejar: "Dejar de hacer",
      seguir: "Seguir haciendo"
    },
    suggestions: ["\xBFQu\xE9 podr\xEDamos mejorar?", "\xBFQu\xE9 ha ido bien?", "\xBFQu\xE9 te preocupa?", "\xBFQu\xE9 deber\xEDamos dejar de hacer?"],
    round: (n) => `Ronda ${n}`,
    labelTitle: "T\xCDTULO (OPCIONAL)",
    labelQuestion: (round) => round === 1 ? "PREGUNTA PARA EL EQUIPO" : `PREGUNTA PARA LA RONDA ${round}`,
    placeholderQuestion: "Escribe aqu\xED la pregunta\u2026",
    placeholderTitle: (format) => `Por ejemplo: ${format === "retro" ? "Retro del sprint 12" : "Revisi\xF3n del trimestre"}`,
    orPick: "O elige una:",
    lateInJar: (n) => n === 1 ? "En el tarro hay 1 idea que lleg\xF3 tarde: saldr\xE1 en esta ronda." : `En el tarro hay ${n} ideas que llegaron tarde: saldr\xE1n en esta ronda.`,
    hintColumns: "Al abrir el tarro, las ideas saldr\xE1n agrupadas por columna y an\xF3nimas.",
    hintSingle: "Cada persona responder\xE1 en privado. T\xFA decides cu\xE1ndo abrir el tarro y las ideas saldr\xE1n an\xF3nimas.",
    start: (round) => round === 1 ? "Empezar" : `Empezar la ronda ${round}`,
    back: "\u2190 Volver",
    ideas: (n) => n === 1 ? "1 idea" : `${n} ideas`,
    people: (n) => n === 1 ? "1 persona" : `${n} personas`,
    write: "Escribir una idea",
    open: "Abrir el tarro",
    timer: "\u23F1 Temporizador:",
    nobodyWrote: "A\xFAn no ha escrito nadie en esta ronda",
    onlyWrote: (n) => n === 1 ? "Solo ha escrito 1 persona" : `Solo han escrito ${n} personas`,
    easyToGuess: (min) => `Con menos de ${min} personas es f\xE1cil adivinar qui\xE9n escribi\xF3 cada idea.`,
    wait: "Esperar",
    openAnyway: "Abrir igualmente",
    opened: (n) => `Tarro abierto: ${n === 1 ? "1 idea" : `${n} ideas`}`,
    newIdeas: (n) => n === 1 ? "Hay 1 idea nueva para la pr\xF3xima ronda." : `Hay ${n} ideas nuevas para la pr\xF3xima ronda.`,
    showIdeas: "Ver las ideas",
    newRound: "Nueva ronda",
    ledBy: (name) => `Dirige: ${name}`,
    wroteOf: (w, p) => `${w} de ${p} ${p === 1 ? "persona ha" : "personas han"} escrito`,
    labelColumns: "COLUMNAS (PUEDES CAMBIARLES EL NOMBRE)",
    startVote: "Votar las ideas",
    vote: (max) => `Votar (${max} votos por persona)`,
    closeVote: "Cerrar la votaci\xF3n",
    voters: (n) => n === 0 ? "Todav\xEDa no ha votado nadie" : n === 1 ? "Ha votado 1 persona" : `Han votado ${n} personas`,
    topIdeas: "LAS M\xC1S VOTADAS",
    votesCount: (n) => n === 1 ? "1 voto" : `${n} votos`,
    noVotes: "Nadie ha votado.",
    noNotesToVote: "No encuentro las notas del tarro en el tablero. \xBFLas hab\xE9is borrado?",
    onlyFacilitator: (name) => `Solo ${name} puede hacer esto: es quien dirige la sesi\xF3n.`,
    pressStartFirst: "Primero alguien tiene que pulsar \xABEmpezar\xBB.",
    whoAreYou: "No he podido saber qui\xE9n eres.",
    needQuestion: "Escribe una pregunta o elige una de las sugerencias.",
    alreadyOut: "Esa idea ya no est\xE1 en el tarro: se abri\xF3 y ya est\xE1 en el tablero.",
    noTimer: "Este tablero no tiene temporizador.",
    timerStarted: (minutes) => `Temporizador en marcha: ${minutes} minutos para escribir.`,
    timerFailed: "No he podido poner el temporizador. Puedes lanzarlo desde la barra de FigJam.",
    emptyJar: "El tarro est\xE1 vac\xEDo: todav\xEDa nadie ha echado ideas.",
    sectionsMissing: "No encuentro las secciones con las ideas. \xBFLas hab\xE9is borrado?",
    cantGoBack: "Ya ha escrito alguien en esta ronda, as\xED que ya no se puede volver atr\xE1s.",
    nowYouLead: (name) => `Ahora diriges t\xFA la sesi\xF3n, ${name}.`,
    menuLanguage: "Idioma",
    menuTakeover: "Dirigir yo la sesi\xF3n",
    menuReset: "Vaciar el tarro y empezar de cero"
  };
  var en = {
    panel: {
      eyebrow: "\u{1F512} Only you can see this window",
      fallbackQuestion: "What would you like to share?",
      column: "Column",
      placeholder: "Write your idea. No one will know it\u2019s yours.",
      cancel: "Cancel",
      seal: "Drop in the jar",
      saveChanges: "Save changes",
      mine: "Your ideas in this jar (only you can see them)",
      edit: "Edit",
      remove: "Remove",
      sure: "Sure?",
      close: "Close",
      saving: "Dropping it in the jar",
      savingEdit: "Saving your changes",
      removing: "Taking the idea out of the jar",
      delay: "\u2026 (about {s} s, random so no one knows when you did it)",
      saved: "\u2713 Saved.",
      savedIn: "\u2713 Saved in \u201C{col}\u201D.",
      next: "You can write another one, change it below or close this window.",
      late: "The jar had already been opened, so it will come out next round.",
      editing: "Editing your idea. No one else will see it until the jar is opened.",
      edited: "\u2713 Changes saved.",
      removed: "\u2713 Idea removed from the jar.",
      voteClosed: "Voting has already closed.",
      voteEyebrow: "\u{1F512} No one will know how you voted",
      voteHelp: "Pick the ideas you want to discuss first.",
      votesLeft: "{n} of {max} votes left",
      saveVotes: "Save my votes",
      votesSaved: "\u2713 Votes saved. You can change them until voting closes."
    },
    panelTitle: "Your idea",
    formats: { single: "One question", retro: "Retrospective", ssc: "Start \xB7 Stop \xB7 Continue" },
    columns: {
      idea: "Ideas",
      bien: "Went well",
      mejorar: "To improve",
      probar: "To try",
      empezar: "Start doing",
      dejar: "Stop doing",
      seguir: "Continue doing"
    },
    suggestions: ["What could we improve?", "What went well?", "What worries you?", "What should we stop doing?"],
    round: (n) => `Round ${n}`,
    labelTitle: "TITLE (OPTIONAL)",
    labelQuestion: (round) => round === 1 ? "QUESTION FOR THE TEAM" : `QUESTION FOR ROUND ${round}`,
    placeholderQuestion: "Type the question here\u2026",
    placeholderTitle: (format) => `For example: ${format === "retro" ? "Sprint 12 retro" : "Quarterly review"}`,
    orPick: "Or pick one:",
    lateInJar: (n) => n === 1 ? "There\u2019s 1 late idea in the jar: it will come out this round." : `There are ${n} late ideas in the jar: they will come out this round.`,
    hintColumns: "When you open the jar, the ideas come out anonymous and grouped by column.",
    hintSingle: "Everyone answers privately. You decide when to open the jar, and the ideas come out anonymous.",
    start: (round) => round === 1 ? "Start" : `Start round ${round}`,
    back: "\u2190 Back",
    ideas: (n) => n === 1 ? "1 idea" : `${n} ideas`,
    people: (n) => n === 1 ? "1 person" : `${n} people`,
    write: "Write an idea",
    open: "Open the jar",
    timer: "\u23F1 Timer:",
    nobodyWrote: "Nobody has written yet this round",
    onlyWrote: (n) => n === 1 ? "Only 1 person has written" : `Only ${n} people have written`,
    easyToGuess: (min) => `With fewer than ${min} people, it\u2019s easy to guess who wrote each idea.`,
    wait: "Wait",
    openAnyway: "Open anyway",
    opened: (n) => `Jar opened: ${n === 1 ? "1 idea" : `${n} ideas`}`,
    newIdeas: (n) => n === 1 ? "There\u2019s 1 new idea for the next round." : `There are ${n} new ideas for the next round.`,
    showIdeas: "Show the ideas",
    newRound: "New round",
    ledBy: (name) => `Led by ${name}`,
    wroteOf: (w, p) => `${w} of ${p} ${p === 1 ? "person has" : "people have"} written`,
    labelColumns: "COLUMNS (YOU CAN RENAME THEM)",
    startVote: "Vote on the ideas",
    vote: (max) => `Vote (${max} votes each)`,
    closeVote: "Close voting",
    voters: (n) => n === 0 ? "Nobody has voted yet" : n === 1 ? "1 person has voted" : `${n} people have voted`,
    topIdeas: "TOP VOTED",
    votesCount: (n) => n === 1 ? "1 vote" : `${n} votes`,
    noVotes: "Nobody voted.",
    noNotesToVote: "Can\u2019t find the jar\u2019s notes on the board. Were they deleted?",
    onlyFacilitator: (name) => `Only the facilitator, ${name}, can do this.`,
    pressStartFirst: "Someone has to press \u201CStart\u201D first.",
    whoAreYou: "Couldn\u2019t tell who you are.",
    needQuestion: "Write a question or pick one of the suggestions.",
    alreadyOut: "That idea isn\u2019t in the jar anymore: the jar was opened and it\u2019s on the board.",
    noTimer: "This board doesn\u2019t have a timer.",
    timerStarted: (minutes) => `Timer running: ${minutes} minutes to write.`,
    timerFailed: "Couldn\u2019t start the timer. You can start it from the FigJam toolbar.",
    emptyJar: "The jar is empty: nobody has dropped in an idea yet.",
    sectionsMissing: "Can\u2019t find the sections with the ideas. Were they deleted?",
    cantGoBack: "Someone has already written this round, so you can\u2019t go back now.",
    nowYouLead: (name) => `You\u2019re leading the session now, ${name}.`,
    menuLanguage: "Language",
    menuTakeover: "Lead the session myself",
    menuReset: "Empty the jar and start over"
  };
  var STRINGS = { es, en };
  function strings(lang) {
    return STRINGS[lang];
  }

  // widget-src/code.tsx
  var { widget } = figma;
  var { AutoLayout, Text, Input, SVG, useSyncedMap, useSyncedState, usePropertyMenu, useWidgetNodeId, useEffect, waitForTask } = widget;
  var FORMAT_DEFS = [
    {
      id: "single",
      columns: [{ id: "idea", paletteKey: "lightYellow", hex: "#FFE8A3" }]
    },
    {
      id: "retro",
      columns: [
        { id: "bien", paletteKey: "lightGreen", hex: "#AFF4C6" },
        { id: "mejorar", paletteKey: "lightRed", hex: "#FFC7C2" },
        { id: "probar", paletteKey: "lightBlue", hex: "#BDE3FF" }
      ]
    },
    {
      id: "ssc",
      columns: [
        { id: "empezar", paletteKey: "lightGreen", hex: "#AFF4C6" },
        { id: "dejar", paletteKey: "lightRed", hex: "#FFC7C2" },
        { id: "seguir", paletteKey: "lightBlue", hex: "#BDE3FF" }
      ]
    }
  ];
  var MIN_PEOPLE = 3;
  var MAX_CHARS = 280;
  var MAX_QUESTION = 140;
  var WIDTH = 440;
  var TIMER_MINUTES = [3, 5, 10];
  var SECTION_GAP = 40;
  var INK = "#1D1D1F";
  var MUTED = "#6B6B66";
  var LANG_KEY = "hushjar:idioma";
  var MAX_VOTES = 3;
  var MAX_LABEL = 40;
  var STICKY_STEP = 260;
  var BUBBLE_TAIL = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" viewBox="0 0 14 10"><path d="M1 0.5 L2 9 L10 0.5" fill="#FFFFFF" stroke="#D8D4CA" stroke-width="1.5" stroke-linejoin="round"/><rect x="1.8" y="0" width="7.4" height="1.8" fill="#FFFFFF"/></svg>';
  function formatsIn(t, labels) {
    return FORMAT_DEFS.map((f) => ({
      id: f.id,
      name: t.formats[f.id],
      columns: f.columns.map((c) => __spreadProps(__spreadValues({}, c), { label: labels[`${f.id}:${c.id}`] || t.columns[c.id] }))
    }));
  }
  function formatById(formats, id) {
    return formats.find((f) => f.id === id) || formats[0];
  }
  function columnOf(slip, format) {
    return slip.c && format.columns.some((c) => c.id === slip.c) ? slip.c : format.columns[0].id;
  }
  function shuffle(items) {
    const a = items.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
  function hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16) / 255,
      g: parseInt(hex.slice(3, 5), 16) / 255,
      b: parseInt(hex.slice(5, 7), 16) / 255
    };
  }
  function Button(props) {
    const primary = (props.tone || "primary") === "primary";
    return /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        width: "fill-parent",
        padding: { vertical: 12, horizontal: 16 },
        cornerRadius: 12,
        horizontalAlignItems: "center",
        fill: primary ? INK : "#FFFFFF",
        stroke: primary ? INK : "#D8D4CA",
        hoverStyle: { fill: primary ? "#3A3A3C" : "#F4F2EC" },
        onClick: props.onClick
      },
      /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fontWeight: 600, fill: primary ? "#FFFFFF" : INK }, props.label)
    );
  }
  function Chip(props) {
    return /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        padding: { vertical: 7, horizontal: 11 },
        cornerRadius: 999,
        fill: props.active ? INK : "#F4F2EC",
        stroke: props.active ? INK : "#E0DBCF",
        hoverStyle: { fill: props.active ? "#3A3A3C" : "#EAE6DB" },
        onClick: props.onClick
      },
      /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: props.active ? "#FFFFFF" : INK }, props.label)
    );
  }
  function Tabs(props) {
    return /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 0 }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 4, verticalAlignItems: "end" }, props.items.map((item) => {
      const on = item.id === props.active;
      return /* @__PURE__ */ figma.widget.h(
        AutoLayout,
        {
          key: item.id,
          direction: "vertical",
          spacing: 8,
          padding: { top: 9, horizontal: 8 },
          horizontalAlignItems: "center",
          cornerRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
          hoverStyle: on ? void 0 : { fill: "#F4F2EC" },
          onClick: () => props.onSelect(item.id)
        },
        /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: on ? 700 : 500, fill: on ? INK : MUTED }, item.label),
        /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", height: 3, cornerRadius: 2, fill: on ? INK : void 0 })
      );
    })), /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", height: 1, fill: "#E6E2D8" }));
  }
  function ColumnTag(props) {
    return /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", spacing: 6, verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { width: 12, height: 12, cornerRadius: 6, fill: props.column.hex, stroke: "#C9C4B8" }), /* @__PURE__ */ figma.widget.h(Text, { fontSize: props.count === void 0 ? 12 : 13, fill: INK }, props.column.label), props.count === void 0 ? null : /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 700, fill: INK }, props.count));
  }
  function Label(props) {
    return /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fontWeight: 700, fill: MUTED, letterSpacing: 0.4 }, props.children);
  }
  function Hint(props) {
    return /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: MUTED, width: "fill-parent", horizontalAlignText: "center", lineHeight: 19 }, props.children);
  }
  function HushJar() {
    const nodeId = useWidgetNodeId();
    const [phase, setPhase] = useSyncedState("phase", "setup");
    const [question, setQuestion] = useSyncedState("question", "");
    const [formatId, setFormatId] = useSyncedState("format", "single");
    const [facilitator, setFacilitator] = useSyncedState("facilitator", null);
    const [round, setRound] = useSyncedState("round", 1);
    const [reveal, setReveal] = useSyncedState("reveal", null);
    const [storedLang, setLang] = useSyncedState("lang", "");
    const slips = useSyncedMap("slips");
    const people = useSyncedMap("people");
    const [labels, setLabels] = useSyncedState("labels", {});
    const [present, setPresent] = useSyncedState("present", 0);
    const [vote, setVote] = useSyncedState("vote", null);
    const votes = useSyncedMap("votes");
    const lang = isLang(storedLang) ? storedLang : DEFAULT_LANG;
    const t = strings(lang);
    const formats = formatsIn(t, labels);
    const format = formatById(formats, formatId);
    const multi = format.columns.length > 1;
    const title = question || format.name;
    const ideas = slips.size;
    const writers = people.keys().filter((key) => key.indexOf(`${round}:`) === 0).length;
    const canGoBack = phase === "open" && writers === 0;
    useEffect(() => {
      if (storedLang) return;
      waitForTask(
        figma.clientStorage.getAsync(LANG_KEY).then(
          (saved) => setLang(isLang(saved) ? saved : DEFAULT_LANG),
          () => setLang(DEFAULT_LANG)
        )
      );
    });
    function me() {
      const user = figma.currentUser;
      if (!user) return null;
      return { id: user.id || `sesion-${user.sessionId}`, name: user.name };
    }
    function onlyFacilitator() {
      const current = me();
      if (facilitator && current && current.id === facilitator.id) return true;
      figma.notify(facilitator ? t.onlyFacilitator(facilitator.name) : t.pressStartFirst);
      return false;
    }
    function notePresent() {
      try {
        const n = figma.activeUsers.length;
        if (n > 0 && n !== present) setPresent(n);
      } catch (e) {
      }
    }
    function canPrepare() {
      return !facilitator || onlyFacilitator();
    }
    function editQuestion(text) {
      if (!canPrepare()) return;
      setQuestion(text.trim().slice(0, MAX_QUESTION));
    }
    function chooseQuestion(text) {
      if (!canPrepare()) return;
      setQuestion(text);
    }
    function chooseFormat(id) {
      if (!canPrepare()) return;
      setFormatId(id);
    }
    function renameColumn(id, text) {
      if (!canPrepare()) return;
      const key = `${formatId}:${id}`;
      const name = text.trim().slice(0, MAX_LABEL);
      const next = __spreadValues({}, labels);
      if (!name || name === t.columns[id]) delete next[key];
      else next[key] = name;
      setLabels(next);
    }
    async function start() {
      const current = me();
      if (!current) {
        figma.notify(t.whoAreYou);
        return;
      }
      if (facilitator && !onlyFacilitator()) return;
      if (!question.trim() && !multi) {
        figma.notify(t.needQuestion);
        return;
      }
      if (!facilitator) setFacilitator(current);
      notePresent();
      setPhase("open");
    }
    async function goBack() {
      if (!onlyFacilitator()) return;
      if (!canGoBack) {
        figma.notify(t.cantGoBack);
        return;
      }
      setPhase("setup");
    }
    async function writeIdea() {
      const tokenKey = `hushjar:${nodeId}:persona`;
      const mineKey = `hushjar:${nodeId}:mias`;
      notePresent();
      let token;
      let mineKeys = [];
      try {
        token = await figma.clientStorage.getAsync(tokenKey);
        const stored = await figma.clientStorage.getAsync(mineKey);
        if (Array.isArray(stored)) mineKeys = stored.filter((key) => typeof key === "string" && slips.has(key));
      } catch (e) {
      }
      const saveMine = async () => {
        try {
          await figma.clientStorage.setAsync(mineKey, mineKeys);
        } catch (e) {
        }
      };
      await saveMine();
      const myIdeas = () => mineKeys.filter((key) => slips.has(key)).map((key) => {
        const slip = slips.get(key);
        return { key, t: slip.t, c: columnOf(slip, format) };
      });
      let roundNow = round;
      const openedIn = round;
      figma.showUI(__html__, { width: 380, height: multi ? 380 : 336, title: t.panelTitle, themeColors: true });
      figma.ui.postMessage({
        type: "init",
        lang,
        text: t.panel,
        question: title,
        columns: format.columns.map((c) => ({ id: c.id, label: c.label, hex: c.hex })),
        mine: myIdeas()
      });
      await new Promise((resolve) => {
        let pending = null;
        const flush = () => {
          if (!pending) return;
          const { run, timer } = pending;
          pending = null;
          clearTimeout(timer);
          run(false);
        };
        const onClose = () => flush();
        figma.on("close", onClose);
        const later = (run) => {
          const timer = setTimeout(async () => {
            const node = await figma.getNodeByIdAsync(nodeId);
            const state = node && node.type === "WIDGET" ? node.widgetSyncedState : {};
            if (typeof state.round === "number") roundNow = state.round;
            const late = state.phase === "revealed" || roundNow !== openedIn;
            pending = null;
            run(true, late);
          }, 0);
          pending = { run: (live) => run(live, false), timer };
        };
        const alreadyOut = (key) => {
          mineKeys = mineKeys.filter((k) => k !== key);
          void saveMine();
          figma.ui.postMessage({ type: "refused", key, text: t.alreadyOut });
        };
        figma.ui.onmessage = async (msg) => {
          if (!msg) return;
          if (msg.type === "close") {
            flush();
            figma.off("close", onClose);
            resolve();
            return;
          }
          if (msg.type === "resize") {
            figma.ui.resize(380, Math.max(300, Math.min(640, Math.round(Number(msg.height) || 0))));
            return;
          }
          if (msg.type === "ready" && !token) {
            token = String(msg.token);
            try {
              await figma.clientStorage.setAsync(tokenKey, token);
            } catch (e) {
            }
            return;
          }
          if (pending) return;
          const key = String(msg.key || "");
          const text = String(msg.text || "").trim().slice(0, MAX_CHARS);
          const c = columnOf({ t: text, c: String(msg.c || "") }, format);
          if (msg.type === "seal") {
            if (!text || !key) return;
            later((live, late) => {
              slips.set(key, { t: text, c });
              if (token) people.set(`${roundNow}:${token}`, 1);
              if (live) figma.ui.postMessage({ type: "saved", key, t: text, c, late });
            });
            mineKeys.push(key);
            void saveMine();
          }
          if (msg.type === "edit") {
            if (!text || mineKeys.indexOf(key) < 0) return;
            if (!slips.has(key)) return alreadyOut(key);
            later((live, late) => {
              if (late || !slips.has(key)) {
                if (live) alreadyOut(key);
                return;
              }
              slips.set(key, { t: text, c });
              if (live) figma.ui.postMessage({ type: "edited", key, t: text, c });
            });
          }
          if (msg.type === "retract") {
            if (mineKeys.indexOf(key) < 0) return;
            if (!slips.has(key)) return alreadyOut(key);
            later((live, late) => {
              if (late || !slips.has(key)) {
                if (live) alreadyOut(key);
                return;
              }
              slips.delete(key);
              mineKeys = mineKeys.filter((k) => k !== key);
              void saveMine();
              if (live) figma.ui.postMessage({ type: "retracted", key });
            });
          }
        };
      });
    }
    async function startTimer(minutes) {
      if (!onlyFacilitator()) return;
      const timer = figma.timer;
      if (!timer) {
        figma.notify(t.noTimer);
        return;
      }
      try {
        timer.start(minutes * 60);
        figma.notify(t.timerStarted(minutes));
      } catch (e) {
        figma.notify(t.timerFailed);
      }
    }
    function freeTop(x, y, width, height) {
      const boxes = [];
      for (const child of figma.currentPage.children) {
        if (child.id === nodeId || !("absoluteBoundingBox" in child) || !child.absoluteBoundingBox) continue;
        boxes.push(child.absoluteBoundingBox);
      }
      let top = y;
      for (let i = 0; i < 200; i++) {
        const hit = boxes.find((b) => b.x < x + width && b.x + b.width > x && b.y < top + height && b.y + b.height > top);
        if (!hit) break;
        top = hit.y + hit.height + SECTION_GAP * 2;
      }
      return top;
    }
    async function openJar(force) {
      if (!onlyFacilitator()) return;
      notePresent();
      const entries = slips.entries();
      if (!entries.length) {
        figma.notify(t.emptyJar);
        return;
      }
      if (!force && writers < MIN_PEOPLE) {
        setPhase("confirm");
        return;
      }
      const node = await figma.getNodeByIdAsync(nodeId);
      if (!node || node.type !== "WIDGET") return;
      const box = node.absoluteBoundingBox || { x: node.x, y: node.y, width: node.width, height: node.height };
      const probe = figma.createSticky();
      await figma.loadFontAsync(probe.text.fontName);
      probe.remove();
      const palette = figma.constants.colors.figJamBaseLight;
      const layout = format.columns.map((column) => {
        const items = shuffle(entries.filter(([, slip]) => columnOf(slip, format) === column.id));
        const perRow = multi ? 2 : Math.max(1, Math.min(4, items.length));
        const rows = Math.max(1, Math.ceil(items.length / perRow));
        return { column, items, perRow, width: perRow * 260 + 60, height: rows * 260 + 100 };
      });
      const left = box.x + box.width + 120;
      const totalWidth = layout.reduce((sum, l) => sum + l.width, 0) + SECTION_GAP * (layout.length - 1);
      const totalHeight = Math.max(...layout.map((l) => l.height));
      const top = freeTop(left, box.y, totalWidth, totalHeight);
      const sections = [];
      const counts = {};
      let x = left;
      for (const { column, items, perRow, width, height } of layout) {
        counts[column.id] = items.length;
        const section = figma.createSection();
        section.name = multi ? `${column.label} \xB7 ${title}` : title;
        section.x = x;
        section.y = top;
        section.resizeWithoutConstraints(width, height);
        x += width + SECTION_GAP;
        const color = hexToRgb(palette[column.paletteKey] || column.hex);
        items.forEach(([key, slip], i) => {
          const sticky = figma.createSticky();
          section.appendChild(sticky);
          sticky.x = 40 + i % perRow * 260;
          sticky.y = 70 + Math.floor(i / perRow) * 260;
          sticky.text.characters = slip.t;
          sticky.authorVisible = false;
          sticky.fills = [{ type: "SOLID", color }];
          slips.delete(key);
        });
        sections.push(section);
      }
      setReveal({ count: entries.length, sectionIds: sections.map((s) => s.id), counts });
      setPhase("revealed");
      figma.viewport.scrollAndZoomIntoView([node, ...sections]);
    }
    async function keepWaiting() {
      if (onlyFacilitator()) setPhase("open");
    }
    async function showIdeas() {
      const found = await revealedSections();
      if (!found.length) {
        figma.notify(t.sectionsMissing);
        return;
      }
      figma.viewport.scrollAndZoomIntoView(found);
    }
    async function revealedSections() {
      const ids = reveal ? reveal.sectionIds || (reveal.sectionId ? [reveal.sectionId] : []) : [];
      const found = [];
      for (const id of ids) {
        const node = await figma.getNodeByIdAsync(id);
        if (node && node.type === "SECTION") found.push(node);
      }
      return found;
    }
    async function revealedNotes() {
      const notes = [];
      const sections = await revealedSections();
      sections.forEach((section, i) => {
        const hex = (format.columns[i] || format.columns[0]).hex;
        for (const child of section.children) {
          if (child.type === "STICKY" && child.text.characters.trim()) notes.push({ id: child.id, t: child.text.characters, hex });
        }
      });
      return notes;
    }
    async function startVote() {
      if (!onlyFacilitator()) return;
      if (!(await revealedNotes()).length) {
        figma.notify(t.noNotesToVote);
        return;
      }
      for (const key of votes.keys()) votes.delete(key);
      setVote({ open: true });
    }
    async function castVotes() {
      const notes = await revealedNotes();
      if (!notes.length) {
        figma.notify(t.noNotesToVote);
        return;
      }
      const max = Math.min(MAX_VOTES, notes.length);
      const tokenKey = `hushjar:${nodeId}:persona`;
      let token;
      try {
        token = await figma.clientStorage.getAsync(tokenKey);
      } catch (e) {
      }
      const chosen = token ? (votes.get(token) || []).filter((id) => notes.some((n) => n.id === id)) : [];
      figma.showUI(__html__, { width: 380, height: 420, title: t.vote(max), themeColors: true });
      figma.ui.postMessage({ type: "init", mode: "vote", lang, text: t.panel, question: title, notes, max, chosen });
      await new Promise((resolve) => {
        const done = () => {
          figma.off("close", done);
          resolve();
        };
        figma.on("close", done);
        figma.ui.onmessage = async (msg) => {
          if (!msg) return;
          if (msg.type === "close") return done();
          if (msg.type === "resize") {
            figma.ui.resize(380, Math.max(300, Math.min(640, Math.round(Number(msg.height) || 0))));
            return;
          }
          if (msg.type === "ready" && !token) {
            token = String(msg.token);
            try {
              await figma.clientStorage.setAsync(tokenKey, token);
            } catch (e) {
            }
            return;
          }
          if (msg.type === "vote" && token) {
            const node = await figma.getNodeByIdAsync(nodeId);
            const state = node && node.type === "WIDGET" ? node.widgetSyncedState : {};
            if (!state.vote || !state.vote.open) {
              figma.ui.postMessage({ type: "refused", text: t.panel.voteClosed });
              return;
            }
            const ids = Array.isArray(msg.ids) ? msg.ids.map(String) : [];
            const valid = ids.filter((id, i) => ids.indexOf(id) === i && notes.some((n) => n.id === id)).slice(0, max);
            votes.set(token, valid);
            figma.ui.postMessage({ type: "voted", ids: valid });
          }
        };
      });
    }
    async function closeVote() {
      if (!onlyFacilitator()) return;
      const tally = {};
      for (const ids of votes.values()) for (const id of ids) tally[id] = (tally[id] || 0) + 1;
      const notes = await revealedNotes();
      for (const section of await revealedSections()) {
        const stickies = section.children.filter((c) => c.type === "STICKY");
        const perRow = Math.max(1, Math.round((section.width - 60) / STICKY_STEP));
        stickies.map((s, i) => ({ s, i, n: tally[s.id] || 0 })).sort((a, b) => b.n - a.n || a.i - b.i).forEach(({ s }, i) => {
          s.x = 40 + i % perRow * STICKY_STEP;
          s.y = 70 + Math.floor(i / perRow) * STICKY_STEP;
        });
      }
      const results = notes.map((note) => ({ id: note.id, t: note.t, n: tally[note.id] || 0 })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n).slice(0, 3);
      for (const key of votes.keys()) votes.delete(key);
      setVote({ open: false, results });
    }
    async function showNote(id) {
      const node = await figma.getNodeByIdAsync(id);
      if (node && node.type === "STICKY") figma.viewport.scrollAndZoomIntoView([node]);
      else figma.notify(t.noNotesToVote);
    }
    async function newRound() {
      if (!onlyFacilitator()) return;
      for (const key of people.keys()) people.delete(key);
      for (const key of votes.keys()) votes.delete(key);
      setVote(null);
      setRound(round + 1);
      setReveal(null);
      setQuestion("");
      setPhase("setup");
    }
    const languageItem = {
      itemType: "dropdown",
      propertyName: "lang",
      tooltip: t.menuLanguage,
      selectedOption: lang,
      options: LANGS.map((l) => ({ option: l.id, label: l.label }))
    };
    usePropertyMenu(
      phase === "setup" ? [languageItem] : [
        languageItem,
        { itemType: "separator" },
        { itemType: "action", propertyName: "takeover", tooltip: t.menuTakeover },
        { itemType: "action", propertyName: "reset", tooltip: t.menuReset }
      ],
      async ({ propertyName, propertyValue }) => {
        if (propertyName === "lang") {
          if (!isLang(propertyValue)) return;
          setLang(propertyValue);
          try {
            await figma.clientStorage.setAsync(LANG_KEY, propertyValue);
          } catch (e) {
          }
        }
        if (propertyName === "takeover") {
          const current = me();
          if (!current) return;
          setFacilitator(current);
          figma.notify(t.nowYouLead(current.name));
        }
        if (propertyName === "reset") {
          if (!onlyFacilitator()) return;
          for (const key of slips.keys()) slips.delete(key);
          for (const key of people.keys()) people.delete(key);
          for (const key of votes.keys()) votes.delete(key);
          setVote(null);
          setLabels({});
          setPresent(0);
          setReveal(null);
          setRound(1);
          setQuestion("");
          setFormatId("single");
          setFacilitator(null);
          setPhase("setup");
        }
      }
    );
    const revealedCounts = phase === "revealed" && reveal && reveal.counts ? reveal.counts : null;
    return /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        direction: "vertical",
        width: WIDTH,
        padding: { top: 20, bottom: 20, horizontal: 24 },
        spacing: 16,
        cornerRadius: 28,
        fill: "#FFFFFF",
        stroke: "#E6E2D8",
        strokeWidth: 2,
        horizontalAlignItems: "center",
        effect: { type: "drop-shadow", color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 6 }, blur: 20 }
      },
      /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", height: 20, verticalAlignItems: "center", spacing: "auto" }, canGoBack ? /* @__PURE__ */ figma.widget.h(AutoLayout, { padding: { vertical: 2 }, onClick: goBack }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 600, fill: MUTED, hoverStyle: { fill: INK } }, t.back)) : /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fontWeight: 700, fill: MUTED, letterSpacing: 0.6 }, "HUSH JAR"), round > 1 || phase !== "setup" ? /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fill: MUTED }, t.round(round)) : null),
      phase === "setup" ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 18, horizontalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(SVG, { src: jarSvg(ideas, false), width: 92, height: 108 }), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 10 }, /* @__PURE__ */ figma.widget.h(Tabs, { items: formats.map((f) => ({ id: f.id, label: f.name })), active: formatId, onSelect: (id) => chooseFormat(id) })), multi ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Label, null, t.labelColumns), format.columns.map((c) => /* @__PURE__ */ figma.widget.h(AutoLayout, { key: c.id, direction: "horizontal", width: "fill-parent", spacing: 10, verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { width: 14, height: 14, cornerRadius: 7, fill: c.hex, stroke: "#C9C4B8" }), /* @__PURE__ */ figma.widget.h(
        Input,
        {
          value: c.label,
          placeholder: t.columns[c.id],
          onTextEditEnd: (e) => renameColumn(c.id, e.characters),
          fontSize: 14,
          fill: INK,
          width: "fill-parent",
          inputFrameProps: {
            fill: "#FFFFFF",
            stroke: "#D8D4CA",
            cornerRadius: 8,
            padding: { vertical: 8, horizontal: 10 },
            hoverStyle: { stroke: INK }
          }
        }
      )))) : null, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Label, null, multi ? t.labelTitle : t.labelQuestion(round)), /* @__PURE__ */ figma.widget.h(
        Input,
        {
          value: question,
          placeholder: multi ? t.placeholderTitle(format.id) : t.placeholderQuestion,
          onTextEditEnd: (e) => editQuestion(e.characters),
          fontSize: 17,
          fontWeight: 500,
          fill: INK,
          width: "fill-parent",
          inputBehavior: "wrap",
          placeholderProps: { fill: "#A39D90" },
          inputFrameProps: {
            fill: "#FFFFFF",
            stroke: "#BDB7A9",
            strokeWidth: 1.5,
            cornerRadius: 10,
            padding: { vertical: 13, horizontal: 14 },
            hoverStyle: { stroke: INK }
          }
        }
      )), multi ? null : /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fill: MUTED }, t.orPick), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 6, wrap: true }, t.suggestions.map((s) => /* @__PURE__ */ figma.widget.h(Chip, { key: s, label: s, active: question === s, onClick: () => chooseQuestion(s) })))), /* @__PURE__ */ figma.widget.h(Hint, null, ideas > 0 ? t.lateInJar(ideas) : multi ? t.hintColumns : t.hintSingle), /* @__PURE__ */ figma.widget.h(Button, { label: t.start(round), onClick: start })) : /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 14, horizontalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 20, fontWeight: 700, fill: INK, width: "fill-parent", horizontalAlignText: "center" }, title), phase === "open" ? (
        // El número de ideas sale del tarro como un bocadillo, arriba a la derecha.
        /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", height: 200 }, /* @__PURE__ */ figma.widget.h(SVG, { src: jarSvg(ideas, false), width: 170, height: 200, positioning: "absolute", x: 111, y: 0 }), ideas > 0 ? /* @__PURE__ */ figma.widget.h(AutoLayout, { positioning: "absolute", x: 234, y: 4, height: 48 }, /* @__PURE__ */ figma.widget.h(AutoLayout, { padding: { vertical: 7, horizontal: 12 }, cornerRadius: 14, fill: "#FFFFFF", stroke: "#D8D4CA", strokeWidth: 1.5 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fontWeight: 700, fill: INK }, t.ideas(ideas))), /* @__PURE__ */ figma.widget.h(SVG, { src: BUBBLE_TAIL, width: 14, height: 10, positioning: "absolute", x: 10, y: 33 })) : null)
      ) : /* @__PURE__ */ figma.widget.h(SVG, { src: jarSvg(ideas, phase === "revealed"), width: 170, height: 200 }), multi && !revealedCounts ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", spacing: 12, wrap: true, horizontalAlignItems: "center" }, format.columns.map((c) => /* @__PURE__ */ figma.widget.h(ColumnTag, { key: c.id, column: c }))) : null),
      phase === "open" ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 12, horizontalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", spacing: 4, horizontalAlignItems: "center", width: "fill-parent" }, !present && writers > 0 ? /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: MUTED }, t.people(writers)) : null, present ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 6, horizontalAlignItems: "center", padding: { vertical: 2 } }, /* @__PURE__ */ figma.widget.h(AutoLayout, { width: 200, height: 6, cornerRadius: 3, fill: "#EEEAE0" }, writers ? /* @__PURE__ */ figma.widget.h(AutoLayout, { width: Math.max(6, Math.round(200 * Math.min(writers, present) / Math.max(present, writers))), height: 6, cornerRadius: 3, fill: INK }) : null), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: MUTED }, t.wroteOf(writers, Math.max(present, writers)))) : null), /* @__PURE__ */ figma.widget.h(Button, { label: t.write, onClick: writeIdea }), /* @__PURE__ */ figma.widget.h(Button, { label: t.open, tone: "secondary", onClick: () => openJar(false) }), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", spacing: 6, verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fill: MUTED }, t.timer), TIMER_MINUTES.map((m) => /* @__PURE__ */ figma.widget.h(Chip, { key: `t${m}`, label: `${m} min`, active: false, onClick: () => startTimer(m) })))) : null,
      phase === "confirm" ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 12 }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", padding: 14, spacing: 4, cornerRadius: 12, fill: "#FFF1D6" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, fontWeight: 600, fill: "#8A5300" }, writers === 0 ? t.nobodyWrote : t.onlyWrote(writers)), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: "#8A5300", width: "fill-parent", lineHeight: 19 }, t.easyToGuess(MIN_PEOPLE))), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Button, { label: t.wait, tone: "secondary", onClick: keepWaiting }), /* @__PURE__ */ figma.widget.h(Button, { label: t.openAnyway, onClick: () => openJar(true) }))) : null,
      phase === "revealed" && reveal ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 12, horizontalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", spacing: 4, horizontalAlignItems: "center", width: "fill-parent" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 16, fontWeight: 600, fill: INK }, t.opened(reveal.count)), multi && revealedCounts ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", spacing: 14, wrap: true, horizontalAlignItems: "center" }, format.columns.map((c) => /* @__PURE__ */ figma.widget.h(ColumnTag, { key: c.id, column: c, count: revealedCounts[c.id] || 0 }))) : null, ideas > 0 ? /* @__PURE__ */ figma.widget.h(Hint, null, t.newIdeas(ideas)) : null), vote && vote.open ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 10, horizontalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(Button, { label: t.vote(MAX_VOTES), onClick: castVotes }), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: MUTED }, t.voters(votes.size)), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Button, { label: t.showIdeas, tone: "secondary", onClick: showIdeas }), /* @__PURE__ */ figma.widget.h(Button, { label: t.closeVote, tone: "secondary", onClick: closeVote }))) : /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 10 }, vote && vote.results ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 6 }, /* @__PURE__ */ figma.widget.h(Label, null, t.topIdeas), vote.results.length ? vote.results.map((r) => /* @__PURE__ */ figma.widget.h(
        AutoLayout,
        {
          key: r.id,
          direction: "horizontal",
          width: "fill-parent",
          spacing: 10,
          padding: { vertical: 8, horizontal: 10 },
          cornerRadius: 8,
          fill: "#F4F2EC",
          hoverStyle: { fill: "#EAE6DB" },
          verticalAlignItems: "center",
          onClick: () => showNote(r.id)
        },
        /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 700, fill: INK }, t.votesCount(r.n)),
        /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: INK, width: "fill-parent", truncate: 2 }, r.t)
      )) : /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: MUTED }, t.noVotes)) : /* @__PURE__ */ figma.widget.h(Button, { label: t.startVote, onClick: startVote }), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Button, { label: t.showIdeas, tone: "secondary", onClick: showIdeas }), /* @__PURE__ */ figma.widget.h(Button, { label: t.newRound, tone: vote && vote.results ? "primary" : "secondary", onClick: newRound })))) : null,
      facilitator ? /* @__PURE__ */ figma.widget.h(Text, { fontSize: 12, fill: MUTED }, t.ledBy(facilitator.name)) : null
    );
  }
  widget.register(HushJar);
})();
