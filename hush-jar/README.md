# Hush Jar · primera versión

Un tarro de ideas para FigJam. Cada persona escribe en una ventanita que solo ve ella, el tarro se va llenando sin que nadie pueda leer nada, y quien dirige la reunión lo abre cuando quiere. Las ideas salen mezcladas como notas normales de FigJam y anónimas.

## Cómo probarlo

1. En Figma Desktop, abre un tablero de FigJam de prueba.
2. Ve a **menú principal → Widgets → Desarrollo → Importar widget desde manifiesto…** y elige `hush-jar/manifest.json`.
3. Inserta **Hush Jar** desde **Widgets → Desarrollo**. La primera vez sale en inglés: selecciónalo y, en el menú que aparece encima, cambia **English** por **Español**. Tu ordenador lo recordará para los próximos tarros.
4. Haz una sesión de prueba:
   - Elige el formato: **Una pregunta**, **Retrospectiva** (Qué fue bien · Qué mejorar · Qué probar) o **Empezar · Dejar · Seguir**.
   - Escribe la pregunta haciendo clic en el recuadro, o elige una sugerencia. En las retros, el título es opcional. Después pulsa **Empezar**. Quien pulsa «Empezar» es quien dirige.
   - Si te has equivocado de formato o de pregunta, pulsa **← Volver**, arriba a la izquierda. Solo aparece mientras nadie haya escrito.
   - Si quieres, pon el temporizador de FigJam desde el tarro (3, 5 o 10 minutos).
   - Pulsa **Escribir una idea**. En las retros, elige primero la columna. Escribe y pulsa **Echar al tarro**. Repítelo con varias ideas.
   - Pulsa **Abrir el tarro**. Como estás tú solo, te avisará de que con menos de 3 personas se podría adivinar quién escribió cada idea. Pulsa **Abrir igualmente**.
   - Las ideas aparecen a la derecha, mezcladas y anónimas. Con una pregunta salen en amarillo. En las retros salen en una sección por columna, cada una con su color.
   - **Nueva ronda** te deja elegir otra pregunta y empezar de nuevo.

Mientras el widget está en desarrollo, solo lo puede usar quien lo ha importado. Para probarlo con tu equipo habrá que publicarlo.

## Qué hace ya

- Escritura privada: la ventanita solo la ve quien la abre.
- Tres formatos: una pregunta, retro y «Empezar · Dejar · Seguir». En las retros, cada idea va a su columna.
- Cuenta ideas y personas sin saber quiénes son. Cada ordenador tiene una marca al azar, y nunca se guarda un nombre junto a una idea.
- Puedes editar o retirar tus ideas hasta que se abra el tarro. En la ventanita aparecen solo las tuyas, porque tu ordenador recuerda cuáles son. En el tarro nada dice de quién es cada idea.
- Los papelitos del tarro no llevan el color de su columna, para que nadie adivine por el color qué ha escrito cada persona.
- Solo quien dirige puede abrir el tarro y poner el temporizador. Si otra persona tiene que dirigir, puede tomar el relevo desde el menú del widget.
- Si empiezas con el formato o la pregunta equivocados, **← Volver** te devuelve a la preparación con todo como estaba. Aparece mientras nadie haya escrito en esa ronda, para que ninguna idea acabe respondiendo a otra pregunta.
- Avisa si se va a abrir con menos de 3 personas.
- Las ideas que llegan cuando el tarro ya está abierto no se pierden: salen en la ronda siguiente.
- En español y en inglés. El idioma se elige en el menú del widget, en cualquier momento, y todo el mundo ve el tarro y la ventanita en ese idioma. La pregunta y las ideas se quedan como las escribió cada persona. Cada tarro nuevo empieza en el último idioma que elegiste en tu ordenador, y la primera vez en inglés.

## Qué falta (siguientes versiones)

- Proteger las copias del tarro para que no sirvan para abrir ideas ajenas.
- Publicarlo para que lo use todo el equipo.

## Publicar

Todo lo que pide Figma está en `publicar/`: `ficha.md` con los pasos y los textos para copiar (nombre, frase corta, descripción en inglés y en español, y las respuestas de seguridad de datos), `icono.png` (128 × 128), la instantánea del widget con fondo transparente (`instantanea-en.png` e `instantanea-es.png`) las portadas `portada-en.png` y `portada-es.png` y los tres pasos de «Cómo funciona» en `pasos-en.png` y `pasos-es.png` (1920 × 1080), que también usa el README principal.

Las imágenes salen del mismo dibujo del tarro y de los mismos textos del widget. Si cambia algo, se regeneran con `npm run imagenes`.

Después de publicar se pueden subir versiones nuevas cuando quieras: solo la primera pasa la revisión de Figma. Los tarros que ya estén puestos en un tablero siguen con la versión con la que se pusieron; los nuevos usan siempre la última.

## Desarrollo

```bash
npm install
npm test        # tipos, build y sesiones simuladas con tres personas, en español y en inglés
npm run watch   # recompila dist/code.js al guardar
```

`npm test` también genera dos vistas previas: `scripts/preview-tarro.html`, con el dibujo del tarro en varios estados, y `scripts/preview-ventana.html`, con la ventanita privada en los dos idiomas.

Todos los textos están en `widget-src/textos.ts`. Para añadir otro idioma se copia uno de los diccionarios y se traduce; si falta alguna frase, `npm test` avisa.
