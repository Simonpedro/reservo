const state = document.body.dataset.state;

const bookedDaysDefault = ["lun", "mié"];

const states = {
  list: {
    hasRemaining: true,
    remaining: 1,
    bookedDays: bookedDaysDefault,
  },
  tapped: {
    hasRemaining: true,
    remaining: 1,
    bookedDays: bookedDaysDefault,
    pressed: "pilates",
  },
  empty: {
    empty: true,
    selectedDay: "dom",
    hasRemaining: true,
    remaining: 1,
    bookedDays: bookedDaysDefault,
  },
  recovery: {
    hasRemaining: true,
    remaining: 1,
    recovery: true,
    bookedDays: bookedDaysDefault,
  },
  "week-full": {
    bookedPilates: true,
    bookedDays: bookedDaysDefault,
  },
  "not-in-plan": {
    hasRemaining: true,
    remaining: 1,
    bookedDays: bookedDaysDefault,
    excluded: ["gimnasio"],
  },
};

const current = states[state] ?? states.list;
const main = document.querySelector(".phone");

const icons = {
  clock:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  people:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  ban:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.2 16.8 16.8 7.2"/></svg>',
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
  if (!current.hasRemaining) return "";
  const left = current.remaining ?? 1;

  if (current.recovery) {
    return `
      <section class="plan-banner recovery" aria-label="Resumen del plan">
        <strong>Te queda ${left} de 3 clases</strong>
        <span>Esta semana · 3 clases por semana</span>
        <span class="recovery-line">Tenés 1 clase de recuperación este mes.</span>
      </section>`;
  }

  return `
    <section class="plan-banner" aria-label="Resumen del plan">
      <strong>Te queda ${left} de 3 clases</strong>
      <span>Esta semana · 3 clases por semana</span>
    </section>`;
}

const days = [
  ["lun", "9", "lunes"],
  ["mar", "10", "martes"],
  ["mié", "11", "miércoles"],
  ["jue", "12", "jueves"],
  ["vie", "13", "viernes"],
  ["sáb", "14", "sábado"],
  ["dom", "15", "domingo"],
];

function weekStrip() {
  const selected = current.selectedDay ?? "mié";
  const bookedDays = current.bookedDays ?? [];
  return `
    <div class="week-strip" data-group="days" aria-label="Días de la semana">
      ${days
        .map(([label, number, name]) => {
          const isSelected = label === selected;
          const isBooked = bookedDays.includes(label);
          const classes = `day${isSelected ? " selected" : ""}${isBooked ? " booked" : ""}`;
          const bookedHint = isBooked ? ", tenés una clase reservada" : "";
          return `
            <button class="${classes}" type="button" aria-pressed="${isSelected}" aria-label="${name} ${number}${bookedHint}">
              <span>${label}</span><strong>${number}</strong>
            </button>`;
        })
        .join("")}
    </div>`;
}

function isBooked(id) {
  if (id === "pilates") return !!current.bookedPilates;
  if (id === "yoga") return true;
  return false;
}

function statusLineFor(id, status) {
  const booked = isBooked(id);
  const full = status === "full";
  const excluded = status === "excluded" || (current.excluded || []).includes(id);
  if (booked) return { text: "Ya reservada", line: `<div class="detail-line">${icons.check}Ya reservada</div>` };
  if (excluded) return { text: "No incluida en tu plan", line: `<div class="detail-line">${icons.ban}No incluida en tu plan</div>` };
  if (full) return { text: "Cupo completo", line: `<div class="detail-line">${icons.people}Cupo completo</div>` };
  return { text: "2 lugares libres", line: `<div class="detail-line">${icons.people}2 lugares libres</div>` };
}

function classCard({ id, title, time, instructor, center, wash, image, imageClass = "", status }) {
  const { text: statusText, line: statusLine } = statusLineFor(id, status);
  const pressed = current.pressed === id;

  return `
    <a class="class-card ${wash}${pressed ? " pressed" : ""}" href="#clase-${id}" aria-label="${title}, ${time}, ${instructor}, ${center}, ${statusText}">
      <div class="card-topline">
        <h3>${title}</h3>
        <span class="card-open" aria-hidden="true">${icons.chevron}</span>
      </div>
      <div class="details">
        <div class="detail-line">${icons.clock}${time} · ${instructor}</div>
        <div class="detail-line">${icons.pin}${center}</div>
        ${statusLine}
      </div>
      <img class="cutout ${imageClass}" src="assets/${image}" alt="">
    </a>`;
}

function classes() {
  return `
    <div class="class-stack" data-group="classes">
      ${classCard({
        id: "pilates",
        title: "Pilates",
        time: "18:00",
        instructor: "Agus",
        center: "Mendoza",
        wash: "celeste",
        image: "pilates.png",
      })}
      ${classCard({
        id: "yoga",
        title: "Yoga",
        time: "19:00",
        instructor: "Mica",
        center: "Ovidio Lagos",
        wash: "green",
        image: "yoga.png",
        imageClass: "yoga",
      })}
      ${classCard({
        id: "gimnasio",
        title: "Gimnasio",
        time: "20:00",
        instructor: "Nico",
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

const content = current.empty
  ? `${banner()}${weekStrip()}${emptyState()}`
  : `${banner()}${weekStrip()}${listHeading()}${classes()}`;

main.innerHTML = `
  ${statusBar()}
  <section class="app-shell">
    ${header()}
    ${content}
  </section>
  ${navigation()}
  <div class="home-indicator" aria-hidden="true"></div>`;
