const ASSETS = "../reservar/assets";

const CATALOG = {
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
  chevron:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  back:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>',
};

const days = [
  ["lun", "9", "lunes"],
  ["mar", "10", "martes"],
  ["mié", "11", "miércoles"],
  ["jue", "12", "jueves"],
  ["vie", "13", "viernes"],
  ["sáb", "14", "sábado"],
  ["dom", "15", "domingo"],
];

const model = {
  view: "list",
  selectedDay: "mié",
  remaining: 1,
  booked: { pilates: false, yoga: true, gimnasio: false },
  excluded: [],
  full: { gimnasio: true },
  classId: "pilates",
  mode: "bookable",
  sheet: null,
  late: false,
};

const main = document.querySelector(".phone");

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

function classStatus(id) {
  if (model.booked[id]) return { text: "Ya reservada", line: `<div class="detail-line">${icons.check}Ya reservada</div>` };
  if (model.excluded.includes(id)) return { text: "No incluida en tu plan", line: `<div class="detail-line">${icons.ban}No incluida en tu plan</div>` };
  if (model.full[id]) return { text: "Cupo completo", line: `<div class="detail-line">${icons.people}Cupo completo</div>` };
  return { text: "2 lugares libres", line: `<div class="detail-line">${icons.people}2 lugares libres</div>` };
}

function modeFor(id) {
  if (model.booked[id] && model.late) return "late";
  if (model.booked[id] && id === model.classId && model.mode === "success") return "success";
  if (model.booked[id]) return "booked";
  if (model.excluded.includes(id)) return "excluded";
  if (model.full[id]) return "full";
  return "bookable";
}

function bookedDays() {
  const marks = ["lun"];
  if (model.booked.yoga || model.booked.pilates) marks.push("mié");
  return marks;
}

function renderList() {
  const usedMonday = 1;
  const remaining = 3 - usedMonday - (Number(model.booked.pilates) + Number(model.booked.yoga) + Number(model.booked.gimnasio));
  const hasRemaining = remaining > 0;
  const booked = bookedDays();

  const week = days
    .map(([label, number, name]) => {
      const isSelected = label === model.selectedDay;
      const isBooked = booked.includes(label);
      const classes = `day${isSelected ? " selected" : ""}${isBooked ? " booked" : ""}`;
      const bookedHint = isBooked ? ", tenés una clase reservada" : "";
      return `
        <button class="${classes}" type="button" data-day="${label}" aria-pressed="${isSelected}" aria-label="${name} ${number}${bookedHint}">
          <span>${label}</span><strong>${number}</strong>
        </button>`;
    })
    .join("");

  const cards = ["pilates", "yoga", "gimnasio"]
    .map((id) => {
      const cls = CATALOG[id];
      const status = classStatus(id);
      return `
        <a class="class-card ${cls.wash}" href="#clase-${id}" data-class="${id}" aria-label="${cls.title}, ${cls.time}, ${cls.instructor}, ${cls.center}, ${status.text}">
          <div class="card-topline">
            <h3>${cls.title}</h3>
            <span class="card-open" aria-hidden="true">${icons.chevron}</span>
          </div>
          <div class="details">
            <div class="detail-line">${icons.clock}${cls.time} · ${cls.instructor}</div>
            <div class="detail-line">${icons.pin}${cls.center}</div>
            ${status.line}
          </div>
          <img class="cutout ${cls.imageClass}" src="${ASSETS}/${cls.image}" alt="">
        </a>`;
    })
    .join("");

  const empty = model.selectedDay === "dom";

  const banner = hasRemaining
    ? `<section class="plan-banner" aria-label="Resumen del plan">
        <strong>Te queda ${remaining} de 3 clases</strong>
        <span>Esta semana · 3 clases por semana</span>
      </section>`
    : "";

  const mid = empty
    ? `${banner}
      <div class="week-strip" data-group="days" aria-label="Días de la semana">${week}</div>
      <section class="empty-state">
        <div class="empty-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/></svg>
        </div>
        <h1>Por ahora no hay clases todavía.</h1>
        <p>Probá otro día.</p>
      </section>`
    : `${banner}
      <div class="week-strip" data-group="days" aria-label="Días de la semana">${week}</div>
      <div class="list-heading"><h1 class="section-title">Clases del miércoles</h1></div>
      <div class="class-stack" data-group="classes">${cards}</div>`;

  return `
    ${statusBar()}
    <section class="app-shell">
      <header class="topline" data-bar="top">
        <div class="greeting">
          <div>
            <div class="hello">¡Buenas,</div>
            <div class="person-name">Sofi!</div>
          </div>
        </div>
        <button class="avatar-button" type="button" aria-label="Abrir perfil">
          <img class="avatar" src="${ASSETS}/avatar.jpg" alt="">
        </button>
      </header>
      ${mid}
    </section>
    ${navigation()}
    <div class="home-indicator" aria-hidden="true"></div>`;
}

