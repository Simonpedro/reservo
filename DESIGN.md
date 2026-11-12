# DESIGN.md · Sistema visual Píldora

**Estado:** decisión tomada el 11 de noviembre de 2026 (hora de Argentina).  
**Alcance:** identidad visual de Reservo y look por defecto de Kinaf, el primer tenant. Los demás centros podrán re-themear colores, logo y nombre vía variables CSS de shadcn/ui, dentro de esta misma gramática (radios, tipo, componentes, voz).

## 1. Decisión

Elegimos la variante **Píldora** (propuesta 4 de la exploración de identidades) como estilo visual de Reservo.

La razón, en palabras de Simon (revisada junto a su mamá, frente a las cinco propuestas): es **sencilla, fácil de entender y simple**, y al mismo tiempo tiene **buen contraste en los colores**. Aire (variante 1) se siente parecida, pero no alcanza ese contraste. Las otras tres (Marina, Estudio, Cupo) se descartan como dirección de producto.

Los mockups de referencia —tablero de marca y pantallas móviles de reservar, mi plan, pagos y el día del admin— están en [`docs/design/pildora/`](docs/design/pildora/). Este documento extrae el sistema a partir del HTML y el CSS reales de esos mockups (`theme.css` y las pantallas), no de una reinterpretación.

