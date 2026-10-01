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

  // widget-src/code.tsx
  var { widget } = figma;
  var { AutoLayout, Text, useSyncedMap, useSyncedState, usePropertyMenu, useWidgetNodeId } = widget;
  var NS = "hushjar_lab";
  var LAB_VERSION = "0.3.0";
  var WIDTH = 760;
  var OPEN_COUNT = 150;
  var LOAD_COUNT = 1e3;
  var TIMER_SECONDS = 10;
  var VERDICT_STYLE = {
    pass: { fg: "#0B6B2E", bg: "#E3F5E8", dot: "#1E9E4A", icon: "\u2705" },
    fail: { fg: "#A1161B", bg: "#FDE7E7", dot: "#D93A3A", icon: "\u274C" },
    warn: { fg: "#8A5300", bg: "#FFF1D6", dot: "#E39B1B", icon: "\u26A0\uFE0F" },
    info: { fg: "#1C4E9C", bg: "#E6EEFB", dot: "#3D7BE0", icon: "\u2139\uFE0F" },
    todo: { fg: "#4B2E8C", bg: "#EFE9FB", dot: "#B9A6F5", icon: "\u{1F449}" }
  };
  var TONE_STYLE = {
    neutral: { fill: "#FFFFFF", hover: "#F0F0EC", text: "#1D1D1F", stroke: "#CFCFC8" },
    primary: { fill: "#1D1D1F", hover: "#3A3A3C", text: "#FFFFFF", stroke: "#1D1D1F" },
    good: { fill: "#E3F5E8", hover: "#CDEBD6", text: "#0B6B2E", stroke: "#9CD3AE" },
    bad: { fill: "#FDE7E7", hover: "#F8CFCF", text: "#A1161B", stroke: "#EBA3A5" }
  };
  var TIMER_EVENTS = ["timerstart", "timerstop", "timerpause", "timerresume", "timeradjust", "timerdone"];
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function hex(length) {
    let out = "";
    for (let i = 0; i < length; i++) out += Math.floor(Math.random() * 16).toString(16);
    return out;
  }
  function errMsg(e) {
    return e instanceof Error ? e.message : String(e);
  }
  function sessionId() {
    return figma.currentUser ? figma.currentUser.sessionId : -1;
  }
  function whoAmI() {
    const user = figma.currentUser;
    return user ? `${user.name}#${user.sessionId}` : "desconocido";
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
  function thousands(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function seconds(ms) {
    return `${(ms / 1e3).toFixed(1).replace(".", ",")} s`;
  }
  function openPanel(options) {
    return new Promise((resolve) => {
      figma.showUI(__html__, options);
      figma.ui.onmessage = (msg) => {
        if (msg && msg.type === "ready") resolve(msg.probe);
      };
    });
  }
  function waitForPanelClose() {
    return new Promise((resolve) => {
      figma.ui.onmessage = (msg) => {
        if (msg && msg.type === "close") resolve();
      };
    });
  }
  function Button(props) {
    const tone = TONE_STYLE[props.tone || "neutral"];
    return /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        padding: { vertical: 9, horizontal: 14 },
        cornerRadius: 8,
        fill: tone.fill,
        stroke: tone.stroke,
        hoverStyle: { fill: tone.hover },
        onClick: props.run
      },
      /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, fontWeight: 600, fill: tone.text }, props.label)
    );
  }
  function VerdictBox(props) {
    const style = VERDICT_STYLE[props.verdict.status];
    return /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", padding: 16, spacing: 10, cornerRadius: 12, fill: style.bg }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 16 }, style.icon), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fill: style.fg, width: "fill-parent", lineHeight: 22 }, props.verdict.text));
  }
  function SpikeLab() {
    const widgetNodeId = useWidgetNodeId();
    const results = useSyncedMap("results");
    const jar = useSyncedMap("jar");
    const mini = useSyncedMap("mini");
    const load = useSyncedMap("load");
    const [step, setStep] = useSyncedState("step", 0);
    const [miniStatus, setMiniStatus] = useSyncedState("miniStatus", "vac\xEDo");
    const [homeNodeId, setHomeNodeId] = useSyncedState("homeNodeId", "");
    const [copyProbe, setCopyProbe] = useSyncedState("copyProbe", []);
    const [refs, setRefs] = useSyncedState("refs", {});
    const isCopy = homeNodeId !== "" && homeNodeId !== widgetNodeId;
    async function record(key, status, summary, data) {
      const result = { status, summary, at: (/* @__PURE__ */ new Date()).toISOString(), by: whoAmI() };
      if (data !== void 0) result.data = data;
      results.set(key, result);
      console.log(`[HushJarLab] ${key} \xB7 ${status} \xB7 ${summary}`);
      try {
        const node = await figma.getNodeByIdAsync(widgetNodeId);
        if (node) node.setSharedPluginData(NS, key, JSON.stringify(result));
      } catch (e) {
        console.warn("[HushJarLab] no se pudo replicar en sharedPluginData", e);
      }
    }
    function guard(stepKey, run) {
      return async () => {
        try {
          await run();
        } catch (e) {
          await record(`${stepKey}.error`, "fail", errMsg(e));
        }
      };
    }
    async function widgetBox() {
      const node = await figma.getNodeByIdAsync(widgetNodeId);
      if (!node || node.type !== "WIDGET") throw new Error("No encuentro el nodo del widget");
      const box = node.absoluteBoundingBox;
      return box ? box : { x: node.x, y: node.y, width: node.width, height: node.height };
    }
    async function freshSection(key, name, side, width, height) {
      const previous = refs[key] ? await figma.getNodeByIdAsync(refs[key]) : null;
      if (previous && previous.type === "SECTION") previous.remove();
      const box = await widgetBox();
      const section = figma.createSection();
      section.name = name;
      section.x = side === "right" ? box.x + box.width + 160 : box.x - width - 160;
      section.y = box.y;
      section.resizeWithoutConstraints(width, height);
      setRefs((prev) => __spreadProps(__spreadValues({}, prev), { [key]: section.id }));
      return section;
    }
    async function sectionById(key) {
      const node = refs[key] ? await figma.getNodeByIdAsync(refs[key]) : null;
      return node && node.type === "SECTION" ? node : null;
    }
    async function writeIdea() {
      const session = sessionId();
      await openPanel({ title: "Tu idea \xB7 solo la ves t\xFA", width: 360, height: 300 });
      figma.ui.postMessage({
        type: "log",
        text: "Escribe una idea y pulsa \xABSellar\xBB. Se guardar\xE1 en el tarro dentro de unos segundos, al azar, para que nadie sepa qui\xE9n la escribi\xF3 por el momento en que aparece."
      });
      figma.ui.postMessage({ type: "compose" });
      let pendingText = "";
      let attempt = "";
      let sealedAt = 0;
      let written = false;
      let writeTimer = 0;
      const write = (how) => {
        if (written || !pendingText) return;
        written = true;
        jar.set(hex(24), { c: 0, t: pendingText });
        void record(`privado.guardado.${attempt}`, "pass", `Guardada ${how}, ${seconds(Date.now() - sealedAt)} despu\xE9s de sellar. Tarro: ${jar.size}.`, { how, session });
      };
      const onClose = () => write("al cerrar la ventana");
      figma.on("close", onClose);
      await new Promise((resolve) => {
        figma.ui.onmessage = (msg) => {
          if (!msg) return;
          if (msg.type === "seal" && !pendingText) {
            pendingText = String(msg.text).slice(0, 280);
            attempt = hex(6);
            sealedAt = Date.now();
            void record(`privado.sellado.${attempt}`, "info", `Sellada por la sesi\xF3n ${session}; pendiente de guardar.`, { session });
            const delay = 3e3 + Math.floor(Math.random() * 5e3);
            figma.ui.postMessage({ type: "log", text: `Sellando\u2026 se guardar\xE1 dentro de ${Math.round(delay / 1e3)} s.` });
            writeTimer = setTimeout(() => {
              write("con retraso");
              figma.ui.postMessage({ type: "log", text: "Sellado \u2713" });
              setTimeout(resolve, 1500);
            }, delay);
          }
          if (msg.type === "close") {
            clearTimeout(writeTimer);
            write("al pulsar Cerrar");
            resolve();
          }
        };
      });
      figma.off("close", onClose);
    }
    async function checkIdeas() {
      await record("privado.comprobar", "info", `Comprobado. Tarro: ${jar.size} ideas.`, { jar: jar.size });
    }
    async function fillJar() {
      for (const key of mini.keys()) mini.delete(key);
      for (let i = 0; i < OPEN_COUNT; i++) mini.set(hex(24), { c: i % 4, t: `Idea de prueba ${i + 1}` });
      setMiniStatus("cerrado");
      await record("apertura.llenar", "info", `Tarro con ${OPEN_COUNT} papelitos en el mapa \xABmini\xBB.`);
    }
    async function openJar() {
      const entries = shuffle(mini.entries());
      if (!entries.length) {
        await record("apertura.abrir", "todo", "Tarro vac\xEDo al abrir.", { empty: true });
        return;
      }
      const cols = 15;
      const section = await freshSection("apertura", "Prueba \xB7 Tarro abierto", "left", cols * 260 + 80, Math.ceil(entries.length / cols) * 260 + 120);
      const t0 = Date.now();
      const probe = figma.createSticky();
      await figma.loadFontAsync(probe.text.fontName);
      probe.remove();
      for (let i = 0; i < entries.length; i++) {
        const [key, slip] = entries[i];
        const sticky = figma.createSticky();
        section.appendChild(sticky);
        sticky.x = 40 + i % cols * 260;
        sticky.y = 80 + Math.floor(i / cols) * 260;
        sticky.text.characters = slip.t;
        sticky.authorVisible = false;
        mini.delete(key);
      }
      const ms = Date.now() - t0;
      setMiniStatus("abierto");
      await record("apertura.abrir", ms < 3e3 ? "pass" : ms < 8e3 ? "warn" : "fail", `${entries.length} stickies en ${ms} ms; mapa vaciado.`, { n: entries.length, ms });
    }
    async function checkUndo() {
      const opened = results.get("apertura.abrir");
      const n = opened && opened.data && opened.data.n ? opened.data.n : OPEN_COUNT;
      const section = await sectionById("apertura");
      const left = section ? section.children.filter((c) => c.type === "STICKY").length : 0;
      await record(
        "apertura.deshacer",
        "info",
        `Tras Ctrl+Z: ${left}/${n} stickies, ${mini.size} papelitos en el mapa, estado \xAB${miniStatus}\xBB, secci\xF3n ${section ? "presente" : "borrada"}.`,
        { n, left, slips: mini.size, status: miniStatus, section: !!section }
      );
    }
    async function tryTimer() {
      const timer = figma.timer;
      if (!timer) {
        await record("temporizador.resultado", "fail", "figma.timer no existe dentro del widget.", { reason: "no-api" });
        return;
      }
      const t0 = Date.now();
      const events = [];
      const handlers = TIMER_EVENTS.map((type) => {
        const handler = () => {
          events.push(`${type}@${((Date.now() - t0) / 1e3).toFixed(1)}s`);
        };
        figma.on(type, handler);
        return { type, handler };
      });
      const unsubscribe = () => handlers.forEach(({ type, handler }) => figma.off(type, handler));
      await openPanel({ title: "Probando el temporizador", width: 320, height: 160 });
      figma.ui.postMessage({ type: "countdown", seconds: TIMER_SECONDS });
      try {
        timer.start(TIMER_SECONDS);
      } catch (e) {
        unsubscribe();
        await record("temporizador.resultado", "fail", `timer.start lanz\xF3: ${errMsg(e)}`, { reason: "start" });
        return;
      }
      await record("temporizador.api", "info", `timer.start(${TIMER_SECONDS}) sin error: state=${timer.state}, remaining=${timer.remaining}, total=${timer.total}.`);
      const outcome = await new Promise((resolve) => {
        let done2 = false;
        let poll = 0;
        let limit = 0;
        const finish = (reason) => {
          if (done2) return;
          done2 = true;
          clearInterval(poll);
          clearTimeout(limit);
          resolve(reason);
        };
        poll = setInterval(() => {
          if (events.some((e) => e.indexOf("timerdone") === 0)) finish("done");
        }, 250);
        limit = setTimeout(() => finish("timeout"), (TIMER_SECONDS + 25) * 1e3);
        figma.ui.onmessage = (msg) => {
          if (msg && msg.type === "close") finish("closed");
        };
      });
      await sleep(1500);
      unsubscribe();
      await record(
        "temporizador.resultado",
        outcome === "done" ? "pass" : "fail",
        `${outcome}. Eventos: ${events.join(", ") || "ninguno"}. Estado final: state=${timer.state}, remaining=${timer.remaining}.`,
        { reason: outcome, events, finalState: timer.state }
      );
    }
    async function loadMany() {
      for (const key of load.keys()) load.delete(key);
      const t0 = Date.now();
      let error = "";
      try {
        for (let i = 0; i < LOAD_COUNT; i++) load.set(hex(24), { c: i % 4, t: "x".repeat(280) });
      } catch (e) {
        error = errMsg(e);
      }
      const ms = Date.now() - t0;
      const kb = Math.round(load.size * 324 / 1024);
      await record(
        "carga.meter",
        error ? "fail" : ms < 3e3 ? "pass" : "warn",
        `${load.size}/${LOAD_COUNT} papelitos de 280 caracteres (~${kb} kB) en ${ms} ms.${error ? ` Error: ${error}` : ""}`,
        { stored: load.size, ms, kb, error }
      );
    }
    async function clearMany() {
      const t0 = Date.now();
      const n = load.size;
      for (const key of load.keys()) load.delete(key);
      await record("carga.vaciar", "info", `${n} papelitos borrados en ${Date.now() - t0} ms.`, { n, ms: Date.now() - t0 });
    }
    async function markOriginal() {
      setHomeNodeId(widgetNodeId);
      setCopyProbe(["Idea sellada 1", "Idea sellada 2", "Idea sellada 3"]);
      await record("copias.marcar", "info", `Original = ${widgetNodeId}; 3 ideas de prueba en copyProbe.`);
    }
    async function otherLabs() {
      await figma.currentPage.loadAsync();
      return figma.currentPage.findWidgetNodesByWidgetId(figma.widgetId || "").filter((n) => n.id !== widgetNodeId);
    }
    async function findCopies() {
      if (!homeNodeId) {
        await record("copias.buscar", "todo", "No hay original marcado.", { reason: "unmarked" });
        return;
      }
      if (isCopy) {
        await record("copias.buscar", "todo", "Pulsado en la copia.", { reason: "in-copy" });
        return;
      }
      const copies = await otherLabs();
      const info = copies.map((n) => {
        const state = n.widgetSyncedState;
        return { id: n.id, keys: Object.keys(state), home: state.homeNodeId, carries: JSON.stringify(state).indexOf("Idea sellada") >= 0 };
      });
      await record("copias.buscar", copies.length ? "pass" : "todo", `${copies.length} copias: ${JSON.stringify(info)}`, {
        copies: copies.length,
        carries: info.some((i) => i.carries),
        info
      });
    }
    async function wipeCopies() {
      if (isCopy) {
        await record("copias.buscar", "todo", "Pulsado en la copia.", { reason: "in-copy" });
        return;
      }
      const copies = await otherLabs();
      const errors = [];
      let wiped = 0;
      for (const copy of copies) {
        try {
          copy.setWidgetSyncedState({}, {});
          if (JSON.stringify(copy.widgetSyncedState).indexOf("Idea sellada") < 0) wiped++;
          copy.remove();
        } catch (e) {
          errors.push(errMsg(e));
        }
      }
      await record("copias.vaciar", errors.length || wiped < copies.length ? "fail" : "pass", `${wiped}/${copies.length} copias vaciadas y borradas.${errors.length ? ` Errores: ${errors.join("; ")}` : ""}`, {
        copies: copies.length,
        wiped,
        errors
      });
    }
    async function saveMark() {
      const user = figma.currentUser;
      const mark = { token: hex(24), id: user ? user.id : null, session: sessionId(), at: (/* @__PURE__ */ new Date()).toISOString() };
      await figma.clientStorage.setAsync("lab:mark", mark);
      const iframe = await openPanel({ visible: false });
      const env = {
        setTimeout: typeof setTimeout,
        setInterval: typeof setInterval,
        crypto: typeof crypto,
        TextEncoder: typeof TextEncoder,
        editorType: figma.editorType,
        widgetId: figma.widgetId,
        apiVersion: figma.apiVersion,
        timer: !!figma.timer
      };
      const active = figma.activeUsers.map((a) => ({ id: a.id, name: a.name, sessionId: a.sessionId }));
      await record("memoria.guardar", "info", `Marca guardada: id ${mark.id}, sesi\xF3n ${mark.session}. crypto en el widget: ${env.crypto}; en el iframe: ${JSON.stringify(iframe)}.`, {
        mark,
        env,
        iframe,
        active
      });
    }
    async function checkMark() {
      const user = figma.currentUser;
      const session = sessionId();
      const mark = await figma.clientStorage.getAsync("lab:mark");
      if (!mark) {
        await record("memoria.comprobar", "fail", "No hay marca en clientStorage.", { reason: "missing", session });
        return;
      }
      if (mark.session === session) {
        await record("memoria.comprobar", "todo", `Misma sesi\xF3n (${session}): no parece que se haya recargado.`, { reason: "same-session", session });
        return;
      }
      const sameId = !!user && mark.id === user.id;
      await record(
        "memoria.comprobar",
        sameId ? "pass" : "warn",
        `Marca de la sesi\xF3n ${mark.session} le\xEDda en la sesi\xF3n ${session}. id antes ${mark.id}, ahora ${user ? user.id : null}.`,
        { reason: sameId ? "ok" : "id-changed", before: mark.id, now: user ? user.id : null, session }
      );
    }
    async function exportAll() {
      const all2 = {};
      for (const [key, value] of results.entries()) all2[key] = value;
      await openPanel({ title: "Resultados del laboratorio", width: 480, height: 400 });
      figma.ui.postMessage({ type: "log", text: "Copia el texto (Ctrl+C) y p\xE9galo en el chat si Claude te lo pide." });
      figma.ui.postMessage({ type: "export", text: JSON.stringify({ version: LAB_VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), results: all2 }, null, 2) });
      await waitForPanelClose();
    }
    async function resetAll() {
      for (const key of Object.keys(refs)) {
        const node2 = await figma.getNodeByIdAsync(refs[key]);
        if (node2 && node2.type === "SECTION") node2.remove();
      }
      setRefs({});
      const node = await figma.getNodeByIdAsync(widgetNodeId);
      if (node) for (const key of node.getSharedPluginDataKeys(NS)) node.setSharedPluginData(NS, key, "");
      for (const map of [results, jar, mini, load]) for (const key of map.keys()) map.delete(key);
      setStep(0);
      setMiniStatus("vac\xEDo");
      setHomeNodeId("");
      setCopyProbe([]);
    }
    usePropertyMenu(
      [
        { itemType: "action", propertyName: "export", tooltip: "Exportar resultados" },
        { itemType: "action", propertyName: "reset", tooltip: "Empezar de cero" }
      ],
      async ({ propertyName }) => {
        if (propertyName === "export") await exportAll();
        if (propertyName === "reset") await resetAll();
      }
    );
    const all = results.entries();
    const withPrefix = (prefix) => all.filter(([key]) => key.indexOf(prefix) === 0);
    function withError(key, verdict) {
      const error = results.get(`${key}.error`);
      if (!error) return verdict;
      const latest = withPrefix(`${key}.`).filter(([k]) => k !== `${key}.error`).reduce((max, [, r]) => r.at > max ? r.at : max, "");
      if (latest && latest > error.at) return verdict;
      return { status: "fail", text: `Algo ha fallado: \xAB${error.summary}\xBB. D\xEDselo a Claude en el chat.` };
    }
    function privateVerdict() {
      const sealed = withPrefix("privado.sellado.");
      if (!sealed.length) return null;
      const savedFor = (sealedKey) => results.get(`privado.guardado.${sealedKey.slice("privado.sellado.".length)}`);
      const check = results.get("privado.comprobar");
      const lost = sealed.filter(([k, r]) => !savedFor(k) && check && r.at < check.at);
      const pending = sealed.filter(([k, r]) => !savedFor(k) && (!check || r.at >= check.at));
      const saved = withPrefix("privado.guardado.");
      const savedOnClose = saved.some(([, r]) => r.data && r.data.how === "al cerrar la ventana");
      if (lost.length) {
        return {
          status: "fail",
          text: `Se ha perdido ${lost.length === 1 ? "una idea" : `${lost.length} ideas`} al cerrar la ventanita justo despu\xE9s de sellar. Es importante: en Hush Jar la idea se guardar\xE1 al momento si alguien cierra la ventanita.`
        };
      }
      if (pending.length) return { status: "todo", text: "Tu idea se est\xE1 guardando. Si ya has cerrado la ventanita, pulsa \xABComprobar\xBB." };
      if (savedOnClose) return { status: "pass", text: "Las ideas se guardan siempre, tambi\xE9n si cierras la ventanita nada m\xE1s sellar. El retraso al azar funciona." };
      return { status: "todo", text: "La idea se ha guardado. Ahora repite, pero cierra la ventanita con la X nada m\xE1s pulsar \xABSellar\xBB, y luego pulsa \xABComprobar\xBB." };
    }
    function openVerdict() {
      const fill = results.get("apertura.llenar");
      const open = results.get("apertura.abrir");
      const undo = results.get("apertura.deshacer");
      if (undo && undo.data && (!open || undo.at >= open.at)) {
        const { n, left, slips } = undo.data;
        const time = open && open.data && open.data.ms !== void 0 ? `Sac\xF3 ${n} ideas en ${seconds(open.data.ms)}. ` : "";
        if (left === 0 && slips === n) return { status: "pass", text: `${time}Un Ctrl+Z deshace la apertura entera: las ideas vuelven al tarro y no se pierde ninguna.` };
        if (left === 0 && slips === 0)
          return { status: "fail", text: `${time}Ctrl+Z borra las notas pero las ideas no vuelven al tarro, as\xED que se perder\xEDan. Hush Jar tendr\xE1 que avisar antes de deshacer.` };
        if (left === n && slips === n)
          return { status: "warn", text: `${time}Ctrl+Z vuelve a llenar el tarro pero deja las notas: al abrirlo otra vez saldr\xEDan repetidas. Lo evitaremos marcando las ideas ya abiertas.` };
        if (left === n && slips === 0)
          return { status: "todo", text: `${time}Ctrl+Z no ha cambiado nada. Vuelve a llenar y abrir el tarro, y pulsa Ctrl+Z justo despu\xE9s, sin hacer clic en otra cosa.` };
        return { status: "warn", text: `${time}Ctrl+Z solo deshizo una parte: quedan ${left} de ${n} notas y ${slips} ideas en el tarro.` };
      }
      if (open && open.data && open.data.empty) return { status: "todo", text: "El tarro estaba vac\xEDo. Pulsa primero \xABLlenar el tarro\xBB." };
      if (open && open.data) {
        const slow = open.data.ms >= 3e3 ? " Es lento: el tarro abrir\xE1 las ideas por tandas." : "";
        return { status: "todo", text: `Sac\xF3 ${open.data.n} ideas en ${seconds(open.data.ms)}.${slow} Ahora pulsa Ctrl+Z una vez y despu\xE9s \xABYa he pulsado Ctrl+Z\xBB.` };
      }
      if (fill) return { status: "todo", text: "El tarro est\xE1 lleno. Ahora pulsa \xABAbrir el tarro\xBB." };
      return null;
    }
    function timerVerdict() {
      const result = results.get("temporizador.resultado");
      const started = results.get("temporizador.api");
      if (result && result.data && (!started || result.at >= started.at)) {
        const reason = result.data.reason;
        if (reason === "done") return { status: "pass", text: "S\xED: el tarro puede poner en marcha el temporizador de FigJam y enterarse de cu\xE1ndo termina la ronda." };
        if (reason === "closed") return { status: "todo", text: "Cerraste la ventanita antes de que terminara. Vuelve a probar y espera sin tocar nada." };
        if (reason === "timeout")
          return { status: "warn", text: "El temporizador arranc\xF3, pero el tarro no se enter\xF3 de cu\xE1ndo terminaba. Hush Jar lo comprobar\xE1 en el siguiente clic." };
        return { status: "fail", text: "El tarro no puede usar el temporizador de FigJam. Hush Jar llevar\xE1 su propia cuenta atr\xE1s." };
      }
      if (started) return { status: "todo", text: "Esperando a que termine el temporizador\u2026 No toques nada." };
      return null;
    }
    function loadVerdict() {
      const put = results.get("carga.meter");
      const clear = results.get("carga.vaciar");
      if (!put || !put.data) return null;
      if (put.data.error) return { status: "fail", text: `No pudo guardar tantas ideas (se atasc\xF3 en ${thousands(put.data.stored)}). Hush Jar pondr\xE1 un l\xEDmite m\xE1s bajo.` };
      const base = `Aguanta ${thousands(put.data.stored)} ideas largas: tard\xF3 ${seconds(put.data.ms)} en guardarlas.`;
      if (put.data.ms >= 3e3) return { status: "warn", text: `${base} Es algo lento, as\xED que Hush Jar pondr\xE1 un l\xEDmite por sesi\xF3n.` };
      if (!clear || clear.at < put.at) return { status: "todo", text: `${base} Mira si el laboratorio sigue yendo fluido y pulsa \xABVaciar\xBB.` };
      return { status: "pass", text: `${base} Un tarro normal (menos de 300 ideas) no tendr\xE1 problema.` };
    }
    function copiesVerdict() {
      const mark = results.get("copias.marcar");
      const find = results.get("copias.buscar");
      const wipe = results.get("copias.vaciar");
      if (wipe && wipe.data && (!find || wipe.at >= find.at)) {
        if (wipe.data.copies === 0) return { status: "todo", text: "No hab\xEDa copias que vaciar. Duplica el laboratorio (Ctrl+D) y vuelve a buscar." };
        return wipe.status === "pass" ? { status: "pass", text: "Se detectan las copias y el original puede vaciarlas y borrarlas. Nadie podr\xE1 abrir las ideas de otras personas en una copia." } : { status: "warn", text: "Se detectan las copias, pero el original no pudo vaciarlas. Hush Jar har\xE1 que cada copia se vac\xEDe sola en cuanto alguien la toque." };
      }
      if (find && find.data) {
        if (find.data.reason === "in-copy") return { status: "todo", text: "Has pulsado en la copia. Pulsa \xABBuscar copias\xBB en el laboratorio original." };
        if (find.data.reason === "unmarked") return { status: "todo", text: "Primero pulsa \xABMarcar como original\xBB." };
        if (find.data.copies > 0) {
          const carries = find.data.carries ? "se lleva las ideas selladas del original" : "no se lleva las ideas selladas";
          return { status: "todo", text: `Encontrada: la copia ${carries}. Ahora pulsa \xABVaciar y borrar copias\xBB.` };
        }
        return { status: "todo", text: "No encuentro ninguna copia. Selecciona el laboratorio y pulsa Ctrl+D." };
      }
      if (mark) return { status: "todo", text: "Ahora duplica el laboratorio: selecci\xF3nalo y pulsa Ctrl+D." };
      return null;
    }
    function memoryVerdict() {
      const check = results.get("memoria.comprobar");
      const saved = results.get("memoria.guardar");
      if (check && check.data && (!saved || check.at >= saved.at)) {
        const reason = check.data.reason;
        if (reason === "ok")
          return { status: "pass", text: "Te reconoce al volver. Hush Jar podr\xE1 recordar qu\xE9 ideas son tuyas para que las edites o las retires, sin guardar tu nombre junto a ellas." };
        if (reason === "same-session") return { status: "todo", text: "Parece que no has recargado. Cierra la pesta\xF1a de este tablero, vuelve a abrirlo y pulsa \xABYa he vuelto\xBB." };
        if (reason === "missing") return { status: "fail", text: "No te reconoce al volver. Solo podr\xE1s editar tus ideas mientras tengas la ventanita abierta." };
        return { status: "warn", text: "Te reconoce, pero tu identificador de usuario cambi\xF3 al volver. Hush Jar usar\xE1 la marca guardada y no ese identificador." };
      }
      if (saved) return { status: "todo", text: "Ahora cierra la pesta\xF1a de este tablero, vuelve a abrirlo y pulsa \xABYa he vuelto\xBB." };
      return null;
    }
    const steps = [
      {
        key: "privado",
        title: "Escribe una idea en privado",
        why: "Es el coraz\xF3n de Hush Jar: cada persona escribe en una ventanita que solo ve ella. Comprobamos que la idea llega al tarro aunque se cierre la ventanita enseguida.",
        tasks: [
          {
            text: "Pulsa \xABEscribir una idea\xBB. En la ventanita que se abre, escribe cualquier cosa y pulsa \xABSellar\xBB. Espera a que ponga \xABSellado \u2713\xBB.",
            actions: [{ label: "Escribir una idea", tone: "primary", run: guard("privado", writeIdea) }]
          },
          {
            text: "Repite, pero esta vez cierra la ventanita con la X de arriba a la derecha nada m\xE1s pulsar \xABSellar\xBB.",
            actions: [{ label: "Escribir otra idea", run: guard("privado", writeIdea) }]
          },
          { text: "Pulsa \xABComprobar\xBB.", actions: [{ label: "Comprobar", run: guard("privado", checkIdeas) }] }
        ],
        verdict: withError("privado", privateVerdict()),
        note: `Ideas en el tarro: ${jar.size}`
      },
      {
        key: "apertura",
        title: "Abre un tarro lleno y deshaz",
        why: "Al abrir el tarro salen todas las ideas de golpe como notas. Medimos cu\xE1nto tarda con 150 ideas y qu\xE9 pasa si alguien pulsa Ctrl+Z (deshacer) por error.",
        tasks: [
          { text: "Llena el tarro con 150 ideas de prueba.", actions: [{ label: "Llenar el tarro", tone: "primary", run: guard("apertura", fillJar) }] },
          {
            text: "\xC1brelo. Aparecer\xE1n 150 notas a la izquierda del laboratorio (aleja el zoom si no las ves).",
            actions: [{ label: "Abrir el tarro", run: guard("apertura", openJar) }]
          },
          {
            text: "Pulsa Ctrl+Z (deshacer) una sola vez, sin hacer clic en nada m\xE1s, y despu\xE9s este bot\xF3n.",
            actions: [{ label: "Ya he pulsado Ctrl+Z", run: guard("apertura", checkUndo) }]
          }
        ],
        verdict: withError("apertura", openVerdict()),
        note: `Ideas dentro del tarro de prueba: ${mini.size}`
      },
      {
        key: "temporizador",
        title: "\xBFPuede usar el temporizador de FigJam?",
        why: "Las rondas de escritura duran unos minutos. Lo ideal es usar el temporizador que ya tiene FigJam en vez de inventar otro.",
        tasks: [
          {
            text: `Pulsa el bot\xF3n. Arriba del tablero arrancar\xE1 un temporizador de ${TIMER_SECONDS} segundos y se abrir\xE1 una ventanita.`,
            actions: [{ label: "Probar el temporizador", tone: "primary", run: guard("temporizador", tryTimer) }]
          },
          { text: "Espera a que termine sin hacer clic en nada. La ventanita se cerrar\xE1 sola." }
        ],
        verdict: withError("temporizador", timerVerdict())
      },
      {
        key: "carga",
        title: "\xBFAguanta muchas ideas?",
        why: "En una sesi\xF3n grande puede haber cientos de ideas. Metemos 1.000 ideas largas de golpe para ver si el tarro se atasca.",
        tasks: [
          {
            text: "Pulsa el bot\xF3n y espera unos segundos.",
            actions: [{ label: "Meter 1.000 ideas", tone: "primary", run: guard("carga", loadMany) }]
          },
          { text: "Mueve un poco el laboratorio para ver si va fluido y pulsa \xABVaciar\xBB.", actions: [{ label: "Vaciar", run: guard("carga", clearMany) }] }
        ],
        verdict: withError("carga", loadVerdict()),
        note: `Ideas de prueba ahora: ${load.size}`
      },
      {
        key: "copias",
        title: "\xBFQu\xE9 pasa si alguien duplica el tarro?",
        why: "Si alguien copia un tarro sellado, la copia no deber\xEDa servir para abrir las ideas de otras personas.",
        tasks: [
          { text: "Marca este laboratorio como el original.", actions: [{ label: "Marcar como original", tone: "primary", run: guard("copias", markOriginal) }] },
          { text: "Dupl\xEDcalo: haz clic en el borde del laboratorio para seleccionarlo y pulsa Ctrl+D." },
          {
            text: "En el laboratorio original, pulsa \xABBuscar copias\xBB y despu\xE9s \xABVaciar y borrar copias\xBB.",
            actions: [
              { label: "Buscar copias", run: guard("copias", findCopies) },
              { label: "Vaciar y borrar copias", run: guard("copias", wipeCopies) }
            ]
          }
        ],
        verdict: withError("copias", copiesVerdict())
      },
      {
        key: "memoria",
        title: "\xBFTe reconoce cuando vuelves?",
        why: "Para que puedas editar o retirar tu idea m\xE1s tarde, el tarro tiene que reconocerte al volver, sin guardar tu nombre junto a la idea.",
        tasks: [
          { text: "Guarda una marca en este ordenador.", actions: [{ label: "Guardar mi marca", tone: "primary", run: guard("memoria", saveMark) }] },
          { text: "Cierra la pesta\xF1a de este tablero y vuelve a abrirlo." },
          { text: "Pulsa el bot\xF3n.", actions: [{ label: "Ya he vuelto", run: guard("memoria", checkMark) }] }
        ],
        verdict: withError("memoria", memoryVerdict())
      }
    ];
    const current = Math.max(0, Math.min(step, steps.length));
    const isSummary = current === steps.length;
    const isFinished = (s) => !!s.verdict && s.verdict.status !== "todo";
    const done = steps.filter(isFinished).length;
    const allDone = done === steps.length;
    const firstPending = steps.findIndex((s) => !isFinished(s));
    const currentDone = !isSummary && isFinished(steps[current]);
    const isLast = current === steps.length - 1;
    return /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: WIDTH, padding: 32, spacing: 24, fill: "#FFFFFF", cornerRadius: 20, stroke: "#E4E4DE", strokeWidth: 1.5 }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 14, verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 36 }, "\u{1FAD9}"), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", spacing: 4, width: "fill-parent" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 24, fontWeight: 700, fill: "#1D1D1F" }, "Laboratorio de Hush Jar"), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, fill: "#6B6B66", width: "fill-parent", lineHeight: 20 }, "Seis pruebas cortas para comprobar que FigJam deja hacer lo que Hush Jar necesita. En cada una, pulsa los botones de \xABQu\xE9 tienes que hacer\xBB y espera al resultado."))), isCopy ? /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", padding: 12, cornerRadius: 10, fill: "#FFF1D6" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, fill: "#8A5300", width: "fill-parent" }, "\u{1F4CE} Esto es una copia del laboratorio. Vuelve al original para seguir.")) : null, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: "auto", verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", spacing: 8, verticalAlignItems: "center" }, steps.map((s, i) => /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        key: s.key,
        width: i === current ? 30 : 14,
        height: 14,
        cornerRadius: 7,
        fill: s.verdict && s.verdict.status !== "todo" ? VERDICT_STYLE[s.verdict.status].dot : "#E2E2DC",
        stroke: i === current ? "#1D1D1F" : void 0,
        strokeWidth: 2,
        onClick: async () => setStep(i)
      }
    )), /* @__PURE__ */ figma.widget.h(
      AutoLayout,
      {
        width: isSummary ? 30 : 14,
        height: 14,
        cornerRadius: 7,
        fill: done === steps.length ? "#1D1D1F" : "#E2E2DC",
        stroke: isSummary ? "#1D1D1F" : void 0,
        strokeWidth: 2,
        onClick: async () => setStep(steps.length)
      }
    )), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: "#8A8A85" }, done, " de ", steps.length, " pruebas hechas")), isSummary ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 14 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 24, fontWeight: 700, fill: "#1D1D1F" }, "Resumen"), steps.map((s, i) => /* @__PURE__ */ figma.widget.h(AutoLayout, { key: s.key, direction: "vertical", width: "fill-parent", spacing: 6 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fontWeight: 700, fill: "#1D1D1F" }, i + 1, ". ", s.title), s.verdict ? /* @__PURE__ */ figma.widget.h(VerdictBox, { verdict: s.verdict }) : /* @__PURE__ */ figma.widget.h(Text, { fontSize: 14, fill: "#8A8A85" }, "Sin hacer todav\xEDa."))), allDone ? /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", padding: 18, cornerRadius: 12, fill: "#1D1D1F" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fill: "#FFFFFF", width: "fill-parent", lineHeight: 22 }, "\xA1Hecho! \xDAltimo paso: abre el plugin \xABFigma Desktop Bridge\xBB (men\xFA principal \u2192 Plugins \u2192 Desarrollo) y escribe \xABlisto\xBB en el chat. Claude leer\xE1 los resultados y te dir\xE1 qu\xE9 significan.")) : /* @__PURE__ */ figma.widget.h(AutoLayout, { width: "fill-parent", padding: 18, cornerRadius: 12, fill: "#FFF1D6" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fill: "#8A5300", width: "fill-parent", lineHeight: 22 }, steps.length - done === 1 ? "Te falta 1 prueba." : `Te faltan ${steps.length - done} pruebas.`, " Pulsa \xABIr a la prueba que falta\xBB y haz sus pasos: cuando aparezca el resultado, sigue con la siguiente."))) : /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 20 }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 8 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 700, fill: "#8A8A85", letterSpacing: 0.5 }, "PRUEBA ", current + 1, " DE ", steps.length), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 26, fontWeight: 700, fill: "#1D1D1F", width: "fill-parent" }, steps[current].title), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fill: "#55554F", width: "fill-parent", lineHeight: 23 }, steps[current].why)), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 16, padding: 20, cornerRadius: 14, fill: "#F6F6F2" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 4 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 700, fill: "#1D1D1F", letterSpacing: 0.5 }, "QU\xC9 TIENES QUE HACER"), /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: "#6B6B66", width: "fill-parent" }, "Haz los pasos en orden. El resultado aparecer\xE1 debajo, en un recuadro de color.")), steps[current].tasks.map((task, i) => /* @__PURE__ */ figma.widget.h(AutoLayout, { key: `${steps[current].key}-${i}`, direction: "horizontal", width: "fill-parent", spacing: 12, verticalAlignItems: "start" }, /* @__PURE__ */ figma.widget.h(AutoLayout, { width: 26, height: 26, cornerRadius: 13, fill: "#1D1D1F", horizontalAlignItems: "center", verticalAlignItems: "center" }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fontWeight: 700, fill: "#FFFFFF" }, i + 1)), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "vertical", width: "fill-parent", spacing: 10 }, /* @__PURE__ */ figma.widget.h(Text, { fontSize: 15, fill: "#1D1D1F", width: "fill-parent", lineHeight: 23 }, task.text), task.actions ? /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: 8, wrap: true }, task.actions.map((action) => /* @__PURE__ */ figma.widget.h(Button, __spreadValues({ key: action.label }, action)))) : null)))), steps[current].note ? /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: "#8A8A85" }, steps[current].note) : null, steps[current].verdict ? /* @__PURE__ */ figma.widget.h(VerdictBox, { verdict: steps[current].verdict }) : null), /* @__PURE__ */ figma.widget.h(AutoLayout, { direction: "horizontal", width: "fill-parent", spacing: "auto", verticalAlignItems: "center" }, current > 0 ? /* @__PURE__ */ figma.widget.h(Button, { label: "\u2190 Anterior", run: async () => setStep(current - 1) }) : /* @__PURE__ */ figma.widget.h(Text, { fontSize: 13, fill: "#B0B0AA" }, "v", LAB_VERSION), isSummary ? allDone ? /* @__PURE__ */ figma.widget.h(Button, { label: "Volver al principio", run: async () => setStep(0) }) : /* @__PURE__ */ figma.widget.h(Button, { label: "Ir a la prueba que falta \u2192", tone: "primary", run: async () => setStep(firstPending) }) : currentDone ? /* @__PURE__ */ figma.widget.h(Button, { label: isLast ? "Ver resumen \u2192" : "Siguiente prueba \u2192", tone: "primary", run: async () => setStep(current + 1) }) : /* @__PURE__ */ figma.widget.h(Button, { label: isLast ? "Saltar y ver resumen" : "Saltar esta prueba", run: async () => setStep(current + 1) })));
  }
  widget.register(SpikeLab);
})();
