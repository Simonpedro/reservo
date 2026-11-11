# Navegación del cliente

Propuesta para el portal del paciente/cliente de Reservo (primer tenant: Kinaf). Todavía no diseñamos las pantallas: acá se definen las entradas del menú, qué cubre cada una y qué se dejó afuera a propósito.

La barra sigue el *ux-complexity-gate*: **3 destinos etiquetados** (el rango permitido es 3–5; nos quedamos en el piso para que sea tan simple como Píldora), sin hamburger para las secciones principales, home = primera pestaña, profundidad ≤ 3, y las tareas diarias a pocos toques.

Referencias: [PRD](../../PRD.md) y el sistema visual [DESIGN.md](../../DESIGN.md).

## Cómo entra el plan en esta navegación

El menú no cambia según el tipo de plan. Lo que cambia es el contenido de **Reservar** y **Mi plan**.

Un plan se define por clases por semana. El admin elige una de estas dos formas (no hay una tercera):

- **Clases libres:** el cliente usa sus N clases de la semana en **cualquier** actividad (Gimnasio, Pilates o Yoga). Es el plan más caro.
- **Actividades específicas:** el plan nombra cupos por actividad, por ejemplo “1 Gym + 1 Pilates + 1 Yoga”. Cada actividad es distinta: no se puede canjear un Gym por un Pilates.

En Reservar, el cliente solo ve (como reservables) las clases que su plan le permite. Si ya usó el cupo de una actividad específica, esa actividad queda no disponible esa semana, con un mensaje claro. El aviso de “ya usaste las clases de la semana” cubre el total; en un plan específico, además se explica cuando se acabó una actividad en particular (“Ya usaste tu Yoga de esta semana”).

Cada clase indica **en qué centro está** (en Kinaf: Mendoza u Ovidio Lagos). Eso va en la tarjeta de la clase, no en una pestaña ni en un filtro obligatorio.

Una clase de recuperación (después de una ausencia marcada por el admin) se reserva en el mismo flujo, dentro del mes de facturación, y sigue las actividades permitidas por el plan.

## Barra inferior (3 pestañas)

Al abrir la app, el cliente cae en **Reservar**.

### 1. Reservar (home)

- **Ícono:** calendario o un slot simple (el de “reservar” de la referencia Píldora).
- **Qué muestra:** saludo + avatar, cuántas clases le quedan esta semana (o el aviso de que ya las usó), la tira de días, las clases de ese día con horario, actividad, instructor, **centro**, cupo y estado (disponible, ya reservada, cupo completo, o no disponible por el plan). Botón primario de ancho completo para confirmar la reserva elegida. Si tiene una recuperación habilitada, un aviso en cápsula lo dice acá y se reserva en este mismo flujo. Si está al inicio del ciclo, un atajo (banner o botón secundario, no una pestaña) ofrece **reservar el mes completo**, respetando el tipo de plan.
- **Necesidades del PRD que cubre:** reservar dentro de los límites del plan (total semanal y actividades permitidas) y del mes de facturación; el mensaje cuando se acabaron las clases de la semana (y, si aplica, el de una actividad específica); cancelar con 24 h o más (desde una clase ya reservada, en esta misma pantalla o en un detalle a un toque); la reserva de recuperación; el atajo de reservar el mes; mostrar el centro de cada clase; avisos dentro del portal (límite, recuperación, confirmación).
- **Acción primaria:** Reservar la clase elegida (o cancelar, si está mirando una reserva propia con más de 24 h).

### 2. Mi plan

- **Ícono:** una medalla / badge de plan, o un indicador de cupo (el “mi plan” de la referencia).
- **Qué muestra:** el plan activo, dicho con claridad: o bien “3 clases libres · cualquier actividad”, o bien el desglose “1 Gym + 1 Pilates + 1 Yoga”, con lo usado y lo que queda esta semana (en el plan específico, **por actividad**). Las reservas de la semana, el centro de cada una, cuándo reinicia el mes de facturación, y los extras (por ejemplo la rutina personalizada) como acción secundaria. Desde acá también se llega al atajo de reservar el mes completo.
- **Necesidades del PRD que cubre:** un plan activo por cliente; clases por semana en una de las dos modalidades (libres o actividades específicas); renovación mensual (el cliente ve la fecha de reinicio, no configura la renovación); extras aparte del plan; una vista de “qué tengo” distinta de “qué reservo hoy”.
- **Acción primaria:** entender el plan y la semana. Si el ciclo recién empieza, el atajo “Reservar el mes completo”. En un día corriente no hace falta un CTA más fuerte que eso: el cliente no compra ni arma el plan (eso lo carga el admin).

### 3. Pagos

- **Ícono:** comprobante o tarjeta (el de “pagos” de la referencia).
- **Qué muestra:** la cuota del mes, la ventana de pago (del 1 al 10), el estado actual (pendiente, en revisión, pagado, no pagado), la subida o la vista del comprobante, y el historial. Los avisos de “te queda pendiente” o “lo estamos revisando” viven acá y, si corre el plazo, también como cápsula en Reservar.
- **Necesidades del PRD que cubre:** estados de pago; el cliente sube el comprobante (imagen o PDF) y pasa a *en revisión*; ve historial y estado actual; un comprobante rechazado se anula y puede subir otro. El admin es quien marca pagado; el cliente no “se autoaprueba”.
- **Acción primaria:** subir el comprobante (o “ya enviaste el comprobante”, si está en revisión).

## Entradas secundarias (fuera de la barra)

