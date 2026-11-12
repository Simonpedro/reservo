const state = document.body.dataset.state;

const states = {
  list: {
    selectedClass: "pilates",
    primary: { tone: "green", label: "Reservar Pilates · 18:00" },
    monthShortcut: true,
  },
  success: {
    bookedPilates: true,
    usedWeek: true,
    success: true,
  },
  cancel: {
    selectedClass: "yoga",
    primary: { tone: "", label: "Cancelar Yoga · 19:00" },
  },
  "cancel-confirm": {
    selectedClass: "yoga",
    sheet: "cancel",
  },
  "late-cancel": {
    selectedClass: "yoga",
    lateNotice: true,
  },
  "month-confirm": {
    selectedClass: "pilates",
    monthShortcut: true,
    sheet: "month",
  },
  empty: {
    empty: true,
    selectedDay: "dom",
  },
  recovery: {
    selectedClass: "pilates",
    recovery: true,
    monthShortcut: true,
    primary: { tone: "green", label: "Reservar Pilates · 18:00" },
  },
};

const current = states[state] ?? states.list;
const main = document.querySelector(".phone");

const icons = {
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  chevron:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
};

function statusBar() {
  return `
    <div class="statusbar" aria-hidden="true">
      <span>9:41</span>
      <span class="status-icons">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 9.5h1.7V7.4H1v2.1Zm4.1 0h1.7V5.3H5.1v4.2Zm4.1 0h1.7V3.1H9.2v6.4Zm4.1 0H15V1h-1.7v8.5Z" fill="currentColor"/></svg>
        <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 4.2A8.7 8.7 0 0 1 7 2a8.7 8.7 0 0 1 6 2.2M3.2 6.5A5.6 5.6 0 0 1 7 5.1c1.4 0 2.7.5 3.8 1.4M5.5 8.7A2.3 2.3 0 0 1 7 8.2c.6 0 1.1.2 1.5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x=".5" y=".5" width="18" height="10" rx="3" stroke="currentColor"/><rect x="2.5" y="2.5" width="13" height="6" rx="1.5" fill="currentColor"/><path d="M20 4v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </span>
    </div>`;
}

function header() {
  return `
    <header class="topline" data-bar="top">
      <div class="greeting">
        <div>
          <div class="hello">¡Buenas,</div>
          <div class="person-name">Sofi!</div>
        </div>
      </div>
      <button class="avatar-button" type="button" aria-label="Abrir perfil">
        <img class="avatar" src="assets/avatar.jpg" alt="">
      </button>
    </header>`;
}

function banner() {
  if (current.usedWeek) {
    return `
      <section class="plan-banner used" aria-label="Límite semanal">
        <strong>Esta semana ya la diste toda: usaste tus 3 clases.</strong>
      </section>`;
  }

  if (current.recovery) {
    return `
      <section class="plan-banner recovery" aria-label="Resumen del plan">
        <strong>Te queda 1 de 3 clases</strong>
        <span>Esta semana · 3 clases por semana</span>
        <span class="recovery-line">Tenés 1 clase de recuperación este mes.</span>
      </section>`;
  }

  return `
    <section class="plan-banner" aria-label="Resumen del plan">
      <strong>Te queda 1 de 3 clases</strong>
      <span>Esta semana · 3 clases por semana</span>
    </section>`;
}

function notices() {
  if (current.success) {
    return `
      <section class="notice success" role="status">
        <strong>Listo, ya tenés tu lugar.</strong>
        <button class="undo-button" type="button">Deshacer</button>
      </section>`;
  }

  if (current.lateNotice) {
    return `
      <section class="notice" role="status">
        <strong>Faltan menos de 24 h.</strong>
        <span>Para cancelar, escribinos por WhatsApp desde tu perfil.</span>
      </section>`;
  }

  return "";
}

const days = [
  ["lun", "9"],
  ["mar", "10"],
  ["mié", "11"],
  ["jue", "12"],
  ["vie", "13"],
  ["sáb", "14"],
  ["dom", "15"],
];

function weekStrip() {
  const selected = current.selectedDay ?? "mié";
  return `
    <div class="week-strip" data-group="days" aria-label="Días de la semana">
      ${days
        .map(
          ([label, number]) => `
            <button class="day ${label === selected ? "selected" : ""}" type="button" aria-pressed="${label === selected}">
              <span>${label}</span><strong>${number}</strong>
            </button>`,
        )
        .join("")}
    </div>`;
}