function renderDetail() {
  const cls = CATALOG[model.classId];
  const mode = model.mode;
  let status;
  if (mode === "success" || mode === "booked" || mode === "late") {
    status = { text: "Ya reservada", line: `<div class="detail-line">${icons.check}Ya reservada</div>` };
  } else if (mode === "full") {
    status = { text: "Cupo completo", line: `<div class="detail-line">${icons.people}Cupo completo</div>` };
  } else if (mode === "excluded") {
    status = { text: "No incluida en tu plan", line: `<div class="detail-line">${icons.ban}No incluida en tu plan</div>` };
  } else {
    status = { text: cls.spots, line: `<div class="detail-line">${icons.people}${cls.spots}</div>` };
  }

  const notice =
    mode === "success"
      ? `<section class="notice success" role="status">
          <strong>Listo, ya tenés tu lugar.</strong>
          <button class="undo-button" type="button" data-action="undo">Deshacer</button>
        </section>`
      : mode === "late"
        ? `<section class="notice" role="status">
            <strong>Faltan menos de 24 h.</strong>
            <span>Para cancelar, escribinos por WhatsApp desde tu perfil.</span>
          </section>`
        : "";

  const explanation =
    mode === "full"
      ? `<p class="clase-copy">Esta clase ya no tiene lugares libres.</p>`
      : mode === "excluded"
        ? `<p class="clase-copy">Tu plan es de Yoga y Pilates, así que esta clase no se puede reservar.</p>`
        : "";

  const action =
    mode === "bookable"
      ? `<div class="clase-action"><button class="action-button book" type="button" data-action="book" data-primary>Reservar</button></div>`
      : mode === "booked"
        ? `<div class="clase-action"><button class="action-button cancel" type="button" data-action="cancel" data-primary>Cancelar reserva</button></div>`
        : "";

  const sheet =
    model.sheet === "cancel"
      ? `<div class="sheet-backdrop">
          <section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-describedby="sheet-copy">
            <div class="sheet-handle" aria-hidden="true"></div>
            <h2 id="sheet-title">¿Cancelamos tu ${cls.title} de las ${cls.time}?</h2>
            <p id="sheet-copy">El lugar vuelve al cupo para que otra persona pueda reservar.</p>
            <div class="sheet-actions">
              <button class="sheet-action" type="button" data-action="confirm-cancel" data-primary>Sí, cancelar</button>
              <button class="sheet-action secondary" type="button" data-action="dismiss-sheet">Mejor no</button>
            </div>
          </section>
        </div>`
      : "";

  return `
    ${statusBar()}
    <section class="app-shell">
      <article class="clase-hero ${cls.wash}" data-hero="${cls.id}" aria-label="${cls.title}">
        <div class="hero-bar" data-bar="top">
          <button class="back-button" type="button" data-action="back" aria-label="Volver">${icons.back}</button>
          <button class="avatar-button" type="button" aria-label="Abrir perfil">
            <img class="avatar" src="${ASSETS}/avatar.jpg" alt="">
          </button>
        </div>
        <h1 class="clase-title">${cls.title}</h1>
        <img class="cutout ${cls.imageClass}" src="${ASSETS}/${cls.image}" alt="">
      </article>
      ${notice}
      <div class="clase-body">
        <div class="detail-line">${icons.clock}${cls.weekday} · ${cls.time}</div>
        <div class="detail-line">${icons.person}${cls.instructor}</div>
        <div class="detail-line">${icons.pin}${cls.center}</div>
        ${status.line}
        ${explanation}
      </div>
      ${action}
    </section>
    ${navigation()}
    <div class="home-indicator" aria-hidden="true"></div>
    ${sheet}`;
}