### Perfil (avatar del header)

- **Ícono:** el avatar de la persona. No es una cuarta pestaña.
- **Qué muestra:** nombre, datos de contacto, el plan en una línea (libres o actividades específicas), cerrar sesión, y una salida de ayuda: “Si falta menos de 24 h para cancelar, escribinos por WhatsApp” (la cancelación tardía la hace el admin, como dice el PRD). No hay ajustes de notificaciones: en v1 no hay push, mail ni WhatsApp proactivo, solo avisos dentro del portal.
- **Por qué no va en la barra:** se usa poco (editar datos, salir). El avatar ya es un patrón de Píldora. Sacar Perfil de la nav deja tres destinos claros: reservar, entender el plan, pagar. El mockup de referencia tenía cuatro pestañas; en producto lo corregimos a tres.
- **Acción primaria:** no hay una acción frecuente. Cerrar sesión y WhatsApp de ayuda son puntuales.

No hay más entradas de primer nivel.

## Tareas frecuentes y toques (presupuesto del gate)

| Tarea | Frecuencia | Presupuesto | Camino |
|---|---|---|---|
| Reservar una clase de hoy / de la semana | Diaria | ≤ 3 toques | Ya está en home: elegir día → elegir clase → confirmar |
| Ver cuántas clases le quedan (y, si aplica, de qué actividad) | Diaria | ≤ 3 | Visible en Reservar; el desglose por actividad está en Mi plan |
| Cancelar con 24 h o más | Semanal | ≤ 5 | Reservar (o Mi plan) → la clase reservada → cancelar |
| Subir el comprobante | Mensual (ocasional) | ≤ 7 | Pagos → subir |
| Ver estado del pago | Mensual | ≤ 7 | Pagos (y un aviso en Reservar si está pendiente) |
| Reservar el mes completo | Mensual, inicio de ciclo | ≤ 7 | Atajo en Reservar o Mi plan, no una pestaña |

## Qué se dejó afuera o se unió, y por qué

- **Perfil como pestaña:** unido al avatar. Es poco frecuente y el mockup ya tenía el avatar en el header.
- **Inicio / Dashboard aparte de Reservar:** no. Reservar es el trabajo del cliente y ya carga saludo, plan de la semana y avisos. Una home “resumen” duplicaría Mi plan y Pagos.
- **Una pestaña o un filtro obligatorio de centros:** no. El PRD pide que al mostrar una clase se indique el centro (Mendoza u Ovidio Lagos). Va en la tarjeta. No es un destino de menú, ni un modo de la app. Los reportes por centro son del admin.
- **Reservar el mes completo como ítem de menú:** no. Es un atajo de inicio de ciclo, no un destino permanente. **Decisión:** el flujo principal es reservar día a día (o semana a semana) dentro del plan; el mes completo es un atajo. El PRD dejaba esto abierto; lo cerramos acá porque el plan se define por clases por semana, y la reserva diaria es el uso cotidiano. El atajo respeta actividades libres o específicas.
- **Lista de espera:** aparece en el mockup de Píldora, pero **no está en el PRD**. En v1, si no hay cupo, se muestra “cupo completo” y nada más. No inventamos una lista.
- **Historial de reservas / asistencia:** no tiene pestaña. La semana actual vive en Mi plan y en Reservar. Una ausencia que habilita recuperación se avisa en Reservar. El historial largo no es una necesidad del PRD.
- **Centro de notificaciones:** no. El PRD es explícito: v1 sin push, mail ni WhatsApp proactivo; solo avisos en el portal, en la pantalla donde importan.
- **Configuración, temas, idioma, extras como shop:** no. El tema lo define el tenant. Los extras se ofrecen como vínculo secundario en Mi plan, no como tienda.
- **Chat / WhatsApp genérico:** solo el puente de ayuda en Perfil (y en el flujo de cancelación tardía), porque el PRD manda la excepción de las 24 h por WhatsApp al admin.
- **Alta o cambio de plan por el cliente:** no. El plan lo arma el admin (libres o actividades específicas). El cliente solo lo ve y reserva dentro de esas reglas.
- **Clases intercambiables (Gym/Pilates u otras):** no existen. No hay UI de “canjear” una actividad por otra.
- **Navegación de admin o instructor:** fuera de este documento.

## Decisiones que tomamos acá (no quedan abiertas)

1. Home = Reservar.
2. Tres pestañas: Reservar, Mi plan, Pagos. Perfil en el avatar.
3. Reservar el mes completo es un atajo, no el flujo principal ni una entrada de menú.
4. En un plan de actividades específicas, Reservar no ofrece como disponibles las clases que el plan no incluye o cuyo cupo semanal de esa actividad ya se usó; el mensaje lo dice en palabras.
5. En un plan de clases libres, cualquier actividad cuenta para el total de la semana.
6. El centro (Mendoza u Ovidio Lagos) se lee en la tarjeta de la clase, no en el menú.
7. La recuperación se reserva en Reservar, dentro del mes, y sigue las actividades permitidas por el plan.
8. No hay lista de espera en v1.
9. No hay centro de notificaciones en v1.
10. La cancelación tardía no tiene pantalla propia: un texto de ayuda apunta a WhatsApp, y la resuelve el admin.

No hay preguntas abiertas de navegación. Las que el PRD todavía tiene (cuándo aplica un cambio de plan, qué muestra el inicio del admin) no cambian este menú: la primera es de negocio/admin, la segunda es de la navegación del admin, que viene después.