function classCard({ id, title, time, center, wash, image, imageClass = "", status }) {
  const selected = current.selectedClass === id;
  const booked = id === "yoga" || (id === "pilates" && current.bookedPilates);
  const statusText =
    booked ? "Ya reservada" : status === "full" ? "Cupo completo" : "2 lugares libres";
  const classNames = `class-card ${wash} ${selected ? "chosen" : ""}`;
  const contents = `
      ${booked ? `<span class="state-check">${icons.check}</span>` : ""}
      <h3>${title}</h3>
      <div class="details">
        <div class="detail-line">${icons.clock}${time}</div>
        <div class="detail-line">${icons.pin}${center}</div>
      </div>
      <span class="state-label ${booked ? "booked" : ""}">${statusText}</span>
      <img class="cutout ${imageClass}" src="assets/${image}" alt="">`;

  return `
    <button class="${classNames}" type="button" aria-pressed="${selected}" aria-label="${title}, ${time}, ${center}, ${statusText}">
      ${contents}
    </button>`;
}

function classes() {
  return `
    <div class="class-stack" data-group="classes">
      ${classCard({
        id: "pilates",
        title: "Pilates",
        time: "18:00",
        center: "Mendoza",
        wash: "celeste",
        image: "pilates.png",
      })}
      ${classCard({
        id: "yoga",
        title: "Yoga",
        time: "19:00",
        center: "Ovidio Lagos",
        wash: "green",
        image: "yoga.png",
        imageClass: "yoga",
      })}
      ${classCard({
        id: "gimnasio",
        title: "Gimnasio",
        time: "20:00",
        center: "Mendoza",
        wash: "blue",
        image: "gimnasio.png",
        imageClass: "gym",
        status: "full",
      })}
    </div>`;
}

function listHeading() {
  return `
    <div class="list-heading">
      <h1 class="section-title">Clases del miércoles</h1>
      ${
        current.monthShortcut
          ? `<button class="month-button" type="button">Reservar el mes completo ${icons.chevron}</button>`
          : ""
      }
    </div>`;
}

function emptyState() {
  return `
    <section class="empty-state">
      <div class="empty-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/></svg>
      </div>
      <h1>Por ahora no hay clases todavía.</h1>
      <p>Probá otro día.</p>
    </section>`;
}

function primaryAction() {
  if (!current.primary) return "";
  return `
    <div class="action-dock">
      <button class="primary-button ${current.primary.tone}" type="button" data-primary>
        ${current.primary.label}
      </button>
    </div>`;
}

function navigation() {
  return `
    <div class="nav-wrap">
      <nav class="bottom-nav" data-bar="nav" aria-label="Navegación principal">
        <button class="nav-item active" type="button" aria-current="page">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/></svg>
          <span>Reservar</span>
        </button>
        <button class="nav-item" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 19V8l8-5 8 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/></svg>
          <span>Mi plan</span>
        </button>
        <button class="nav-item" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M8 15h3"/></svg>
          <span>Pagos</span>
        </button>
      </nav>
    </div>`;
}

function sheet() {
  if (!current.sheet) return "";
  const isCancel = current.sheet === "cancel";
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-describedby="sheet-copy">
        <div class="sheet-handle" aria-hidden="true"></div>
        <h1 id="sheet-title">${
          isCancel
            ? "¿Cancelamos tu Yoga de las 19:00?"
            : "¿Reservamos tu mes, dentro de los límites de tu plan?"
        }</h1>
        <p id="sheet-copy">${
          isCancel
            ? "El lugar vuelve al cupo para que otra persona pueda reservar."
            : "Vamos a respetar tus 3 clases por semana y las actividades permitidas."
        }</p>
        <div class="sheet-actions">
          <button class="sheet-action ${isCancel ? "" : "happy"}" type="button" data-primary>
            ${isCancel ? "Sí, cancelar" : "Sí, reservar el mes"}
          </button>
          <button class="sheet-action secondary" type="button">Mejor no</button>
        </div>
      </section>
    </div>`;
}

const content = current.empty
  ? `${banner()}${weekStrip()}${emptyState()}`
  : `${banner()}${notices()}${weekStrip()}${listHeading()}${classes()}`;

main.innerHTML = `
  ${statusBar()}
  <section class="app-shell ${current.primary ? "" : "no-primary"}">
    ${header()}
    ${content}
  </section>
  ${primaryAction()}
  ${navigation()}
  <div class="home-indicator" aria-hidden="true"></div>
  ${sheet()}`;