function paint() {
  document.body.dataset.view = model.view;
  main.innerHTML = model.view === "detail" ? renderDetail() : renderList();
}

function clearTransitionNames() {
  document.querySelectorAll("[style*='view-transition-name']").forEach((el) => {
    el.style.viewTransitionName = "";
  });
}

function tagCard(id) {
  const card = document.querySelector(`.class-card[data-class="${id}"]`);
  if (!card) return;
  card.style.viewTransitionName = "clase-fondo";
  const title = card.querySelector("h3");
  const photo = card.querySelector(".cutout");
  if (title) title.style.viewTransitionName = "clase-titulo";
  if (photo) photo.style.viewTransitionName = "clase-foto";
}

function tagHero() {
  const hero = document.querySelector(".clase-hero");
  if (!hero) return;
  hero.style.viewTransitionName = "clase-fondo";
  const title = hero.querySelector(".clase-title");
  const photo = hero.querySelector(".cutout");
  if (title) title.style.viewTransitionName = "clase-titulo";
  if (photo) photo.style.viewTransitionName = "clase-foto";
}

async function withTransition(prepare, update) {
  prepare();
  const go = () => {
    update();
    paint();
  };
  if (typeof document.startViewTransition === "function") {
    try {
      const vt = document.startViewTransition(go);
      await vt.finished;
    } catch (err) {
      if (err && err.name !== "AbortError") console.warn(err);
    }
  } else {
    go();
  }
  clearTransitionNames();
}

async function openClass(id) {
  model.classId = id;
  model.mode = modeFor(id);
  model.sheet = null;
  await withTransition(
    () => tagCard(id),
    () => {
      model.view = "detail";
    },
  );
  tagHero();
  clearTransitionNames();
}

async function goBack() {
  const id = model.classId;
  if (model.sheet) {
    model.sheet = null;
    paint();
    return;
  }
  await withTransition(
    () => tagHero(),
    () => {
      model.view = "list";
      if (model.mode === "success") model.mode = "booked";
      model.sheet = null;
    },
  );
  tagCard(id);
  clearTransitionNames();
}

function bind() {
  main.addEventListener("click", (event) => {
    const day = event.target.closest("[data-day]");
    if (day && model.view === "list") {
      event.preventDefault();
      model.selectedDay = day.dataset.day;
      paint();
      return;
    }

    const card = event.target.closest("[data-class]");
    if (card && model.view === "list") {
      event.preventDefault();
      openClass(card.dataset.class);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (!action) return;
    event.preventDefault();
    const name = action.dataset.action;
    if (name === "back") goBack();
    if (name === "book") {
      model.booked[model.classId] = true;
      model.mode = "success";
      paint();
    }
    if (name === "undo") {
      model.booked[model.classId] = false;
      model.mode = "bookable";
      paint();
    }
    if (name === "cancel") {
      model.sheet = "cancel";
      paint();
    }
    if (name === "dismiss-sheet") {
      model.sheet = null;
      paint();
    }
    if (name === "confirm-cancel") {
      model.booked[model.classId] = false;
      model.sheet = null;
      model.mode = "bookable";
      paint();
    }
  });
}

paint();
bind();

window.__reservoPrototype = {
  model,
  paint,
  openClass,
  goBack,
  tagCard,
  tagHero,
  withTransition,
};
