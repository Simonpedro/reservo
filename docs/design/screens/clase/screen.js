const state = document.body.dataset.state;

const classes = {
  pilates: {
    id: "pilates",
    title: "Pilates",
    weekday: "Miércoles 11",
    time: "18:00",
    instructor: "Agus",
    center: "Mendoza",
    wash: "celeste",
    image: "pilates.png",
    imageClass: "",
    spots: "2 lugares libres",
  },
  yoga: {
    id: "yoga",
    title: "Yoga",
    weekday: "Miércoles 11",
    time: "19:00",
    instructor: "Mica",
    center: "Ovidio Lagos",
    wash: "green",
    image: "yoga.png",
    imageClass: "yoga",
    spots: "2 lugares libres",
  },
  gimnasio: {
    id: "gimnasio",
    title: "Gimnasio",
    weekday: "Miércoles 11",
    time: "20:00",
    instructor: "Nico",
    center: "Mendoza",
    wash: "blue",
    image: "gimnasio.png",
    imageClass: "gym",
    spots: "Cupo completo",
  },
};

const states = {
  bookable: { classId: "pilates", mode: "bookable" },
  success: { classId: "pilates", mode: "success" },
  booked: { classId: "yoga", mode: "booked" },
  "cancel-confirm": { classId: "yoga", mode: "booked", sheet: "cancel" },
  "late-cancel": { classId: "yoga", mode: "late" },
  full: { classId: "gimnasio", mode: "full" },
  "not-in-plan": { classId: "gimnasio", mode: "excluded" },
};

const current = states[state] ?? states.bookable;
const cls = classes[current.classId];
const main = document.querySelector(".phone");

const icons = {
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  people:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  person:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.2-5 8-5s6.5 1.5 8 5"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  ban:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.2 16.8 16.8 7.2"/></svg>',
  back:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>',
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

function statusMeta() {
  const mode = current.mode;
  if (mode === "success" || mode === "booked" || mode === "late") {
    return { text: "Ya reservada", line: `<div class="detail-line">${icons.check}Ya reservada</div>` };
  }
  if (mode === "full") {
    return { text: "Cupo completo", line: `<div class="detail-line">${icons.people}Cupo completo</div>` };
  }
  if (mode === "excluded") {
    return { text: "No incluida en tu plan", line: `<div class="detail-line">${icons.ban}No incluida en tu plan</div>` };
  }
  return { text: cls.spots, line: `<div class="detail-line">${icons.people}${cls.spots}</div>` };
}

function notice() {
  if (current.mode === "success") {
    return `
      <section class="notice success" role="status">
        <strong>Listo, ya tenés tu lugar.</strong>
        <button class="undo-button" type="button">Deshacer</button>
      </section>`;
  }
  if (current.mode === "late") {
    return `
      <section class="notice" role="status">
        <strong>Faltan menos de 24 h.</strong>
        <span>Para cancelar, escribinos por WhatsApp desde tu perfil.</span>
      </section>`;
  }
  return "";
}

function explanation() {
  if (current.mode === "full") {
    return `<p class="clase-copy">Esta clase ya no tiene lugares libres.</p>`;
  }
  if (current.mode === "excluded") {
    return `<p class="clase-copy">Tu plan es de Yoga y Pilates, así que esta clase no se puede reservar.</p>`;
  }
  return "";
}

function action() {
  if (current.mode === "bookable") {
    return `
      <div class="clase-action">
        <button class="action-button book" type="button" data-primary>Reservar</button>
      </div>`;
  }
  if (current.mode === "booked") {
    return `
      <div class="clase-action">
        <button class="action-button cancel" type="button" data-primary>Cancelar reserva</button>
      </div>`;
  }
  return "";
}

function sheet() {
  if (current.sheet !== "cancel") return "";
  return `
    <div class="sheet-backdrop">
      <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-describedby="sheet-copy">
        <div class="sheet-handle" aria-hidden="true"></div>
        <h2 id="sheet-title">¿Cancelamos tu ${cls.title} de las ${cls.time}?</h2>
        <p id="sheet-copy">El lugar vuelve al cupo para que otra persona pueda reservar.</p>
        <div class="sheet-actions">
          <button class="sheet-action" type="button" data-primary>Sí, cancelar</button>
          <button class="sheet-action secondary" type="button">Mejor no</button>
        </div>
      </section>
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

const status = statusMeta();

main.innerHTML = `
  ${statusBar()}
  <section class="app-shell">
    <article class="clase-hero ${cls.wash}" aria-label="${cls.title}">
      <div class="hero-bar" data-bar="top">
        <button class="back-button" type="button" aria-label="Volver">
          ${icons.back}
        </button>
        <button class="avatar-button" type="button" aria-label="Abrir perfil">
          <img class="avatar" src="../reservar/assets/avatar.jpg" alt="">
        </button>
      </div>
      <h1 class="clase-title">${cls.title}</h1>
      <img class="cutout ${cls.imageClass}" src="../reservar/assets/${cls.image}" alt="">
    </article>
    ${notice()}
    <div class="clase-body">
      <div class="detail-line">${icons.clock}${cls.weekday} · ${cls.time}</div>
      <div class="detail-line">${icons.person}${cls.instructor}</div>
      <div class="detail-line">${icons.pin}${cls.center}</div>
      ${status.line}
      ${explanation()}
    </div>
    ${action()}
  </section>
  ${navigation()}
  <div class="home-indicator" aria-hidden="true"></div>
  ${sheet()}`;
