# Hush Jar: escritura privada y retro anónima para FigJam

**Pitch de una línea:** cada persona escribe en su propio panel privado. En el tablero solo se ve cómo se llena el tarro («5-9 papelitos · 6 personas»), y cuando la facilitadora lo abre las ideas salen barajadas como stickies nativas sin nombre, listas para agrupar con FigJam AI, votar o estampar.

> Veredicto del juez: gana con 6,2/10 (Seal 5,9; Tripwire 4,95; Verdict 4,8; Phone-In 4,6). Esta especificación incorpora las correcciones de los tres verificadores (competencia, viabilidad y valor) y toma ideas de los finalistas descartados. La sección 15 detalla esos injertos.

---

## 1. Problema y evidencia

**El problema.** FigJam no tiene modo de escritura privada. Las stickies «incluyen automáticamente tu nombre» y cualquiera puede volver a mostrar la etiqueta de autor (https://help.figma.com/hc/en-us/articles/1500004414322-Sticky-notes-in-FigJam). Con eso, el anonimato es solo aparente. Además, en cuanto alguien escribe, los demás lo leen, y eso provoca anclaje y conformidad en retros, brainstorms y críticas de diseño.

**Demanda.** Hay 5 hilos del foro con unas 19k vistas en total, activos entre 2022 y el 25-03-2026:

| Hilo | Vistas |
|---|---|
| «Private writing» (dicen que «impide a nuestra org adoptar FigJam del todo») https://forum.figma.com/suggest-a-feature-11/private-writing-13312 | 3.637 |
| «Truly anonymous sticky notes» https://forum.figma.com/suggest-a-feature-11/bring-truly-anonymous-sticky-notes-to-figjam-8801 | 8.507 |
| «Anonymous voting & stickies», activo hasta 2026-03-25 https://forum.figma.com/suggest-a-feature-11/anonymous-voting-stickies-18636 | 1.579 |
| «Hide text on sticky notes» (hilo 23377) | 4.505 |
| «Anonymous posting», con respuesta del staff «in our radar» (oct-2024) https://forum.figma.com/ask-the-community-7/anonymous-posting-8027 | 727 |

- *Matiz honesto:* los tres hilos principales reúnen solo 44 likes en 4 años. La demanda es real y persistente, pero no masiva.
- Dos reseñas de 2026 dicen lo mismo:
  - retrotools.io (04-07-2026): si el equipo necesita garantías de seguridad psicológica, «FigJam cannot provide them» (https://www.retrotools.io/tools/figjam).
  - retrospectivetools.com (01-09-2026): «stickies always carry a name» (https://www.retrospectivetools.com/tool/figjam/). El 4,5/10 del kit de retro no está verificado (la nota global que se ve es 7,3/10). **Baja confianza.**
- Miro, Mural y Lucidspark tienen modo privado nativo (https://help.miro.com/hc/en-us/articles/9794413310482-Private-mode). Los detalles son de confianza media, porque sus páginas devolvieron 403.
- No hay modo privado en los anuncios de Config 2026 ni en las 457 entradas de las release notes hasta el 30-09-2026 (confianza media): https://forum.figma.com/product-updates-3/everything-announced-at-config-2026-55221

**Oferta actual** (API en vivo y `window.__w`, 30-09-2026): escasa y parada.

| Recurso | Usuarios | Última versión | Por qué no resuelve el trabajo |
|---|---|---|---|
| See No Sticky! (widget) | 16.339 | 2022-08 | Oculta el contenido pero no el autor. Hace falta un widget por nota («demasiados clics»). |
| Anonymous Feedback (widget) | 3.407 | 2024-08 (1 versión) | Cada nota se publica al compartirla, así que el timing delata al autor. No hay pool sellado ni revelado de la facilitadora. Genera rectángulos, no stickies. |
| Team Inbox (widget) | 2.856 | 2023-01 | Buzón de temas. El anonimato no está verificado. |
| anonymous thoughts (widget) | 2.317 | 2021-11 | Abandonado. |
| Ideas Spark Booth (plugin) | 303 | 2025-03, beta | Cada participante tiene que ejecutar el plugin. Usa backend en la nube y guarda la autoría. |
| Spoiler / FigBack / Szacunki | 258 / 338 / 14 | 2026 | Ocultan por nota, son encuestas o sirven solo para estimaciones. |

- Búsquedas en vivo de «brainwriting» y «silent brainstorm»: 0 widgets y 0 plugins. «suggestion box»: 0 widgets.
- **El patrón está probado a escala:** «ocultar hasta revelar» funciona en votos, con Simple Vote (687.725 usuarios), Priority Matrix (95.429) y Voting Sessions (32.485). Nadie lo ha llevado bien a las ideas en texto libre.
- **Solución improvisada de hoy:** Google Forms o Slido, y luego pegar en FigJam. «Añade fricción y pierde el tiempo real», según https://retroflow.org/blog/post/figjam-vs-retroflow

## 2. Usuario objetivo

- **Principal:** facilitadoras de retros recurrentes (scrum masters, agile coaches, design leads) en organizaciones estandarizadas en FigJam, con equipos de 5 a 15 personas y una retro cada 1-3 semanas.
- **Secundario:** design leads que hacen brainstorm silencioso o 1-2-4-All en críticas; research ops que recogen feedback sensible; docentes de bootcamps.
- **Fuera de foco:**
  - Equipos que ya se fueron a Parabol o EasyRetro. Parabol es gratis para 2 equipos con anonimato por defecto (https://www.parabol.co/pricing/).
  - AMAs de salas grandes. El widget Q&A (19.943 usuarios, mantenido) ya permite preguntas anónimas.
- **Quién instala:** solo la facilitadora. Los participantes solo hacen clic. Por eso la distribución depende de las plantillas.

## 3. Por qué widget y no plugin, Skill ni función nativa

1. **Asientos.** En FigJam pueden interactuar con widgets todos los asientos, y también los visitantes de sesión abierta (https://help.figma.com/hc/en-us/articles/4410786053911-Invite-visitors-to-an-open-session, solo planes Pro, Education, Org y Enterprise, 24 h). Es la única superficie en la que el bucle multijugador no choca con los asientos Collab y Dev.
2. **Estado oculto compartido en el lienzo.** Solo un widget combina tres cosas: un iframe privado por persona (`figma.showUI`), un render idéntico para todos que muestra solo agregados, y la creación de stickies nativas desde el cliente de la facilitadora.
3. **Alternativas:**
   - Un plugin es monousuario. O escribe cada idea en el lienzo al momento, lo que filtra la autoría, o necesita un backend y que todos lo ejecuten (Ideas Spark Booth).
   - Las Skills y los plugins generativos son de un solo uso y de un solo usuario.
   - La votación nativa oculta votos, no ideas.
4. **Objeto ritual persistente.** El tarro vive en la plantilla de retro y vuelve cada sprint desde Recents. Tras abrirse se convierte en recibo de sesión (sección 4).

## 4. Interacción principal

### Demo de 10 segundos
1. La facilitadora coloca el tarro, elige la plantilla Start/Stop/Continue y pulsa «Ronda de 5 min». Arranca el temporizador nativo (`figma.timer.start`).
2. Tres personas pulsan «Echar un papelito». Se abre un panel privado que solo ve cada una, y cada una escribe dos ideas y pulsa «Sellar».
3. El tarro se llena de papelitos doblados y muestra «5-9 papelitos · 3 personas». Nadie puede leer el contenido y no hay recuento por compartimento.
4. La facilitadora pulsa «¡Abrir!». Los papelitos salen uno a uno, barajados, como stickies nativas de colores en tres secciones y sin nombre visible, listas para AI Sort, votación o sellos.

### Estados en el lienzo (render idéntico para todos, función pura del estado)

| Estado | Qué se ve |
|---|---|
| `setup` | Tarjeta con la pregunta (Input editable), selector de plantilla y botón «Empezar». |
| `open` | Tarro SVG en 8 niveles de llenado pre-rasterizados. Total **por tramos** (0 · 1-4 · 5-9 · 10-19 · 20+), número de personas, aviso «faltan 2 personas para poder abrir», botón grande «Echar un papelito» y estado del temporizador. |
| `closed` | Tapa sellada. Solo aquí aparecen los recuentos por compartimento. «¡Abrir!» y «Sacar de uno en uno» quedan habilitados si hay al menos 3 personas. |
| `popping` | Progreso «n/N». Es reanudable. |
| `popped` | **Recibo de sesión:** pregunta, n.º de papelitos, n.º de personas, fecha, enlace «Ir a la sección», botón «Rellenar para la próxima ronda» y el bloque Boomerang (sección 6). |
| `copy` | «Tarro copiado: sellado». Aparece si `useWidgetNodeId() !== cfg.homeNodeId`. Solo la facilitadora actúa, y en su primer clic la copia descarta los papelitos heredados. |

### Panel privado (iframe de quien hace clic)
- Pestañas por compartimento y papelitos de hasta 280 caracteres. Se puede editar o retirar un papelito propio antes de que se abra el tarro, en el mismo dispositivo.
- **Escritura diferida anti-timing.** Los papelitos se guardan en el panel. Al pulsar «Sellar mis papelitos» se escriben tras un jitter aleatorio de 5-30 s («sellando…»), o todos juntos cuando termina el temporizador (`timerdone`). Si alguien cierra antes, se escriben al instante y un aviso le explica que así es menos anónimo.
- Muestra la cuota, si la hay («te quedan 1 de 3»).

### Property menu (igual para todos; cada handler comprueba que quien lo usa es la facilitadora)
- Desplegable de plantilla: Libre, Start/Stop/Continue, 4Ls, Mad/Sad/Glad, «La última vez dijimos…».
- Toggle Anónimo/Con nombre.
- «Ronda de 5 min»
- «Cerrar tarro»
- «¡Abrir!» (palomitas)
- «Sacar de uno en uno»
- «Ajustes…» (iframe: pregunta, compartimentos, cuota, umbral, salida en stickies o tarjetas)
- «Pasar facilitación» (usa `activeUsers`)
- «Refrescar»
- Enlace a la guía y al modelo de amenazas.

## 5. Modelo de anonimato (comunicado con honestidad en el listado)

**Qué garantiza:**
- Nunca se guarda un id de usuario junto al texto.
- La participación usa un token aleatorio de 96 bits guardado en `clientStorage`, no `userId`.
- La salida se baraja con Fisher-Yates.
- Todas las stickies las crea el cliente de la facilitadora.
- El texto nunca entra en el árbol de capas ni en `pluginData`/`sharedPluginData` antes de abrir el tarro, porque son legibles por la API REST.
- Umbral k=3 personas. Además, al abrir, un compartimento con menos de 2 papelitos se fusiona en «Otros».
- Los recuentos por compartimento solo se muestran con el tarro cerrado.
- La estantería de avatares está desactivada por defecto.

**Qué no garantiza:**
- No es anonimato criptográfico frente a alguien que decodifique el tráfico Kiwi de Figma. Existen herramientas públicas: allan-simon/figma-kiwi-protocol y figwright-kiwi-reader (confianza media).
- El historial de versiones conserva el estado anterior a abrir el tarro.
- El estilo de redacción puede delatar al autor.
- El creador de las stickies es la facilitadora. Hay datos contradictorios sobre si `StickyNode.authorName` se puede escribir: los typings 1.139.0 dicen que sí y la documentación dice «returns». Por eso **no se promete** que el autor aparezca como «Hush Jar». Como alternativa se ofrece salida en *tarjetas* (`ShapeWithText`), que no tienen campo de autor.

**Mensaje del listado:** «Nadie puede ver quién escribió qué desde FigJam, sus plugins o su API. Los nombres nunca se guardan con los papelitos. No es una garantía criptográfica.»

## 6. Funcionalidades

### MVP
1. Plantillas de compartimentos con color, pregunta y cuota opcional.
2. Panel privado con escritura diferida (jitter o fin de ronda) y edición o retirada en el mismo dispositivo.
3. Anonimato por construcción: slips `{c, t}` en `useSyncedMap` bajo claves aleatorias, y participación con tokens aleatorios.
4. Render que solo muestra agregados por tramos, umbral k=3 y fusión de compartimentos pequeños.
5. Ronda con temporizador nativo y cierre perezoso: si `timer.state === 'STOPPED'` al siguiente clic, el tarro pasa a `closed`.
6. Dos modos de apertura:
   - **Palomitas:** barajado y escalonado cada ~120 ms en una sesión de host, reanudable e idempotente.
   - **Sacar de uno en uno:** un clic por papelito, sin sesión de host, con opción de conservar o descartar.
7. Salida en una Section por compartimento, con stickies nativas (`authorVisible=false`) o tarjetas `ShapeWithText`. Tras abrir se borra el almacén oculto.
8. **Recibo de sesión + Boomerang mínimo.** El tarro abierto se queda como recibo (solo recuentos). «Rellenar para la próxima ronda» crea la ronda siguiente, y el compartimento opcional «La última vez dijimos…» muestra las stickies de la sección de acciones de la ronda anterior (búsqueda en la página con `findWidgetNodesByWidgetId` y la sección registrada). Así el tarro tiene motivo para seguir en el tablero.
9. Bloqueo de facilitadora (`currentUser.id`; a los visitantes sin sesión se les genera un id automático) y traspaso.
10. Detección de copias por `homeNodeId`, lease anti-doble apertura y gestión de papelitos que llegan tarde («n papelitos tardíos: abrir de nuevo»).
11. Exportar Markdown o CSV al portapapeles, o como bloque de código FigJam.

### v1.1
- **Modo asíncrono pre-retro** (injerto de Phone-In, sin backend). El tarro se queda abierto 24-72 h y se comparte en Slack el enlace al archivo, con el tarro enfocado. Los participantes echan papelitos a lo largo de los días, y la escritura en momentos dispersos también rompe la correlación por timing.
- **Recibo legible por agentes** (injerto de Seal/Tripwire). Al abrir se escribe en la Section un resumen JSON en `sharedPluginData('hushjar','v1')`: pregunta, recuentos, fecha y compartimentos, **nunca autores**. Así el FigJam MCP o la Skill «feedback recap» pueden resumir la retro sin ver identidades.

### v2
- Modo sellado con cifrado WebCrypto en el iframe (mejora frente a curiosos, no frente a una facilitadora maliciosa).
- Relay mezclador opcional para anonimato fuerte. Requiere red.
- Brainwriting 6-3-5 «construye sobre»: el panel privado recibe 3 papelitos anónimos al azar.
- 1-2-4-All y revelados por fases.
- Health check anónimo con tendencia entre sesiones.
- Boomerang completo: acciones con responsable y fecha, y tasa de cumplimiento por sprint (G8).
- Entrada desde el móvil por QR (injerto de Phone-In, con backend) para salas sin cuenta de Figma.

## 7. Arquitectura técnica

**Manifest:**
```json
{"editorType":["figjam"],"containsWidget":true,"widgetApi":"1.0.0","documentAccess":"dynamic-page",
 "permissions":["currentuser","activeusers"],"networkAccess":{"allowedDomains":["none"]},"ui":"ui.html"}
```
No tener red ni backend facilita que los administradores de la organización lo aprueben.

**Estado sincronizado** (nunca se renombran claves; campo `v` de esquema):
- `useSyncedState('cfg')`, solo lo escribe la facilitadora: `{v:1, homeNodeId, facilitatorId, prompt, template, compartments[{id,label,color}], quota, threshold:3, mode:'anon'|'named', output:'sticky'|'card', status:'setup'|'open'|'closed'|'popping'|'popped', timerRound, popLease:{sid,ts}, round, prevActionSectionId}`.
- `useSyncedMap('slips')`: clave aleatoria hex de 96 bits (`crypto.getRandomValues` en el iframe) → `{c, t≤280}`. Sin id ni timestamp. Límite de 300 papelitos (~100 kB).
- `useSyncedMap('ppl')`: token aleatorio → `1` (y `{n, photo}` solo en modo con nombre).
- `useSyncedMap('history')`: ronda → `{prompt, counts, people, at, sectionId}`, solo agregados.
- `figma.clientStorage` por dispositivo: `jar:<homeNodeId>` → `{token, myKeys[]}`. Lo usan widgets en producción (layoops/figma-github-integration), aunque la documentación no lo menciona para widgets. Confianza media-alta.

**Flujo de papelitos:** `onClick` devuelve una Promise, abre `showUI` junto al widget (360×480) y el iframe hace `postMessage` → el main thread valida `status === 'open'` y la cuota → `slips.set`. El cliente que escribe vuelve a renderizar, así que los recuentos en vivo no necesitan sesión de host.

**Motor de apertura:**
1. `status='closing'` y `popLease`; esperar 500 ms y volver a comprobar.
2. `slips.entries()`, Fisher-Yates y fusión de compartimentos con menos de 2 papelitos.
3. `createSection` por compartimento y `loadFontAsync` una sola vez.
4. Por cada papelito: `createSticky`/`createShapeWithText`, `characters`, `fills`, `authorVisible=false`, `setPluginData('hk', key)` (solo la clave) y `slips.delete(key)`.
5. `scrollAndZoomIntoView` y `figma.notify` con aviso sobre deshacer.

No se llama a `commitUndo` a mitad de la apertura. Si se reanuda, se saltan las claves que ya tienen sticky.

**Spikes de la semana 1** (cada uno decide sí o no):
- S1. Si `authorName` se puede escribir y si FigJam lo muestra.
- S2. Si `clientStorage` funciona en widgets.
- S3. `figma.timer` desde el widget y el evento `timerdone` en paneles abiertos.
- S4. 30-40 escrituras concurrentes en `useSyncedMap` sin recuentos obsoletos.
- S5. `createSticky` de más de 150 papelitos y el comportamiento de deshacer.
- S6. `currentUser.id` de visitantes de sesión abierta: si es estable al recargar.
- S7. Si AI Sort y la votación aceptan `ShapeWithText` como salida alternativa.

## 8. Competencia y diferenciación

| Frente a | Hush Jar gana en |
|---|---|
| Anonymous Feedback (3.407, 2024-08) | Pool colectivo sellado y apertura solo por la facilitadora (su lema «Write in private. Share when you're ready» significa publicar cada uno por su cuenta). Escritura diferida contra el timing, umbral k y salida en stickies nativas. Mantenimiento visible. |
| Ideas Spark Booth (plugin, 303) | Un clic y sin ejecutar ningún plugin. Sin backend ni red. No guarda la autoría. Funciona con visitantes. No está en beta. |
| See No Sticky! (16.339) | No hace falta un widget por nota. Oculta también la autoría. Apertura colectiva. |
| Q&A widget (19.943) | Solo en el caso AMA: pool sellado y «Sacar de uno en uno» con moderación. **No es el segmento principal.** |
| Formularios + pegar / Parabol | No se sale del lienzo, la salida ya es material de síntesis de FigJam y no hay otra herramienta que aprobar. |
| Modo privado de Miro/Mural | Funciona donde ya están los equipos que trabajan en Figma. |

**Posicionamiento:** «Escritura privada para cualquier taller», con Anónimo como modo. Es una cuña más amplia que «anonimato» y reduce el riesgo de credibilidad. Palabras clave del título y las tags: *private mode, silent brainstorm, brainwriting, anonymous retro, suggestion box*, que tienen 0 o pocos resultados.

## 9. Bucle de viralidad y distribución

- **Interacción obligatoria:** cada participante tiene que hacer clic en el tarro (8 personas por retro), y la facilitadora lo explica en voz alta. Es el mismo bucle que Simple Vote y Photo Booth.
- **Momento para compartir pantalla:** el efecto palomitas es memorable y fácil de copiar para otros equipos.
- **Ritual recurrente:** vuelve cada sprint desde la plantilla, y el recibo con Boomerang ancla el tablero de retro.
- **Plantillas primero:** 4 o 5 plantillas de Community con el tarro ya colocado (Retro anónima, Brainstorm silencioso 1-2-4-All, Crítica de diseño, AMA de liderazgo, Health check), más un archivo playground.
- **Alianzas:** creadores de facilitación (FigJenda 48k, Donut 45k) y comunidades ágiles.
- **Atribución discreta:** nombre de sección «Hush Jar · ¿Qué nos frenó? · 14 papelitos».
- **Realidad:** los participantes se convierten en instaladores solo si facilitan en otro sitio, así que el techo depende de las plantillas.

## 10. Monetización

- **Todo el MVP es gratis y nada de lo que se ve en la demo lleva paywall.** Con una conversión del 0,1-0,4 %, un pack de 5 $ daría unos 100-650 $ a 20k usuarios (el mejor widget de pago, Pie chart, tiene 439 compradores). No compensa la fricción.
- **Opcional (v1.1, solo si los datos lo justifican):** «Pack Facilitadora», pago único de 5 $ comprobado solo en los handlers de la facilitadora. Incluye temas (tarro, sombrero, buzón), exportación avanzada e historial de sesiones. Quienes participan nunca pagan.
- **Valor estratégico:** ser el ancla de marca de una serie de facilitación. Lo que puede tener negocio es el relay y QR de v2 (con backend, suscripción de terceros para agencias), no el widget.

## 11. Riesgos y mitigaciones

| Riesgo | Prob. | Mitigación |
|---|---|---|
| Figma lanza un modo privado nativo | 20-35 % en 24 meses (baja confianza) | Profundizar en métodos que Figma no construirá: brainwriting, 1-2-4-All, «Sacar de uno en uno», Boomerang y health trend. Seguir usando stickies nativas como salida. |
| Fugas de autoría (timing, contadores, cursores) | Alta sin las correcciones | Escritura diferida con jitter o fin de ronda, tramos, recuentos por compartimento solo al cerrar, tokens aleatorios y umbral k con fusión de compartimentos pequeños. |
| Promesa de anonimato exagerada | Media | Modelo de amenazas de una página en el listado. Nunca prometer anonimato criptográfico ni que el autor sea «Hush Jar». |
| `authorName` no editable, o `clientStorage` no disponible | Media | Salida en tarjetas `ShapeWithText`. Edición solo con el panel abierto. |
| La facilitadora hace clic en otro widget y se pausa la apertura | Media | Apertura reanudable e idempotente, o «Sacar de uno en uno» sin sesión de host. |
| Deshacer tras abrir vuelve a sellar el tarro | Media | Aviso con `notify`. Idempotencia con `pluginData 'hk'`. |
| Descubrimiento: las novedades de 2025-26 se quedan en 258-544 usuarios | Alta | Plantillas, alianzas y la ventana de 2-4 semanas en «popular». |
| Aprobación de widgets por administradores de la organización | Media | Sin red ni backend, más una página de privacidad. |
| Copia o duplicado arrastra papelitos | Baja | Detección con `homeNodeId`. |

## 12. Métricas de éxito

- **90 días:** 1.000 usuarios, es decir, el top 18 % de la cohorte de 2025 en adelante (mediana ~210). Ratio de likes por usuario ≥ 1,5 %.
- **Calidad de sesión:**
  - Mediana de 5 o más participantes por tarro.
  - Al menos el 70 % de las rondas iniciadas llegan a abrirse.
  - Al menos el 40 % de las facilitadoras repiten en 21 días.
  - Al menos el 25 % de los tarros proceden de una plantilla.
- **12 meses:** entre 2.000 y 8.000 usuarios, con un potencial de 15.000 a 30.000 si las plantillas se distribuyen bien (baja confianza).
- **Criterio de corte:** si a los 60 días repite menos del 30 %, pasa a ser una pieza de portfolio y se deja de invertir.

## 13. Plan de lanzamiento

1. **Semana 0. Validación.** 10-15 entrevistas con facilitadoras y un fake-door (plantilla «Retro anónima» con lista de espera).
2. **Semana 1.** Spikes S1-S7 y decisión de seguir o no.
3. **Semanas 2-5.** Construcción del MVP.
4. **Semana 6.** Alfa con 5 equipos reales (unas 20 personas y 3 o más cuentas), incluidos visitantes de sesión abierta. QA de copia, borrado, deshacer y versiones.
5. **Semana 7.** Publicación con plantillas, playground, GIF del efecto palomitas y modelo de amenazas. Respuestas útiles y no spam en los 5 hilos del foro. LinkedIn y comunidades ágiles.
6. **Semanas 8-10.** Aprovechar la ventana de «popular», iterar según las métricas y preparar el modo asíncrono v1.1.

## 14. Estimación de esfuerzo

Unas **6,5 semanas-persona** para un desarrollador de widgets con experiencia (las 5,5 base más 1 por las correcciones):

| Bloque | Semanas-persona |
|---|---|
| Scaffold, esquema y estados de render | 1,0 |
| Panel privado con `clientStorage`, cuota, temporizador y escritura diferida | 1,25 |
| Setup de la facilitadora, bloqueo y traspaso | 0,75 |
| Motor de apertura (palomitas, uno a uno, idempotencia, papelitos tardíos, fusión) | 1,0 |
| Recibo, Boomerang mínimo y salida en tarjetas | 0,75 |
| Exportación | 0,25 |
| QA multicuenta y modelo de amenazas | 0,75 |
| Listado, plantillas y playground | 0,75 |

No incluye la espera de la revisión de Community.

## 15. Injertos de los finalistas descartados

- **Phone-In:** el modo asíncrono pre-retro (v1.1, sin backend), y la entrada por QR desde el móvil con backend como línea de negocio en v2.
- **Seal y Tripwire:** recibo legible por agentes vía `sharedPluginData` (sin autores), para que el FigJam MCP y las Skills de resumen consuman la retro con una persona humana en el bucle.
- **Verdict:** revelado con sensación de ceremonia y «pick» controlado por quien es dueña (Draw one). Se descarta su parte de votos, porque la votación nativa ya la cubre.
- **G8 (retro de bucle cerrado):** Boomerang mínimo en el MVP y completo en v2.

---

**2. Seal: sign-off que sabe cuándo se rompe (5,9/10).** Es la idea más original: firmas por rol ligadas a una huella del diseño que se invalidan solas. Pierde por tres motivos:
- La premisa de que «lo nativo no invalida» era falsa. Ready for dev ya tiene el estado automático Changed y Compare changes, y solo deja fuera las actualizaciones de librería y los cambios de valor de variables.
- En Design, los asientos Collab y Dev (PM, ingeniería, clientes) no pueden hacer clic. El bucle de 2 a 5 firmantes exige backend o un plugin de Dev Mode desde el MVP (unas 10 semanas-persona).
- La demanda medida es modesta (hilos de 155 a 279 vistas) y Figma ya tiene aprobaciones en Buzz, que podría llevar a Design.

Merece una segunda vida como producto para agencias en plan Professional, pero solo si se valida antes.

**3. Tripwire: decision log con guardas para humanos y agentes (4,95/10).** Las guardas por propiedad con Restore y la bandeja de preguntas de agentes son novedosas. Pierde porque:
- La categoría de «decision log» está muerta. Las 12 herramientas lanzadas en 2025-26 suman 1.884 usuarios, y FigLog (11,9k) ya ocupa la palabra clave.
- La alarma no salta sola: solo comprueba al hacer clic.
- El bucle con agentes arranca en frío en los dos lados.
- El riesgo de plataforma es alto: reglas personalizadas en Check designs, comentarios vía MCP, Skills.

**4. Verdict: elegir la variación ganadora y decírselo al agente (4,8/10).** Pierde porque:
- El voto ciego ya lo cubren gratis Simple Vote (688k), la votación nativa y Priority Matrix, y los intentos específicos se quedaron pequeños (A/B Testing 303, Upvote 94, ReactBoard 46).
- El caso frecuente, que es decidir en solitario y anotar la decisión, lo resuelve un prompt al agente sin necesidad de widget.
- PM e ingeniería no pueden votar en Design por sus asientos.
- Figma podría añadir un botón «usar esta» a los prompts paralelos.

**5. Phone-In: nubes de palabras por QR y Q&A en directo para FigJam (4,6/10).** Pierde porque:
- El núcleo ya existe: Jam Session (QR a stickies, 81 usuarios en unos 21 meses) y External Forms (663). Eso indica poca atracción.
- Necesita backend y cumplimiento RGPD/DPA desde el primer día, y depende de una sesión de anfitriona frágil y sin ejecución en segundo plano.
- Quienes lo ven (los participantes) no pueden instalarlo.
- Mentimeter, Slido o Miro Engage lo ganarían por confianza en pocas semanas.

Parte de la idea queda injertada en Hush Jar: el modo asíncrono en v1.1 y la entrada por QR en v2.