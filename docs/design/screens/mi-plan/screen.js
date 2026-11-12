const state = document.body.dataset.state;

// Same week as Reservar: Monday 9 to Sunday 15, today is Wednesday 11.
const lunPilates = { day: "Lun 9", what: "Pilates 18:00", center: "Mendoza", done: true };
const hoyYoga = { day: "Hoy", what: "Yoga 19:00", center: "Ovidio Lagos" };
const vieGym = { day: "Vie 13", what: "Gimnasio 20:00", center: "Mendoza" };

const states = {
  active: {
    plan: { title: "3 clases por semana", scope: "Cualquier actividad", image: "gimnasio.png", imageClass: "gym" },
    perWeek: 3,
    bookings: [lunPilates, hoyYoga],
  },
  specific: {
    plan: { title: "3 clases por semana", scope: "2 Pilates + 1 Yoga", image: "pilates.png", imageClass: "pilates" },
    perWeek: 3,
    // Pilates left: the free line names the activity of the remaining class.
    quotas: true,
    bookings: [lunPilates, hoyYoga],
  },
  "week-full": {
    plan: { title: "3 clases por semana", scope: "Cualquier actividad", image: "gimnasio.png", imageClass: "gym" },
    perWeek: 3,
    bookings: [lunPilates, hoyYoga, vieGym],
  },
  recovery: {
    plan: { title: "3 clases por semana", scope: "Cualquier actividad", image: "gimnasio.png", imageClass: "gym" },
    perWeek: 3,
    bookings: [lunPilates, hoyYoga],
    recovery: 1,
  },
  "no-plan": { noPlan: true },
};

const current = states[state] ?? states.active;
const main = document.querySelector(".phone");

const icons = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  free: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/></svg>',
  renew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 3v5h5"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 21v-5h-5"/></svg>',
  recovery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 8v4l2.5 2.5"/></svg>',
  plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M8 10h8M8 14h5"/></svg>',
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
      <h1 class="screen-title">Mi plan</h1>
      <button class="avatar-button" type="button" aria-label="Abrir perfil">
        <img class="avatar" src="../reservar/assets/avatar.jpg" alt="">
      </button>
    </header>`;
}

function planSection() {
  const { title, scope } = current.plan;
  return `
    <section class="block plan-block" aria-label="Tu plan">
      <h2 class="section-title">Tu plan</h2>
      <p class="plan-name">${title}</p>
      <ul class="info-lines">
        <li class="detail-line">${icons.plan}<span>${scope}</span></li>
      </ul>
    </section>`;
}

function month() {
  const recovery = current.recovery
    ? `<li class="detail-line">${icons.recovery}<span>Tenés <b>1 clase de recuperación</b> por una ausencia. Vence el 30 de noviembre.</span></li>`
    : "";
  return `
    <section class="block" aria-label="Este mes">
      <h2 class="section-title">Este mes</h2>
      <ul class="info-lines">
        ${recovery}
        <li class="detail-line">${icons.renew}<span>Tu plan se renueva el <b>1 de diciembre</b></span></li>
      </ul>
    </section>`;
}

function bookingLine(b) {
  const icon = b.done ? icons.check : icons.clock;
  return `<li class="detail-line">${icon}<span><b>${b.day}</b> · ${b.what} · ${b.center}</span></li>`;
}

function week() {
  const used = current.bookings.length;
  const left = current.perWeek - used;
  const full = left <= 0;
  const headline = full
    ? `Usaste tus ${current.perWeek} clases`
    : `Te ${left === 1 ? "queda" : "quedan"} ${left} de ${current.perWeek} clases`;

  const freeLine = full
    ? ""
    : `<li class="detail-line muted">${icons.free}<span>${left} ${left === 1 ? "clase" : "clases"}${current.quotas ? " de Pilates" : ""} sin reservar todavía</span></li>`;

  return `
    <section class="block" aria-label="Esta semana">
      <div class="block-head">
        <h2 class="section-title">Esta semana</h2>
        <span class="block-meta">Lun 9 al dom 15</span>
      </div>
      <div class="plan-banner${full ? " used" : ""}">
        <strong>${headline}</strong>
        <span>El lunes 16 vuelven tus ${current.perWeek} clases.</span>
      </div>
      <ul class="info-lines">
        ${current.bookings.map(bookingLine).join("")}
        ${freeLine}
      </ul>
    </section>`;
}

function noPlan() {
  return `
    <section class="empty-state no-plan">
      <div class="empty-mark" aria-hidden="true">${icons.plan}</div>
      <h1>Todavía no tenés un plan activo.</h1>
      <p>Cuando Kinaf te asigne uno, acá vas a ver tus clases de la semana. Si querés empezar, escribinos.</p>
    </section>`;
}

function bottomAction() {
  if (!current.noPlan) return "";
  return `
    <div class="bottom-action">
      <button class="action-button" type="button" data-primary>Escribir a Kinaf por WhatsApp</button>
    </div>`;
}

function navigation() {
  return `
    <div class="nav-wrap">
      <nav class="bottom-nav" data-bar="nav" aria-label="Navegación principal">
        <button class="nav-item" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/></svg>
          <span>Reservar</span>
        </button>
        <button class="nav-item active" type="button" aria-current="page">
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

const content = current.noPlan ? noPlan() : `${planSection()}${week()}${month()}`;

main.innerHTML = `
  ${statusBar()}
  <section class="app-shell">
    ${header()}
    ${content}
  </section>
  ${bottomAction()}
  ${navigation()}
  <div class="home-indicator" aria-hidden="true"></div>`;
