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
| Lima / verde vivo | `#6EF04A` | Acento de acción y recorte activo de la nav; nunca texto largo |
| Blanco | `#FFFFFF` | Fondo de la app y texto sobre navy |

Lavados permitidos (usados en el CSS de referencia):

| Token | Valor | Uso |
|---|---|---|
| `--wash-navy` | `rgba(0, 26, 77, 0.055)` | Fondos suaves, filas, botones icono |
| `--wash-green` | `rgba(140, 196, 99, 0.18)` | Tarjetas y banners de plan / éxito |
| `--wash-celeste` | `rgba(90, 184, 240, 0.17)` | Tarjetas de clase, pills *pendiente* |
| `--wash-blue` | `rgba(62, 136, 240, 0.13)` | Tarjetas y pills *no pagado* |

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
- `--accent` es la lima de acción (CTA optimista, ítem activo de la nav). El texto sobre acento es siempre navy (`--accent-foreground`).
- `--primary` es navy, no verde. El botón por defecto es navy / blanco. El botón “feliz” de reservar puede usar el acento lima / navy.
- Alias de marca opcionales, también en el CSS de referencia: `--navy`, `--green`, `--celeste`, `--blue`, `--lime`, `--white`.

## 5. Contraste (WCAG AA)

Requisito: texto normal ≥ 4.5:1; texto grande (≥ 18px o 14px bold) y gráficos de UI ≥ 3:1.

| Combinación | Ratio | Texto normal | Uso |
|---|---:|---|---|
| Navy sobre blanco (y viceversa) | 16.73 | Pasa | Texto y primario |
| Navy sobre lima `#6EF04A` | 11.34 | Pasa | CTA de acento, nav activa |
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

Regla práctica: **el texto es navy o blanco**. Lima, verde y celeste pintan fondos, pills y acentos, con label navy.

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
| Chip / pill | 12 / 800, min-height 28px | 11px |
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

### Tarjetas de clase
Fondo en wash (verde, celeste o azul), radio ~34px, título 22/900, meta de horario e instructor, chip de estado o cupo, y recorte fotográfico que se sale. No agregar borde duro.

### Tira de días
Siete columnas. Cada día es una píldora vertical (día en mayúsculas + número). El seleccionado se rellena de celeste sólido, texto navy, con una sombra celeste corta. Los demás, texto navy al ~62% o más, sin borde innecesario.

### Navegación inferior
Cápsula flotante navy, con margen 20px a los lados y ~18px al piso, sombra `--shadow-nav`. Ítem activo: relleno lima, texto e ícono navy. Ítems inactivos: blanco al 63% sobre navy. Siempre con label visible (no solo ícono). En el cliente van **tres** destinos (ver [`docs/design/navegacion-cliente.md`](docs/design/navegacion-cliente.md)); el mockup de referencia tenía cuatro e incluía Perfil, que en producto vive en el avatar del header.

### Botones
- Primario por defecto: ancho completo, píldora, navy / blanco.
- Primario de acción “feliz” (reservar): lima / navy.
- Una sola acción primaria visible por pantalla, en la zona baja (pulgar).
- Target ≥ 44px (48px de alto en el botón principal).

### Chips de estado de pago
Siempre con la palabra, nunca solo color:

| Estado | Clase de referencia | Fondo | Texto |
|---|---|---|---|
| Pendiente | `.pill.celeste` | `--wash-celeste` | Navy |
| En revisión | `.pill.navy` | Navy | Blanco |
| Pagado | `.pill.green` | Verde `#8CC463` | Navy |
| No pagado | `.pill.blue` | `--wash-blue` | Navy |

### Banner de plan / avisos en el portal
Cápsula en wash verde o celeste, copy corto (“Te queda 1 de 3 clases”), sin exclamaciones de más. Los avisos del producto (límite de la semana, comprobante en revisión, clase de recuperación disponible) viven en estas capsulas, no en un centro de notificaciones.

### Header
Saludo en rioplatense + nombre en 18/900 + avatar circular. El avatar abre Perfil / cuenta. A la derecha, como máximo un botón icono secundario (por ejemplo ayuda), nunca un menú hamburguesa para secciones principales.

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
- Al abrir la app, el cliente cae en **Reservar** (home).
- El admin, cuando se diseñe, usa la misma gramática en el teléfono (el mockup `admin-day` es la referencia de densidad, no una excepción de estilo).

## 12. Hacer / no hacer

**Hacer**

- Usar solo la paleta Kinaf y sus washes.
- Texto navy o blanco, con contraste AA.
- Cápsulas, fotos recortadas que desbordan, tira de días en píldora, nav flotante navy, CTA de ancho completo.
- Nunito Sans, pesos altos, números tabulares.
- Una acción primaria por pantalla.
- Labels en la nav y en los estados de pago.

**No hacer**

- Volver a Aire, Marina, Estudio o Cupo, ni mezclar sus tipografías (Bricolage, Barlow Condensed, Onest, Familjen Grotesk).
- Meter terracota, sage, mostaza, rojo, naranja, violeta o crema.
- Usar lima o verde como color de texto sobre blanco.
- Inter, Geist, Roboto o el shadcn por defecto como tipo de producto.
- Radios chicos (4–8px), sombras negras, cards con borde duro y foto encajonada.
- Dashboard de admin con sidebar de escritorio como diseño de partida.
- Más de cinco destinos en la bottom nav, o secciones principales escondidas en un hamburger.
- Copiar al pie de letra los 8–11px del mockup.

## 13. Gates

Antes de aceptar un mockup y otra vez antes de mergear la pantalla implementada, corre el *ux-complexity-gate* (y, en lo implementado, el *design-fidelity-gate* contra el mockup). Los umbrales no se relajan: una acción primaria visible, targets ≥ 44px, texto ≥ 12px, cuerpo y botones ≥ 14px, contraste AA, bottom nav de 3 a 5 destinos con label.
