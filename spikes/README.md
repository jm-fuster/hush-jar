# Laboratorio de Hush Jar

## Qué es

No es Hush Jar. Es un banco de pruebas: antes de dedicar seis semanas a construir el widget, comprobamos en FigJam las cosas de las que depende. El laboratorio te guía prueba a prueba y te dice en lenguaje normal qué ha pasado y qué significa.

## Cómo usarlo

1. Si ya tenías una versión anterior en el tablero, bórrala.
2. En el tablero de prueba, inserta el laboratorio desde **menú principal → Widgets → Desarrollo → Hush Jar · Spike Lab**. Si no aparece, impórtalo primero desde *Widgets → Desarrollo → Importar widget desde manifiesto…* eligiendo `spike-lab/manifest.json`.
3. Sigue las pruebas en orden con **Siguiente prueba →**. Cada una te dice qué pulsar y qué mirar.
4. Al final, abre el plugin **Figma Desktop Bridge** en el tablero y escribe «listo» en el chat.

Tardarás unos 15 minutos. Si algo se atasca, el menú del widget tiene **Exportar resultados** (para pegarlos en el chat) y **Empezar de cero**.

## Las seis pruebas

| # | Prueba | Por qué importa |
|---|---|---|
| 1 | Escribir una idea en privado | Es el corazón de Hush Jar. La idea tiene que llegar al tarro aunque se cierre la ventanita enseguida. |
| 2 | Abrir un tarro lleno y deshacer | Cuánto tarda en salir todo y si un Ctrl+Z por error pierde ideas. |
| 3 | El temporizador de FigJam | Usar el temporizador nativo para las rondas. |
| 4 | Muchas ideas | Que el tarro no se atasque en sesiones grandes. |
| 5 | Duplicar el tarro | Que una copia no sirva para abrir ideas ajenas. |
| 6 | Te reconoce al volver | Para poder editar o retirar tu idea más tarde. |

La prueba de con qué nombre salen las notas ya está hecha (ver «Resultados obtenidos»).

---

## Resultados obtenidos

Los hizo Claude desde el plugin puente, el 30-09-2026, en el tablero de prueba «Sin título».

| Duda | Resultado | Qué cambia en Hush Jar |
|---|---|---|
| S1 · ¿Se puede firmar una nota como «Hush Jar»? | ❌ No. `authorName` lanza «no setter for property» aunque los typings digan lo contrario. La nota siempre lleva el nombre de quien la crea. Con `authorVisible = false` el nombre desaparece. | Las ideas salen con la firma oculta. Por debajo, el autor es quien abre el tarro, así que nunca se revela quién escribió cada idea. Si se vuelve a mostrar la firma, aparece quien abrió el tarro, no quien escribió. |
| E4 · ¿Puede otro plugin leer lo que guarda el tarro? | ✅ No. Desde otro plugin, `widgetSyncedState` devuelve `{}` aunque el widget tenga estado. | Las ideas selladas no son accesibles para otros plugins. Falta comprobar la API REST. |

El resto de pruebas está pendiente del recorrido guiado (v0.3).

---

## Notas técnicas (para desarrollo)

### Correspondencia con la propuesta

| Prueba | Spike | Claves en `results` |
|---|---|---|
| 1 | E3 | `privado.sellado.*`, `privado.guardado.*` (`data.how`), `privado.comprobar` |
| 2 | S5 + E1 | `apertura.llenar`, `apertura.abrir` (`ms`, `n`), `apertura.deshacer` (`left`, `slips`) |
| 3 | S3 | `temporizador.api`, `temporizador.resultado` (`reason`, `events`) |
| 4 | S4 (una sesión) | `carga.meter` (`ms`, `kb`), `carga.vaciar` |
| 5 | E2 | `copias.marcar`, `copias.buscar` (`widgetSyncedState` de la copia), `copias.vaciar` (`setWidgetSyncedState`) |
| 6 | S2 + S6 | `memoria.guardar` (entorno, `crypto` en el widget y en el iframe), `memoria.comprobar` |

S1 (firma) y E4 (lectura desde otro plugin) se resolvieron desde el plugin puente (ver «Resultados obtenidos»).

Cada resultado se replica en `sharedPluginData("hushjar_lab", clave)` del nodo del widget, para leerlo desde el plugin puente.

Quedan fuera del recorrido guiado, porque necesitan una segunda sesión de escritorio o un widget publicado:
- S4, varias sesiones escribiendo a la vez.
- S3, un panel en otra sesión que escucha `timerdone`.
- S6, visitantes de sesión abierta.
- S7, IA y votación con tarjetas. Solo hace falta si la firma oculta de quien abre el tarro no basta.

### Lo que ya dicen la documentación y los typings

Fuentes: `@figma/plugin-typings` 1.140.0, `@figma/widget-typings` 1.13.0 y developers.figma.com.

- `StickyNode.authorName` no está marcado como de solo lectura, pero la documentación dice «Returns the author name».
- `figma.timer` solo existe en FigJam. Un widget solo escucha eventos mientras su handler sigue vivo.
- `useSyncedMap` fusiona los cambios clave a clave: con claves aleatorias no se pierden papelitos. Sigue abierto el riesgo de que el contador pintado se desfase, porque vuelve a renderizar el cliente que escribe.
- `currentUser.id` se genera automáticamente para quien entra sin sesión. Para el resto de usuarios sin sesión es `null`.
- `widgetSyncedState` solo es legible por widgets con el mismo `id` de manifest, y `setWidgetSyncedState` permite vaciar otra instancia del mismo widget.
- Los widgets en desarrollo solo se ejecutan en la app de escritorio.
- `SectionNode.sectionContentsHidden` permite ocultar secciones. Es posible competencia nativa para el momento de revelar.

### Desarrollo

```bash
cd spike-lab
npm install
npm test        # tipos, build y pruebas de humo con una API de Figma simulada
npm run watch   # recompila dist/code.js al guardar
```

Las pruebas de humo (`scripts/smoke-*.mjs`) solo cazan errores de lógica y comprueban que cada paso muestra su veredicto. Los tiempos y los comportamientos reales salen de FigJam.