Aire, Marina, Estudio y Cupo quedan como contexto histórico en la rama `design/brand-identities` y en el [issue #1](https://github.com/Simonpedro/reservo/issues/1). No se usan como fuente de tokens.

## 2. Principios

- **Mobile first.** Las pantallas de producto se diseñan a 390×844. El admin también es un teléfono, no un dashboard de escritorio.
- **Cápsulas, no cajas.** Radios grandes y controles en píldora. La suavidad baja la fricción de reglas (cupo, plan, pago) sin perder seriedad: el navy ancla el contraste.
- **Contraste primero.** El color de acento (verde, lima, celeste, azul) es relleno o tinte, nunca el color del texto largo. El texto es navy sobre claro, o blanco sobre navy.
- **Fotos que se salen.** Las personas se recortan y desbordan la tarjeta. No van encerradas en un rectángulo plano.
- **Una acción primaria por pantalla.** Botón de ancho completo, abajo, al alcance del pulgar.
- **Voz rioplatense.** Voseo, frases cortas, amables y concretas. Sin tono corporativo y sin infantilizar.

## 3. Paleta Kinaf (única)

No se agregan otros matices. Solo estos hex y tintes/sombras derivados por alpha:

| Nombre | Hex | Rol |
|---|---|---|
| Navy | `#001A4D` | Texto, navegación, botón primario, estado *en revisión*, ancla de contraste |
| Verde | `#8CC463` | Acompañamiento, éxito, estado *pagado* (siempre con texto navy) |
| Celeste | `#5AB8F0` | Selección y organización: día elegido, tintes de tarjeta, estado *pendiente* |
| Azul | `#3E88F0` | Información, foco (`--ring`), estado *no pagado* (en tinte, con texto navy) |
| Lima / verde vivo | `#6EF04A` | Ítem activo de la nav; nunca texto largo |
| Blanco | `#FFFFFF` | Fondo de la app y texto sobre navy |

Lavados permitidos (usados en el CSS de referencia):

| Token | Valor | Uso |
|---|---|---|
| `--wash-navy` | `rgba(0, 26, 77, 0.055)` | Fondos suaves, filas, botones icono |
| `--wash-green` | `rgba(140, 196, 99, 0.18)` | Tarjetas y banners de plan / éxito |
| `--wash-celeste` | `rgba(90, 184, 240, 0.17)` | Tarjetas de clase, estado vacío, burbujas de filas |
| `--wash-blue` | `rgba(62, 136, 240, 0.13)` | Tarjetas de clase |

## 4. Tokens shadcn/ui

Valores tomados de `docs/design/pildora/theme.css`. Los nombres en inglés son los de shadcn; hay que respetarlos en el código.

```css
:root {
  --background: #ffffff;
  --foreground: #001a4d;
  --card: #ffffff;
  --card-foreground: #001a4d;
  --popover: #ffffff;
  --popover-foreground: #001a4d;
  --primary: #001a4d;
  --primary-foreground: #ffffff;
  --secondary: rgba(90, 184, 240, 0.16);
  --secondary-foreground: #001a4d;
  --muted: rgba(0, 26, 77, 0.06);
  --muted-foreground: rgba(0, 26, 77, 0.72);
  --accent: #6ef04a;
  --accent-foreground: #001a4d;
  --destructive: #3e88f0;
  --destructive-foreground: #ffffff;
  --border: rgba(0, 26, 77, 0.11);
  --input: rgba(90, 184, 240, 0.2);
  --ring: #3e88f0;
  --radius: 2rem;
  --sidebar: #001a4d;
  --sidebar-foreground: #ffffff;
  --sidebar-primary: #6ef04a;
  --sidebar-primary-foreground: #001a4d;
  --sidebar-accent: rgba(90, 184, 240, 0.22);
  --sidebar-accent-foreground: #ffffff;
  --sidebar-border: rgba(255, 255, 255, 0.18);
  --sidebar-ring: #5ab8f0;
  --chart-1: #8cc463;
  --chart-2: #5ab8f0;
  --chart-3: #3e88f0;
  --chart-4: #6ef04a;
  --chart-5: #001a4d;
  --font-sans: "Nunito Sans", ui-rounded, sans-serif;
}
```

Notas:

- `--destructive` no es rojo: en esta paleta el “no pagado” y las alertas de producto se resuelven con azul/navy más una etiqueta en palabras. No introducir rojo, naranja ni terracota.
- `--accent` es la lima del ítem activo de la nav. El texto sobre acento es siempre navy (`--accent-foreground`).
- `--primary` es navy, no verde. El único botón primario es navy / blanco (ver Botones).
- Alias de marca opcionales, también en el CSS de referencia: `--navy`, `--green`, `--celeste`, `--blue`, `--lime`, `--white`.

## 5. Contraste (WCAG AA)

Requisito: texto normal ≥ 4.5:1; texto grande (≥ 18px o 14px bold) y gráficos de UI ≥ 3:1.

| Combinación | Ratio | Texto normal | Uso |
|---|---:|---|---|
| Navy sobre blanco (y viceversa) | 16.73 | Pasa | Texto y primario |
| Navy sobre lima `#6EF04A` | 11.34 | Pasa | Nav activa |
| Navy sobre verde `#8CC463` | 8.12 | Pasa | Chip *pagado* |
| Navy sobre celeste `#5AB8F0` | 7.61 | Pasa | Día seleccionado |
| Navy sobre azul `#3E88F0` | 4.77 | Pasa | Si hace falta relleno sólido azul |
| Navy al 72% sobre blanco (`--muted-foreground`) | 6.92 | Pasa | Texto de apoyo |
| Navy al 62% sobre blanco | 4.91 | Pasa | Piso mínimo de texto secundario; no bajar de ahí |
| Blanco al 63% sobre navy | 7.17 | Pasa | Ítems inactivos de la nav |
| Navy sobre los *washes* | ~14.5–15 | Pasa | Texto en tarjetas tintadas |
| Verde, lima o celeste como texto sobre blanco | 1.48–2.20 | **No pasa** | Prohibido |
| Blanco sobre verde, lima o celeste | 1.48–2.20 | **No pasa** | Prohibido |
| Azul `#3E88F0` como texto sobre blanco (o blanco sobre azul) | 3.51 | **No pasa** AA de texto chico (sí grande / UI) | No usar para cuerpo ni chips chicos |
| Borde `--border` (navy 11%) sobre blanco | 1.25 | **No pasa** 3:1 | No basar un estado solo en ese borde; en producción, si el borde es la única señal, subirlo hasta ≥ 3:1 |

Regla práctica: **el texto es navy o blanco**. Lima, verde y celeste pintan fondos y acentos, con label navy.

## 6. Tipografía

- Familia: **Nunito Sans** (Google Fonts, ejes `opsz` 6–12 y `wght` 500–900). Números tabulares (`font-variant-numeric: tabular-nums`) en horarios, cupos y montos.
- Pesos: **900** títulos y labels de acción; **700–800** UI e interfaz; **600** apoyo. Evitar 400/500 para texto importante: pierde el carácter redondo de Píldora.
- Tracking: títulos con `letter-spacing` negativo leve (aprox. −0.04em a −0.055em).

Escala de producción (ajustada al *ux-complexity-gate*: nada bajo 12px; cuerpo y botones ≥ 14px). Entre paréntesis, lo que medía el mockup de referencia, cuando difiere:

| Rol | Producción | Mockup |
|---|---|---|
| Título de pantalla | 32 / 900 | 31px |
| Título de tarjeta / clase | 22 / 900 | 22px |
| Título de sección | 18 / 900 | 18px |
| Saludo / nombre | 18 / 900 | 18px |
| Cuerpo | 16 / 700 | — |
| Botón primario | 16 / 900, min-height 48px | 13px / 42px |
| Línea de estado o meta en tarjeta | 12 / 800 | 11px |
| Meta, horarios, apoyo | 12–14 / 700–800 | 10–11px |
| Label de la bottom nav | 12 / 800 | **8px (no repetir)** |
| Label de día (LUN, MAR…) | 12 / 800 | 9px |

Los mockups priorizaron la atmósfera; al diseñar pantallas reales se agranda lo chico y se mantienen cápsulas, pesos y contraste. No se copian los 8–11px a producción.

## 7. Forma, espacio y sombra

- `--radius` base: `2rem` (32px).
- Tarjetas protagonistas: 28–42px (las de clase, ~34px).
- Controles, botones, nav e ítems: `999px` (píldora).
- Avatares y botones icono: círculo (`50%`), 42×42px como mínimo; en producción, el target tappable ≥ 44×44px.
- Gutters horizontales: 20px. Espaciado entre bloques: 8 / 12 / 16 / 20 / 24.
- Sombra suave de tarjeta: `0 14px 34px rgba(0, 26, 77, 0.1)` (`--shadow-soft`).
- Sombra de la nav: `0 12px 34px rgba(0, 26, 77, 0.2)` (`--shadow-nav`).
- Siempre caída vertical visible, teñida de navy. Nunca halo difuso gris, nunca sombra negra pura.

## 8. Foto e iconografía

- Fotos de personas reales (pilates, gym, yoga, funcional), recortadas con fondo transparente, ancladas abajo a la derecha de la tarjeta, desbordando el borde (`overflow: visible` en la tarjeta). Sombra tipo `drop-shadow` navy suave.
- No usar la foto como fondo rectangular recortado “en caja”, ni ilustraciones genéricas si hay una foto que pueda desbordar.
- Iconos: trazo lineal, ~2.25px, extremos redondos, una sola pieza, sin emoji y sin relleno decorativo. En nav, 20×20px. Color heredado del contenedor (blanco sobre navy, navy sobre lima).

Logo: tres chevrons apilados (verde, celeste, azul). Wordmark “Reservo” en Nunito Sans 900; la “o” final puede teñirse de celeste, como en el tablero de marca.

## 9. Componentes

Regla general (Simon, 12 de noviembre de 2026): **consistencia y la menor cantidad de casos especiales**. Un mismo componente se ve igual en el cliente y en el admin. Los estados informativos nunca parecen botones ni chips. La referencia viva de todos los componentes es el prototipo completo en [`docs/design/prototype/`](docs/design/prototype/).

### Tarjetas de clase
Fondo en wash (verde, celeste o azul según la actividad), radio ~34px, título 22/900, chevron discreto, líneas de información con ícono (horario e instructor, centro, estado o cupo) y recorte fotográfico que se sale. No agregar borde duro ni botones dentro de la tarjeta: toda la tarjeta abre el detalle, con una View Transition de elemento compartido (fondo, título y foto). La misma tarjeta se usa en el admin (con la ocupación como línea). Una clase suspendida usa el wash navy y la foto en gris.

### Tira de días
Píldoras verticales (día en mayúsculas + número). El seleccionado se rellena de celeste sólido, texto navy, con una sombra celeste corta. Los demás, texto navy al ~62% o más, sin borde. Si hay más de siete días, la tira se desplaza en horizontal y centra el día elegido.

### Navegación inferior
Cápsula flotante navy, con margen 20px a los lados y ~18px al piso, sombra `--shadow-nav`. Ítem activo: relleno lima, texto e ícono navy (igual en todos los roles). Ítems inactivos: blanco al 63% sobre navy. Siempre con label visible.

- Cliente: **Mis clases** (inicio), **Mi plan**, **Pagos**. El avatar abre Perfil.
- Admin: **Hoy** (inicio), **Clientes**, **Agenda**, **Pagos**. El avatar abre Ajustes.
- Instructor: una sola pantalla (Hoy), sin barra.

Las páginas internas (que se abren desde una pestaña) ocultan la barra de pestañas y el avatar; muestran un botón de volver y, como máximo, una acción primaria anclada abajo.

### Botones
Hay **un solo estilo de botón primario** y **un solo estilo secundario**, en todas las pantallas y roles:

- **Primario:** ancho completo, píldora, navy con texto blanco 16/900, 48px de alto. Se ancla abajo (sobre la barra en las pestañas). Uno por pantalla como máximo. No hay variante lima ni “feliz”: reservar, confirmar o guardar usan el mismo botón.
- **Secundario:** texto navy 16/900 subrayado, sin fondo, 44px de alto (por ejemplo “Mejor no”, “Cerrar sesión”, “Suspender esta clase”).
- **Enlace en línea:** texto navy 14/900 subrayado, target de 44px (por ejemplo “Deshacer”).
- Target ≥ 44px siempre.
- **Qué acción es primaria:** la que destraba la pantalla. “Escribir a Kinaf” es primario sólo cuando es la salida de un bloqueo (sin plan, sin horario, clase con menos de 24 h). Cuando todo funciona y es una acción ocasional (Mi plan con plan activo, Perfil), va como secundario.

### Estados
Un estado es **una línea con ícono y palabras**, igual a las demás líneas de información: “Tu horario fijo”, “Con tu clase pendiente”, “Cupo completo”, “Suspendida · Feriado”, “Ausente · tiene clase pendiente”. Nunca un chip ni una cápsula con fondo.

Estados de pago (siempre con la palabra):

| Estado | Ícono | Texto |
|---|---|---|
| Pendiente | reloj | “Pendiente · pagá hasta el 10” |
| En revisión | reloj | “En revisión” |
| Pagado | check | “Pagado el 5 de noviembre” |
| Atrasado | alerta | “Atrasada desde el 11” |

“No pagado” pasa a llamarse **Atrasado**. No bloquea nada: lo que se haga lo decide el admin.

### Avisos
Ícono + una línea en negrita + una línea de apoyo, **sin cápsula ni fondo** (por ejemplo “Tenés 1 clase pendiente · Usala hasta el domingo 29”). Si el aviso es el resultado de una acción reversible, lleva el enlace “Deshacer” a la derecha. Si el aviso invita a una acción, esa acción es el botón primario anclado abajo, no un botón dentro del aviso.

### Hoja de confirmación
Hoja inferior con título, una explicación de qué pasa y dos acciones: primario y “Mejor no”. Solo para lo que no se deshace fácil (no ir a una clase, marcar ausente, suspender, rechazar un comprobante).

### Filas
Para listas (personas, pagos, avisos del admin, ajustes): burbuja circular con iniciales o ícono, título 16/900, apoyo 14/700 y chevron si la fila se abre. Separadas por una línea fina. Una lista homogénea es un solo grupo de decisión.

### Opciones y formularios
- **Opción en fila** (radio o casilla): marca circular o cuadrada navy a la izquierda, título y apoyo. Las que no se pueden elegir se ven atenuadas y dicen por qué (“Completo”).
- **Alternar** (elegir varias actividades): píldora con borde navy; seleccionada, navy relleno con check.
- **Campos**: label 14/800 arriba, campo en píldora con fondo `--input`, 48px. Los selects usan el mismo campo con una flecha.
- Un paso, una decisión. Los flujos largos van en pasos (“Paso 2 de 3”).

### Estado vacío
Tarjeta celeste centrada con ícono en círculo, título 22/900 y una frase de qué hacer. La acción, si existe, es el botón primario anclado abajo.

### Header
En las pestañas: saludo en rioplatense + nombre en 18/900 + avatar circular (en el admin, iniciales). En las páginas internas: solo el botón de volver.

## 10. Voz y tono

Español rioplatense, voseo, corto y amable. Se nombra la acción de frente. Los errores y los límites dicen qué pasó y qué hacer.

Ejemplos de la referencia (se pueden reusar):

- Botón: “Reservar Pilates · 18:00”, “Dale, reservame”.
- Vacío: “Por ahora no hay clases todavía. Probá otro día.”
- Confirmación: “Listo, ya tenés tu lugar.”
- Error: “Uy, se quedó sin subir. Mirá la fila de los 24 h.” (en producción: más claro, pero con el mismo tono: qué falló y qué hacer).
- Límite del plan: “Esta semana ya la diste toda: usaste tus 3 clases.”
- Pago en revisión: “Lo recibimos. Apenas lo revisemos te avisamos acá.”

No: “Usuario”, “su reserva ha sido confirmada”, “error inesperado”, anglicismos innecesarios, ni signos de exclamación en cadena.

## 11. Mobile first

- Lienzo de diseño: 390×844. Después se adapta hacia arriba; no se parte de un sidebar de escritorio.
- La bottom nav no se esconde detrás de un hamburger.
- Profundidad: como máximo tres niveles desde la barra (gate de complejidad).
- El admin, cuando se diseñe, usa la misma gramática en el teléfono (el mockup `admin-day` es la referencia de densidad, no una excepción de estilo).

## 12. Hacer / no hacer

**Hacer**

- Usar solo la paleta Kinaf y sus washes.
- Texto navy o blanco, con contraste AA.
- Cápsulas, fotos recortadas que desbordan, tira de días en píldora, nav flotante navy, un solo botón primario navy de ancho completo.
- Nunito Sans, pesos altos, números tabulares.
- Una acción primaria por pantalla.
- Labels en la nav y estados como línea con ícono y palabras.

**No hacer**

- Volver a Aire, Marina, Estudio o Cupo, ni mezclar sus tipografías (Bricolage, Barlow Condensed, Onest, Familjen Grotesk).
- Meter terracota, sage, mostaza, rojo, naranja, violeta o crema.
- Usar lima o verde como color de texto sobre blanco.
- Inter, Geist, Roboto o el shadcn por defecto como tipo de producto.
- Radios chicos (4–8px), sombras negras, cards con borde duro y foto encajonada.
- Dashboard de admin con sidebar de escritorio como diseño de partida.
- Más de cinco destinos en la bottom nav, o secciones principales escondidas en un hamburger.
- Copiar al pie de letra los 8–11px del mockup.
- Estados con forma de chip o cápsula, avisos con fondo, o variantes de botón según el caso.

## 13. Gates

Antes de aceptar un mockup y otra vez antes de mergear la pantalla implementada, corre el *ux-complexity-gate* (y, en lo implementado, el *design-fidelity-gate* contra el mockup). Los umbrales no se relajan: una acción primaria visible, targets ≥ 44px, texto ≥ 12px, cuerpo y botones ≥ 14px, contraste AA, bottom nav de 3 a 5 destinos con label.
