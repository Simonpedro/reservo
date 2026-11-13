// Reservo · prototipo navegable. Sin dependencias: abrir index.html en Chrome o Safari 18+.

const I = {
  clock: '<path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/>',
  pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  person: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.2-5 8-5s6.5 1.5 8 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="M7.2 16.8 16.8 7.2"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  back: '<path d="M15 6 9 12l6 6"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M13 6v12" stroke-dasharray="2 2.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  calendarOff: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9.5 13.5 5 5M14.5 13.5l-5 5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M8 15h3"/>',
  list: '<path d="M4 5h16M4 12h16M4 19h10"/><circle cx="18" cy="19" r="2"/>',
  home: '<path d="M4 19V8l8-5 8 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M9 21v-7h6v7"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19Z"/><path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1.2 2 .9c-.2 1.2-1.2 1.8-2.3 1.8A6.3 6.3 0 0 1 7.5 9.3c0-1.1.6-2.1 1.8-2.3l.9 2Z"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v4"/><rect x="3" y="7" width="18" height="13" rx="3"/><path d="M16 14h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[name]}</svg>`;
const line = (ic, text, cls = "detail-line") => `<div class="${cls}">${icon(ic)}<span>${text}</span></div>`;
const info = (ic, text, muted) => `<div class="info-line${muted ? " muted" : ""}">${icon(ic)}<span>${text}</span></div>`;
const aviso = (ic, strong, span, extra = "") =>
  `<section class="aviso${extra ? " inline-undo" : ""}" role="status">${icon(ic)}<div><strong>${strong}</strong>${span ? `<span>${span}</span>` : ""}</div>${extra}</section>`;
const btn = (label, act, attrs = "") => `<button class="btn" type="button" data-act="${act}" data-primary ${attrs}>${label}</button>`;
const btn2 = (label, act, attrs = "") => `<button class="btn secondary" type="button" data-act="${act}" ${attrs}>${label}</button>`;
const esc = (s) => String(s).replace(/"/g, "&quot;");

// ---------------------------------------------------------------- modelo
function freshModel() {
  return {
    role: "cliente",
    screen: "login",
    params: {},
    stack: [],
    sheet: null,
    loginError: false,
    c: {
      hasPlan: true, hasSchedule: true, plan: "combinado",
      cancelled: [], pendings: [], extras: [], closures: [],
      justCancelled: null, justBooked: null, pay: "pendiente", file: false, justSent: false,
    },
    a: {
      absent: [], justAbsent: null, suspended: [], closures: [], search: "",
      assign: { step: 1, plan: "combinado", slots: [], from: 16 }, capError: false,
      closeCenter: "todos", plan: "combinado", justReviewed: null,
    },
    selDay: null,
  };
}
let M = freshModel();
const main = () => document.querySelector(".phone");

// ---------------------------------------------------------------- reglas del cliente
const sofiPlan = () => planById(M.c.plan);
const sofiFixed = () => (M.c.plan === "yogapil" ? [{ slot: "lun-19-yog", quota: 0 }, { slot: "jue-18-pil", quota: 1 }] : SOFI_FIXED);
function sofiFixedOn(d) {
  if (!M.c.hasPlan || !M.c.hasSchedule) return [];
  return sofiFixed().filter((f) => slotById(f.slot).day === dow(d)).map((f) => ({ ...session(sid(f.slot, d)), quota: f.quota, kind: "fija" }));
}
const isClosed = (d) => M.c.closures.includes(d) || M.a.closures.includes(d);
const isSuspended = (s) => isClosed(s.d) || M.a.suspended.includes(s.id);
function myBookings(from, to) {
  const out = [];
  for (let d = from; d <= to; d++) {
    for (const s of sofiFixedOn(d)) if (!M.c.cancelled.includes(s.id)) out.push(s);
    for (const e of M.c.extras) if (session(e.session).d === d) out.push({ ...session(e.session), kind: "pendiente", pending: e.pending });
  }
  return out.sort((x, y) => x.d - y.d || x.slot.time.localeCompare(y.slot.time));
}
const findMine = (id) => myBookings(TODAY, 29).find((b) => b.id === id);
const within24h = (s) => s.d <= TODAY; // hoy 9:41: las clases de hoy son < 24 h; las de mañana desde las 10:00 ya no.
function quotaActs(b) { return b.kind === "pendiente" ? b.pendingActs : sofiPlan().quotas[b.quota].acts; }
function pendingFits(p, s) { return p.acts === "any" || p.acts.includes(s.slot.act); }
function freeSpots(s) {
  let taken = FIXED_COUNT[s.slot.id];
  if ((s.d * 3 + s.slot.day) % 4 === 1 && taken > 0 && taken < s.slot.cap) taken -= 1;
  if (M.c.cancelled.includes(s.id)) taken -= 1;
  taken -= M.a.absent.filter((k) => k.startsWith(s.id + ":")).length;
  taken += M.c.extras.filter((e) => e.session === s.id).length;
  return Math.max(0, s.slot.cap - taken);
}
const spotsText = (n) => (n === 0 ? "Cupo completo" : n === 1 ? "1 lugar libre" : `${n} lugares libres`);
const pendingExpiry = () => Math.min(...M.c.pendings.map((p) => p.expires));
const pendingActsText = () => {
  const any = M.c.pendings.some((p) => p.acts === "any");
  if (any) return "Vale para cualquier actividad de tu plan.";
  const acts = [...new Set(M.c.pendings.flatMap((p) => p.acts))];
  return `Vale para ${acts.map((a) => ACTIVITIES[a].name).join(" o ")}.`;
};
const pendingCountText = () => (M.c.pendings.length === 1 ? "Tenés 1 clase pendiente" : `Tenés ${M.c.pendings.length} clases pendientes`);

function cancelBooking(id) {
  const b = findMine(id);
  if (b.kind === "fija") {
    M.c.cancelled.push(id);
    M.c.pendings.push({ id: "p-" + id, from: id, acts: sofiPlan().quotas[b.quota].acts, expires: expiryFor(b.d), reason: "Cancelaste a tiempo" });
  } else {
    const e = M.c.extras.find((x) => x.session === id);
    M.c.extras = M.c.extras.filter((x) => x !== e);
    M.c.pendings.push(e.pendingObj);
  }
  M.c.justCancelled = { id, kind: b.kind };
}
function undoCancel() {
  const { id, kind } = M.c.justCancelled;
  if (kind === "fija") {
    M.c.cancelled = M.c.cancelled.filter((x) => x !== id);
    M.c.pendings = M.c.pendings.filter((p) => p.from !== id);
  } else {
    const p = M.c.pendings.pop();
    M.c.extras.push({ session: id, pending: p.id, pendingObj: p });
  }
  M.c.justCancelled = null;
}
function usePending(id) {
  const s = session(id);
  const p = [...M.c.pendings].sort((a, b) => a.expires - b.expires).find((x) => pendingFits(x, s));
  M.c.pendings = M.c.pendings.filter((x) => x !== p);
  M.c.extras.push({ session: id, pending: p.id, pendingObj: p });
  M.c.justBooked = id;
}
function undoBook() {
  const e = M.c.extras.find((x) => x.session === M.c.justBooked);
  M.c.extras = M.c.extras.filter((x) => x !== e);
  M.c.pendings.push(e.pendingObj);
  M.c.justBooked = null;
}

// ---------------------------------------------------------------- piezas comunes
function statusBar() {
  return `<div class="statusbar" aria-hidden="true"><span>9:41</span><span class="status-icons">
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 9.5h1.7V7.4H1v2.1Zm4.1 0h1.7V5.3H5.1v4.2Zm4.1 0h1.7V3.1H9.2v6.4Zm4.1 0H15V1h-1.7v8.5Z" fill="currentColor"/></svg>
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none"><path d="M1 4.2A8.7 8.7 0 0 1 7 2a8.7 8.7 0 0 1 6 2.2M3.2 6.5A5.6 5.6 0 0 1 7 5.1c1.4 0 2.7.5 3.8 1.4M5.5 8.7A2.3 2.3 0 0 1 7 8.2c.6 0 1.1.2 1.5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x=".5" y=".5" width="18" height="10" rx="3" stroke="currentColor"/><rect x="2.5" y="2.5" width="13" height="6" rx="1.5" fill="currentColor"/><path d="M20 4v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </span></div>`;
}
const TABS = {
  cliente: [["mis-clases", "Mis clases", "list"], ["mi-plan", "Mi plan", "home"], ["pagos", "Pagos", "card"]],
  admin: [["admin-hoy", "Hoy", "sun"], ["admin-clientes", "Clientes", "users"], ["admin-agenda", "Agenda", "calendar"], ["admin-pagos", "Pagos", "card"]],
};
function nav(role, active) {
  const tabs = TABS[role];
  return `<div class="nav-wrap"><nav class="bottom-nav n${tabs.length}" data-bar="nav" aria-label="Navegación principal">
    ${tabs.map(([id, label, ic]) => `<button class="nav-item${id === active ? " active" : ""}" type="button" data-tab="${id}"${id === active ? ' aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></button>`).join("")}
  </nav></div>`;
}
function header(hello, name, avatarHtml) {
  return `<header class="topline" data-bar="top"><div class="greeting"><div><div class="hello">${hello}</div><div class="person-name">${name}</div></div></div>
    <button class="avatar-button" type="button" data-go="${M.role === "admin" ? "admin-ajustes" : "perfil"}" aria-label="${M.role === "admin" ? "Abrir ajustes" : "Abrir perfil"}">${avatarHtml}</button></header>`;
}
const sofiAvatar = () => `<img class="avatar" src="${ASSETS}/avatar.jpg" alt="">`;
const initialsAvatar = (t) => `<span class="avatar-initials" aria-hidden="true">${t}</span>`;
const innerBar = (extra = "") => `<div class="inner-bar" data-bar="top"><button class="back-button" type="button" data-act="back" aria-label="Volver">${icon("back")}</button>${extra}</div>`;

function classCard(s, lines, opts = {}) {
  const muted = opts.muted ? " muted" : "";
  return `<a class="class-card ${s.act.wash}${muted}" href="#" data-open="${s.id}" data-target="${opts.target}" aria-label="${esc(`${s.act.name}, ${dayLong(s.d)}, ${s.slot.time}, ${s.slot.center}${opts.label ? ", " + opts.label : ""}`)}">
    <div class="card-topline"><h3>${s.act.name}</h3><span class="card-open" aria-hidden="true">${icon("chevron")}</span></div>
    <div class="details">${lines.join("")}</div>
    <img class="cutout ${s.act.imageClass}" src="${ASSETS}/${s.act.image}" alt="">
  </a>`;
}
function hero(s, muted) {
  return `<article class="clase-hero ${s.act.wash}${muted ? " muted" : ""}" data-hero="${s.id}">
    <div class="hero-bar" data-bar="top"><button class="back-button" type="button" data-act="back" aria-label="Volver">${icon("back")}</button></div>
    <h1 class="clase-title">${s.act.name}</h1>
    <img class="cutout ${s.act.imageClass}" src="${ASSETS}/${s.act.image}" alt="">
  </article>`;
}
function emptyState(ic, title, text) {
  return `<section class="empty-state"><div class="empty-mark" aria-hidden="true">${icon(ic)}</div><h2>${title}</h2><p>${text}</p></section>`;
}
function sheet(title, text, primary, act, secondary = "Mejor no") {
  return `<div class="sheet-backdrop" data-act="dismiss"><section class="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <div class="sheet-handle" aria-hidden="true"></div><h2 id="sheet-title">${title}</h2><p>${text}</p>
    <div class="sheet-actions">${btn(primary, act)}${btn2(secondary, "dismiss")}</div></section></div>`;
}
// Aviso de clase pendiente pegado a su acción, anclado abajo (mismo bloque en Mis clases y Mi plan).
const pendingDock = () => `${aviso("ticket", pendingCountText(), `${pendingActsText()} Usala hasta el domingo ${pendingExpiry()}.`)}${btn("Elegir clase", "go-elegir")}`;
const whatsappBtn = () => btn(`${icon("whatsapp")}Escribir a Kinaf`, "whatsapp");

// ---------------------------------------------------------------- pantallas del cliente
const V = {};

V.login = () => ({
  body: `<div class="login">
    <div class="brand"><svg viewBox="0 0 52 46" aria-hidden="true"><path d="M6 30 26 14l20 16" fill="none" stroke="#8cc463" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 40 26 24l20 16" fill="none" stroke="#5ab8f0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20 26 4l20 16" fill="none" stroke="#3e88f0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div><strong>Kinaf</strong><span>Tus clases, con Reservo</span></div></div>
    <h1 class="screen-title">Ingresá</h1>
    ${M.loginError ? aviso("alert", "El email o la contraseña no coinciden.", "Revisalos y probá de nuevo.") : ""}
    <div class="field"><label for="email">Email</label><input id="email" class="input" type="email" value="sofi@gmail.com" autocomplete="username"></div>
    <div class="field"><label for="pass">Contraseña</label><input id="pass" class="input" type="password" value="${M.loginError ? "12345" : "reservo2026"}" autocomplete="current-password"></div>
  </div>`,
  dock: btn("Ingresar", "login"),
});

V["mis-clases"] = () => {
  const c = M.c;
  if (!c.hasPlan) {
    return { nav: "cliente", tab: "mis-clases",
      body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Mis clases</h1>
        ${emptyState("calendar", "Todavía no tenés un plan.", "Escribile a Kinaf para elegir tu plan y tus horarios. Después tus clases aparecen acá.")}`,
      dock: whatsappBtn() };
  }
  if (!c.hasSchedule) {
    return { nav: "cliente", tab: "mis-clases",
      body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Mis clases</h1>
        ${emptyState("repeat", "Kinaf está armando tu horario.", "Ya tenés tu plan. Cuando Kinaf cargue tus horarios fijos, tus clases aparecen acá.")}`,
      dock: whatsappBtn() };
  }
  const groups = [["Esta semana", TODAY, 15], ["Semana que viene", 16, 22]];
  const pend = c.pendings.length > 0;
  const lists = groups.map(([title, a, b]) => {
    const items = myBookings(a, b);
    if (!items.length) return "";
    return `<h2 class="group-title">${title}</h2><div class="class-stack" data-group="classes">${items.map((s) => {
      const susp = isSuspended(s);
      const lines = [line("clock", `${dayLabel(s.d)} · ${s.slot.time} · ${s.slot.instructor}`), line("pin", s.slot.center)];
      if (susp) lines.push(line("calendarOff", "Suspendida · Feriado"));
      else if (s.kind === "pendiente") lines.push(line("ticket", "Con tu clase pendiente"));
      return classCard(s, lines, { target: "clase", muted: susp, label: susp ? "suspendida por feriado" : "" });
    }).join("")}</div>`;
  }).join("");
  return {
    nav: "cliente", tab: "mis-clases",
    body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Mis clases</h1>
      ${lists}`,
    dock: pend ? pendingDock() : null,
  };
};

V.clase = () => {
  const id = M.params.id;
  const s = session(id);
  const mine = findMine(id);
  const c = M.c;
  const lines = [info("clock", `${dayLong(s.d)} · ${s.slot.time}`), info("person", s.slot.instructor), info("pin", s.slot.center)];
  let notice = "", dock = null, extra = "", muted = false;
  if (c.justCancelled && c.justCancelled.id === id) {
    lines.push(info("ban", "No vas esta vez"));
    notice = aviso("check", `Listo, no vas el ${dayName(s.d)} ${s.d}.`, `${pendingCountText()} hasta el domingo ${pendingExpiry()}.`, `<button class="link" type="button" data-act="undo-cancel">Deshacer</button>`);
    dock = btn("Elegir clase", "go-elegir");
  } else if (c.justBooked === id) {
    lines.push(info("ticket", "Con tu clase pendiente"));
    notice = aviso("check", "Listo, ya tenés tu lugar.", "", `<button class="link" type="button" data-act="undo-book">Deshacer</button>`);
  } else if (mine && isSuspended(mine)) {
    muted = true;
    lines.push(info("calendarOff", "Suspendida · Feriado"));
    extra = `<p class="copy">Ese día Kinaf está cerrado por el feriado. Te dimos una clase pendiente para usar hasta el domingo ${expiryFor(s.d)}.</p>`;
    if (c.pendings.length) dock = btn("Elegir clase", "go-elegir");
  } else if (mine && within24h(mine)) {
    lines.push(info(mine.kind === "fija" ? "repeat" : "ticket", mine.kind === "fija" ? "Tu horario fijo" : "Con tu clase pendiente"));
    notice = aviso("info", "Faltan menos de 24 h.", "Desde la app ya no se puede cancelar. Si no podés venir, avisale a Kinaf.");
    dock = whatsappBtn();
  } else if (mine) {
    lines.push(info(mine.kind === "fija" ? "repeat" : "ticket", mine.kind === "fija" ? "Tu horario fijo" : "Con tu clase pendiente"));
    extra = `<p class="copy">Si no podés venir, avisá con 24 h o más y te queda una clase pendiente para otro día.</p>`;
    dock = btn("No voy a ir", "ask-cancel");
  } else {
    const free = freeSpots(s);
    lines.push(info("people", spotsText(free)));
    if (free === 0) extra = `<p class="copy">Esta clase ya no tiene lugares libres. Probá otro horario.</p>`;
    else dock = btn("Usar clase pendiente", "use-pending");
  }
  const sh = M.sheet === "cancel"
    ? sheet(`¿No vas el ${dayName(s.d)} ${s.d}?`, `Liberamos tu lugar y te damos una clase pendiente para usar hasta el domingo ${expiryFor(s.d)}. Tu horario fijo sigue igual.`, "Sí, no voy", "confirm-cancel")
    : "";
  return { body: `${hero(s, muted)}${notice}<div class="clase-body">${lines.join("")}${extra}</div>`, dock, sheet: sh, vt: true };
};

V["elegir-clase"] = () => {
  const exp = pendingExpiry();
  const days = [];
  for (let d = TODAY + 1; d <= exp; d++) days.push(d);
  const sel = M.selDay && days.includes(M.selDay) ? M.selDay : days[0];
  const strip = days.map((d) => `<button class="day${d === sel ? " selected" : ""}" type="button" data-day="${d}" aria-pressed="${d === sel}" aria-label="${dayLong(d)}"><span>${WEEKDAYS_SHORT[dow(d)]}</span><strong>${d}</strong></button>`).join("");
  let list;
  if (isClosed(sel)) {
    list = emptyState("calendarOff", "Ese día Kinaf está cerrado.", "Es feriado. Probá otro día.");
  } else {
    const mineIds = myBookings(TODAY, 29).map((b) => b.id);
    const items = sessionsOn(sel).filter((s) => !mineIds.includes(s.id) && M.c.pendings.some((p) => pendingFits(p, s)));
    list = items.length
      ? `<h2 class="group-title">Clases del ${dayName(sel)} ${sel}</h2><div class="class-stack" data-group="classes">${items.map((s) => {
          const free = freeSpots(s);
          return classCard(s, [line("clock", `${s.slot.time} · ${s.slot.instructor}`), line("pin", s.slot.center), line("people", spotsText(free))], { target: "clase", label: spotsText(free) });
        }).join("")}</div>`
      : emptyState("calendar", "Este día no hay clases para tu clase pendiente.", "Probá otro día.");
  }
  return {
    body: `${innerBar()}<h1 class="screen-title">Elegir clase</h1>
      <p class="screen-sub">${pendingCountText()}. ${pendingActsText()} Usala hasta el domingo ${exp}.</p>
      <div class="day-strip" data-group="days" aria-label="Días">${strip}</div>${list}`,
  };
};

V["mi-plan"] = () => {
  const c = M.c;
  if (!c.hasPlan) {
    return { nav: "cliente", tab: "mi-plan",
      body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Mi plan</h1>
        ${emptyState("home", "Todavía no tenés un plan.", "Escribile a Kinaf para elegir tu plan y tus horarios.")}`,
      dock: whatsappBtn() };
  }
  const p = sofiPlan();
  const schedule = c.hasSchedule
    ? `<div class="info-lines">${sofiFixed().map((f) => { const s = slotById(f.slot); return info("repeat", `${cap(WEEKDAYS[s.day])} ${s.time} · ${ACTIVITIES[s.act].name} · ${s.center}`); }).join("")}</div>`
    : `<p class="copy">Kinaf todavía no cargó tus horarios.</p>`;
  const pend = c.pendings.length > 0;
  return {
    nav: "cliente", tab: "mi-plan",
    body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Mi plan</h1>
      <section class="block"><h2 class="section-title">Tu horario</h2>${schedule}</section>
      <section class="block"><h2 class="section-title">Tu plan</h2><p class="info-big">${p.name}</p>
        <div class="info-lines">${p.quotas.map((q) => info("layers", cap(quotaText(q)) + " por semana")).join("")}
        ${info("calendar", "Se renueva el 1 de diciembre")}</div></section>
      <section class="block"><p class="copy">Tu horario y tu plan los cambia Kinaf.</p><div class="end-actions" style="margin-top:4px">${btn2("Escribir a Kinaf", "whatsapp")}</div></section>`,
    dock: pend ? pendingDock() : null,
  };
};

V.pagos = () => {
  const st = M.c.pay;
  const status = {
    pendiente: info("clock", "Pendiente · pagá hasta el 10"),
    revision: info("clock", "En revisión"),
    pagado: info("check", "Pagado el 5 de noviembre"),
    atrasado: info("alert", "Atrasada desde el 11"),
  }[st];
  const notice = M.c.justSent ? aviso("check", "Lo recibimos.", "Apenas lo revisemos, lo vas a ver acá.") : "";
  const hist = [["Octubre", "Pagado el 4 de octubre"], ["Septiembre", "Pagado el 8 de septiembre"], ["Agosto", "Pagado el 2 de agosto"]];
  return {
    nav: "cliente", tab: "pagos",
    body: `${header("¡Buenas,", "Sofi!", sofiAvatar())}<h1 class="screen-title">Pagos</h1>${notice}
      <section class="block"><h2 class="section-title">Cuota de noviembre</h2><p class="info-big">${money(38000)}</p>
        <div class="info-lines">${status}${st === "pendiente" || st === "atrasado" ? info("wallet", "Transferí al alias kinaf.rosario o pagá en recepción", true) : ""}</div></section>
      <section class="block"><h2 class="section-title">Historial</h2><div class="info-lines">${hist.map(([m, t]) => info("check", `${m} · ${money(38000)} · ${t.replace("Pagado el ", "pagado el ")}`)).join("")}</div></section>`,
    dock: st === "pendiente" || st === "atrasado" ? btn("Subir comprobante", "go", 'data-to="subir-comprobante"') : null,
  };
};

V["subir-comprobante"] = () => ({
  body: `${innerBar()}<h1 class="screen-title">Subir comprobante</h1>
    <p class="screen-sub">Cuota de noviembre · ${money(38000)}</p>
    ${M.c.file
      ? `<div class="file-preview"><span class="thumb" aria-hidden="true">${icon("file")}</span><div class="row-copy"><strong>transferencia-noviembre.jpg</strong><span>Foto · 1,2 MB</span></div></div>
         <div class="end-actions"><button class="btn secondary" type="button" data-act="pick-file">Elegir otro archivo</button></div>`
      : `<p class="copy block">Sacale una foto al comprobante de la transferencia o subí el PDF que te dio el banco.</p>`}`,
  dock: M.c.file ? btn("Enviar comprobante", "send-file") : btn("Elegir foto o PDF", "pick-file"),
});

V.perfil = () => {
  const who = M.role === "instructor" ? { name: "Agus Bianchi", mail: "agus@kinaf.com.ar", phone: "341 555-0144", av: initialsAvatar("AB") }
    : { name: "Sofi Ortiz", mail: "sofi@gmail.com", phone: "341 555-0199", av: sofiAvatar() };
  return {
    body: `${innerBar()}<h1 class="screen-title">${who.name}</h1>
      <div class="info-lines block">${info("mail", who.mail)}${info("phone", who.phone)}</div>
      ${M.role === "cliente" ? `<p class="copy block">¿Necesitás cambiar algo de tu plan o avisar que no venís con menos de 24 h? Escribile a Kinaf.</p>` : ""}
      <div class="end-actions">${btn2(`Cerrar sesión`, "logout")}</div>`,
    dock: M.role === "cliente" ? whatsappBtn() : null,
  };
};

// ---------------------------------------------------------------- pantallas del admin
function roster(s) {
  const taken = s.slot.cap - freeSpots(s) + M.a.absent.filter((k) => k.startsWith(s.id + ":")).length;
  const start = SLOTS.indexOf(s.slot) % ROSTER_POOL.length;
  const ids = [];
  if (SOFI_FIXED.some((f) => f.slot === s.slot.id)) ids.push({ id: "sofi", name: "Sofi Ortiz", initials: "SO", kind: "Horario fijo" });
  for (let i = 0; ids.length < taken && i < ROSTER_POOL.length; i++) {
    const p = personById(ROSTER_POOL[(start + i) % ROSTER_POOL.length]);
    ids.push({ id: p.id, name: p.name, initials: p.initials, kind: i === 2 ? "Clase pendiente" : "Horario fijo" });
  }
  for (let i = 0; ids.length < taken; i++) {
    const n = EXTRA_NAMES[i % EXTRA_NAMES.length];
    ids.push({ id: "x" + i, name: n, initials: n.split(" ").map((w) => w[0]).join(""), kind: "Horario fijo" });
  }
  return ids;
}
function adminCardLines(s) {
  const taken = s.slot.cap - freeSpots(s);
  const lines = [line("clock", `${s.slot.time} · ${s.slot.instructor}`), line("pin", s.slot.center)];
  if (isSuspended(s)) lines.push(line("calendarOff", "Suspendida · Feriado"));
  else lines.push(line("people", `${taken} de ${s.slot.cap} lugares`));
  return lines;
}

V["admin-hoy"] = () => {
  const readOnly = M.role === "instructor";
  const today = sessionsOn(TODAY).filter((s) => !readOnly || s.slot.instructor === "Agus");
  const closed = isClosed(TODAY);
  const alerts = readOnly ? "" : `<section class="block"><h2 class="section-title">Para resolver</h2><div class="rows" data-group="alerts">
      <button class="row" type="button" data-go="admin-pagos"><span class="bubble" aria-hidden="true">${icon("card")}</span><span class="row-copy"><strong>3 comprobantes para revisar</strong><span>Pagos de noviembre</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>
      <button class="row" type="button" data-act="go-assign" data-id="carla"><span class="bubble" aria-hidden="true">${icon("repeat")}</span><span class="row-copy"><strong>Carla Vico no tiene horario</strong><span>Tiene plan, elegí sus horarios</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>
    </div></section>`;
  const classes = closed
    ? emptyState("calendarOff", "Hoy Kinaf está cerrado.", "Es feriado: las clases de hoy están suspendidas y cada persona tiene una clase pendiente.")
    : `<div class="class-stack" data-group="classes">${today.map((s) => classCard(s, adminCardLines(s), { target: readOnly ? "instructor-clase" : "admin-clase" })).join("")}</div>`;
  return {
    nav: readOnly ? null : "admin", tab: "admin-hoy",
    body: `${readOnly ? header("Kinaf · Instructor", "Hola, Agus", initialsAvatar("AB")) : header("Kinaf · Admin", "Hola, Vale", initialsAvatar("V"))}
      <h1 class="screen-title">Hoy</h1><p class="screen-sub">Miércoles 11 de noviembre</p>
      ${alerts}<section class="block"><h2 class="section-title">${readOnly ? "Tus clases" : "Clases de hoy"}</h2>${classes}</section>`,
  };
};

V["admin-clase"] = () => {
  const readOnly = M.role === "instructor" || M.screen === "instructor-clase";
  const s = session(M.params.id);
  const susp = isSuspended(s);
  const people = roster(s);
  const taken = s.slot.cap - freeSpots(s);
  const absent = M.a.absent;
  const list = `<div class="rows" data-group="attendees">${people.map((p) => {
    const isAbs = absent.includes(`${s.id}:${p.id}`);
    const sub = isAbs ? `<span class="flag">Ausente · tiene clase pendiente</span>` : `<span>${p.kind}</span>`;
    const inner = `<span class="bubble" aria-hidden="true">${p.initials}</span><span class="row-copy"><strong>${p.name}</strong>${sub}</span>`;
    return readOnly || isAbs || susp ? `<div class="row">${inner}</div>`
      : `<button class="row" type="button" data-act="ask-absent" data-person="${p.id}" data-name="${esc(p.name)}" aria-label="${esc(p.name)}, marcar ausente">${inner}${icon("chevron").replace("<svg", '<svg class="chev"')}</button>`;
  }).join("")}</div>`;
  const ja = M.a.justAbsent;
  const notice = ja ? aviso("check", `Marcamos ausente a ${ja.name}.`, `Tiene una clase pendiente hasta el domingo ${expiryFor(s.d)}.`, `<button class="link" type="button" data-act="undo-absent">Deshacer</button>`) : "";
  let sh = "";
  if (M.sheet && M.sheet.type === "absent") sh = sheet(`¿Marcamos ausente a ${M.sheet.name}?`, `Le damos una clase pendiente para usar hasta el domingo ${expiryFor(s.d)}. Si la clase todavía no pasó, se libera su lugar.`, "Marcar ausente", "confirm-absent");
  if (M.sheet && M.sheet.type === "suspend") sh = sheet(`¿Suspendemos ${s.act.name} del ${dayName(s.d)} ${s.d}?`, `Las ${taken} personas anotadas reciben una clase pendiente. Lo ven en la app.`, "Suspender clase", "confirm-suspend");
  return {
    body: `${hero(s, susp)}${notice}<div class="clase-body">
        ${info("clock", `${dayLong(s.d)} · ${s.slot.time}`)}${info("person", s.slot.instructor)}${info("pin", s.slot.center)}
        ${susp ? info("calendarOff", "Suspendida · Feriado") : info("people", `${taken} de ${s.slot.cap} lugares`)}
      </div>
      <section class="block"><h2 class="section-title">Anotados</h2>
        ${readOnly || susp ? "" : `<p class="copy" style="margin-bottom:6px">Si alguien avisa que no viene, tocalo para marcarlo ausente.</p>`}${list}</section>
      ${readOnly || susp ? "" : `<div class="end-actions">${btn2("Suspender esta clase", "ask-suspend")}${btn2("Editar el horario de esta clase", "go", 'data-to="admin-horario" data-mode="editar"')}</div>`}`,
    sheet: sh, vt: true,
  };
};
V["instructor-clase"] = V["admin-clase"];

V["admin-clientes"] = () => {
  const q = M.a.search.trim().toLowerCase();
  const list = PEOPLE.filter((p) => p.name.toLowerCase().includes(q));
  const sub = (p) => (!p.plan ? "Sin plan" : !p.schedule ? `${planById(p.plan).name} · Sin horario` : `${planById(p.plan).name} · ${PAY_TEXT[p.pay]}`);
  return {
    nav: "admin", tab: "admin-clientes",
    body: `${header("Kinaf · Admin", "Hola, Vale", initialsAvatar("V"))}<h1 class="screen-title">Clientes</h1>
      <div class="field"><label for="buscar" class="label">Buscar</label><input id="buscar" class="input input-search" type="search" placeholder="Nombre" value="${esc(M.a.search)}" data-input="search"></div>
      ${list.length ? `<div class="rows block" data-group="people">${list.map((p) => `<button class="row" type="button" data-go="admin-ficha" data-id="${p.id}"><span class="bubble" aria-hidden="true">${p.initials}</span><span class="row-copy"><strong>${p.name}</strong><span>${sub(p)}</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>`).join("")}</div>`
        : emptyState("users", `No encontramos a “${esc(M.a.search)}”.`, "Revisá cómo está escrito o buscá por otro nombre.")}`,
  };
};

V["admin-ficha"] = () => {
  const p = personById(M.params.id || "sofi");
  const plan = p.plan && planById(p.plan);
  if (!plan) {
    return { body: `${innerBar()}<h1 class="screen-title">${p.name}</h1>${emptyState("layers", "Todavía no tiene plan.", "Asignale un plan y sus horarios fijos. Desde ahí el sistema lo reserva solo cada semana.")}`, dock: btn("Asignar plan y horario", "go-assign") };
  }
  const sched = p.id === "sofi" ? sofiFixed().map((f) => slotById(f.slot))
    : p.schedule ? SLOTS.filter((s, i) => (i + p.name.length) % 4 === 0).slice(0, planWeekly(plan)) : [];
  const pend = p.id === "sofi" ? M.c.pendings : [];
  return {
    body: `${innerBar()}<h1 class="screen-title">${p.name}</h1>
      ${M.justAssigned ? aviso("check", "Listo, horario cargado.", `Desde el lunes ${M.a.assign.from} el sistema reserva sus clases cada semana.`) : ""}
      <section class="block"><h2 class="section-title">Plan</h2><p class="info-big">${plan.name}</p>
        <div class="info-lines">${plan.quotas.map((q) => info("layers", cap(quotaText(q)) + " por semana")).join("")}</div></section>
      <section class="block"><h2 class="section-title">Horario fijo</h2>${sched.length ? `<div class="info-lines">${sched.map((s) => info("repeat", `${cap(WEEKDAYS[s.day])} ${s.time} · ${ACTIVITIES[s.act].name} · ${s.center}`)).join("")}</div>` : aviso("info", "Falta elegir sus horarios.", "Hasta que los cargues, no tiene clases reservadas.")}</section>
      ${pend.length ? `<section class="block"><h2 class="section-title">Clases pendientes</h2>${info("ticket", `${pend.length} · vence el domingo ${Math.min(...pend.map((x) => x.expires))}`)}</section>` : ""}
      <section class="block"><h2 class="section-title">Pagos</h2>${info(p.pay === "atrasado" ? "alert" : "clock", `Noviembre · ${PAY_TEXT[p.pay]}`)}</section>`,
    dock: btn(sched.length ? "Cambiar plan u horario" : "Elegir horarios", "go-assign"),
  };
};

V["admin-asignar"] = () => {
  const as = M.a.assign;
  const person = personById(M.params.id || "carla");
  const plan = planById(as.plan);
  const step = as.step;
  let body, dock;
  if (step === 1) {
    body = `<h1 class="screen-title">Elegí el plan</h1><p class="screen-sub">${person.name}</p>
      <div class="rows block" role="radiogroup" data-group="plans">${PLANS.map((p) => `<button class="choice" type="button" role="radio" aria-checked="${p.id === as.plan}" data-act="pick-plan" data-plan="${p.id}"><span class="mark">${p.id === as.plan ? icon("check") : ""}</span><span class="row-copy"><strong>${p.name}</strong><span>${cap(planSummary(p))} · ${money(p.price)}</span></span></button>`).join("")}</div>`;
    dock = btn("Siguiente", "assign-next");
  } else {
    const qi = as.quota || 0;
    const q = plan.quotas[qi];
    const last = qi === plan.quotas.length - 1;
    const options = SLOTS.filter((s) => q.acts === "any" || q.acts.includes(s.act));
    const chosen = as.slots.filter((x) => x.q === qi).map((x) => x.slot);
    const takenElsewhere = as.slots.filter((x) => x.q !== qi).map((x) => x.slot);
    body = `<h1 class="screen-title">${cap(quotaText(q))}</h1>
      <p class="screen-sub">${person.name} · elegí ${q.count === 1 ? "1 horario" : `${q.count} horarios`} (${chosen.length} de ${q.count}).</p>
      ${last ? `<div class="field"><label for="desde">Empieza</label><select id="desde" class="input" data-act-change="pick-from"><option value="16"${as.from === 16 ? " selected" : ""}>Lunes 16 de noviembre</option><option value="23"${as.from === 23 ? " selected" : ""}>Lunes 23 de noviembre</option></select></div>` : ""}
      ${(() => {
        const avail = options.filter((s) => !takenElsewhere.includes(s.id));
        const isFull = (s) => s.cap - FIXED_COUNT[s.id] <= 0 && !chosen.includes(s.id);
        const open = avail.filter((s) => !isFull(s)).map((s) => {
          const free = s.cap - FIXED_COUNT[s.id];
          const on = chosen.includes(s.id);
          return `<button class="choice check" type="button" role="checkbox" aria-checked="${on}" data-act="pick-slot" data-slot="${s.id}"><span class="mark">${on ? icon("check") : ""}</span><span class="row-copy"><strong>${cap(WEEKDAYS[s.day])} ${s.time} · ${ACTIVITIES[s.act].name}</strong><span>${s.center} · ${free === 1 ? "1 lugar fijo libre" : `${free} lugares fijos libres`}</span></span></button>`;
        }).join("");
        const full = avail.filter(isFull);
        return `<div class="rows block" data-group="slots">${open}</div>${full.length ? `<section class="block"><h2 class="section-title">Completos</h2><div class="info-lines">${full.map((s) => info("people", `${cap(WEEKDAYS[s.day])} ${s.time} · ${ACTIVITIES[s.act].name} · ${s.center}`, true)).join("")}</div></section>` : ""}`;
      })()}`;
    dock = btn(last ? "Confirmar horario" : "Siguiente", last ? "assign-confirm" : "assign-next", chosen.length === q.count ? "" : "disabled");
  }
  const withPlanStep = !as.skipPlan;
  const total = (withPlanStep ? 1 : 0) + plan.quotas.length;
  const stepNo = step === 1 ? 1 : (withPlanStep ? 2 : 1) + (as.quota || 0);
  return { body: `${innerBar(`<span class="step">Paso ${stepNo} de ${total}</span>`)}${body}`, dock };
};

V["admin-agenda"] = () => {
  const days = [];
  for (let d = TODAY; d <= TODAY + 13; d++) days.push(d);
  const sel = M.selDay && days.includes(M.selDay) ? M.selDay : 20;
  const strip = days.map((d) => `<button class="day${d === sel ? " selected" : ""}" type="button" data-day="${d}" aria-pressed="${d === sel}" aria-label="${dayLong(d)}"><span>${WEEKDAYS_SHORT[dow(d)]}</span><strong>${d}</strong></button>`).join("");
  const items = sessionsOn(sel);
  const closed = isClosed(sel);
  return {
    nav: "admin", tab: "admin-agenda",
    body: `${header("Kinaf · Admin", "Hola, Vale", initialsAvatar("V"))}<h1 class="screen-title">Agenda</h1>
      <div class="day-strip" data-group="days" aria-label="Días">${strip}</div>
      <h2 class="group-title">${cap(dayName(sel))} ${sel}</h2>
      ${closed ? aviso("calendarOff", "Cerrado por feriado.", "Las clases de este día están suspendidas y cada persona tiene una clase pendiente.") : ""}
      ${items.length ? `<div class="class-stack" data-group="classes" ${closed ? 'style="margin-top:12px"' : ""}>${items.map((s) => classCard(s, adminCardLines(s), { target: "admin-clase", muted: closed })).join("")}</div>`
        : emptyState("calendar", "Este día no hay clases.", "Podés crear un horario nuevo.")}
      ${closed || !items.length ? "" : `<div class="end-actions">${btn2(`Cerrar el ${dayName(sel)} ${sel} (feriado o cierre)`, "go", `data-to="admin-cierre" data-day="${sel}"`)}</div>`}`,
    dock: btn(`${icon("plus")}Nuevo horario`, "go", 'data-to="admin-horario" data-mode="nuevo"'),
  };
};

V["admin-horario"] = () => {
  const editing = M.params.mode === "editar";
  const s = editing ? slotById("mie-18-pil") : null;
  const sel = (id, label, opts, value) => `<div class="field"><label for="${id}">${label}</label><select id="${id}" class="input">${opts.map((o) => `<option${o === value ? " selected" : ""}>${o}</option>`).join("")}</select></div>`;
  const capValue = M.a.capError ? 8 : editing ? s.cap : 10;
  return {
    body: `${innerBar()}<h1 class="screen-title">${editing ? "Editar horario" : "Nuevo horario"}</h1>
      ${M.a.capError ? aviso("alert", "Hay 10 personas con este horario fijo.", "Para bajar el cupo a 8, primero cambiá el horario de 2 personas desde su ficha.") : ""}
      ${sel("act", "Actividad", ["Pilates", "Yoga", "Gimnasio"], editing ? "Pilates" : "Pilates")}
      <div class="field-row">${sel("dia", "Día", WEEKDAYS.map(cap), editing ? "Miércoles" : "Jueves")}${sel("hora", "Hora", ["08:00", "10:00", "18:00", "19:00", "19:30", "20:00"], "18:00")}</div>
      ${sel("centro", "Centro", ["Mendoza", "Ovidio Lagos"], "Mendoza")}
      ${sel("inst", "Instructor", ["Agus", "Mica", "Nico"], "Agus")}
      <div class="field"><label for="cupo">Cupo</label><input id="cupo" class="input" type="number" inputmode="numeric" value="${capValue}"></div>`,
    dock: btn("Guardar", "save-slot"),
  };
};

V["admin-cierre"] = () => {
  const d = M.params.day || 20;
  const center = M.a.closeCenter;
  const all = sessionsOn(d).filter((s) => center === "todos" || s.slot.center === center);
  const people = all.reduce((n, s) => n + (s.slot.cap - freeSpots(s)), 0);
  const opts = [["todos", "Los dos centros"], ["Mendoza", "Mendoza"], ["Ovidio Lagos", "Ovidio Lagos"]];
  return {
    body: `${innerBar()}<h1 class="screen-title">Cerrar un día</h1><p class="screen-sub">${dayLong(d)} de noviembre</p>
      <div class="field"><label for="motivo">Motivo</label><input id="motivo" class="input" value="Feriado"></div>
      <div class="field"><span class="label">Dónde</span><div class="rows" role="radiogroup" data-group="centers">${opts.map(([v, t]) => `<button class="choice" type="button" role="radio" aria-checked="${center === v}" data-act="pick-center" data-center="${v}"><span class="mark">${center === v ? icon("check") : ""}</span><span class="row-copy"><strong>${t}</strong></span></button>`).join("")}</div></div>
      ${aviso("info", `Se suspenden ${all.length} clases y ${people} reservas.`, "Cada persona recibe una clase pendiente y lo ve en la app.")}`,
    dock: btn(`Cerrar el ${dayName(d)} ${d}`, "confirm-close"),
  };
};

V["admin-pagos"] = () => {
  const review = PEOPLE.filter((p) => p.pay === "revision" && p.id !== M.a.justReviewed);
  const late = PEOPLE.filter((p) => p.pay === "atrasado");
  const row = (p, sub, go) => `<button class="row" type="button" data-go="${go}" data-id="${p.id}"><span class="bubble" aria-hidden="true">${p.initials}</span><span class="row-copy"><strong>${p.name}</strong><span>${sub}</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>`;
  const reviewed = M.a.justReviewed ? aviso("check", `Listo, ${personById(M.a.justReviewed).name.split(" ")[0]} quedó al día.`, "", `<button class="link" type="button" data-act="undo-review">Deshacer</button>`) : "";
  return {
    nav: "admin", tab: "admin-pagos",
    body: `${header("Kinaf · Admin", "Hola, Vale", initialsAvatar("V"))}<h1 class="screen-title">Pagos</h1><p class="screen-sub">Cuotas de noviembre</p>${reviewed}
      <section class="block"><h2 class="section-title">Para revisar</h2><div class="rows" data-group="review">${review.map((p) => row(p, `Comprobante · ${money(planById(p.plan).price)}`, "admin-comprobante")).join("")}</div></section>
      <section class="block"><h2 class="section-title">Atrasadas</h2><div class="rows" data-group="late">${late.map((p) => row(p, `Desde el 11 · ${money(planById(p.plan).price)}`, "admin-ficha")).join("")}</div></section>`,
    dock: btn("Registrar pago", "go", 'data-to="admin-registrar"'),
  };
};

V["admin-comprobante"] = () => {
  const p = personById(M.params.id || "ana");
  const plan = planById(p.plan);
  const sh = M.sheet === "reject" ? sheet("¿Rechazamos el comprobante?", `${p.name.split(" ")[0]} lo va a ver en la app y va a poder subir otro.`, "Rechazar", "confirm-reject", "Mejor no") : "";
  return {
    body: `${innerBar()}<h1 class="screen-title">${p.name}</h1><p class="screen-sub">Cuota de noviembre · ${money(plan.price)} · subido hoy</p>
      <figure class="receipt" aria-label="Foto del comprobante">
        <div class="receipt-paper"><strong>Transferencia enviada</strong><span class="amount">${money(plan.price)}</span>
          <dl><dt>Para</dt><dd>Kinaf · kinaf.rosario</dd><dt>De</dt><dd>${p.name}</dd><dt>Fecha</dt><dd>11/11/2026 08:52</dd><dt>Operación</dt><dd>0048213377</dd></dl></div>
      </figure>
      <div class="end-actions">${btn2("Rechazar comprobante", "ask-reject")}</div>`,
    dock: btn("Aprobar pago", "approve"),
    sheet: sh,
  };
};

V["admin-registrar"] = () => ({
  body: `${innerBar()}<h1 class="screen-title">Registrar un pago</h1><p class="screen-sub">Queda pagado en el momento.</p>
    <div class="field"><label for="quien">Persona</label><select id="quien" class="input">${PEOPLE.filter((p) => p.plan).map((p) => `<option${p.id === "mati" ? " selected" : ""}>${p.name}</option>`).join("")}</select></div>
    <div class="field-row"><div class="field"><label for="mes">Mes</label><select id="mes" class="input"><option>Noviembre</option><option>Diciembre</option></select></div>
    <div class="field"><label for="monto">Monto</label><input id="monto" class="input" inputmode="numeric" value="42.000"></div></div>
    <div class="field"><label for="medio">Medio</label><select id="medio" class="input"><option>Efectivo</option><option>Transferencia</option></select></div>`,
  dock: btn("Registrar pago", "save-payment"),
});

V["admin-ajustes"] = () => ({
  body: `${innerBar()}<h1 class="screen-title">Ajustes</h1><p class="screen-sub">Vale · Kinaf</p>
    <div class="rows block" data-group="settings">
      <button class="row" type="button" data-go="admin-planes"><span class="bubble" aria-hidden="true">${icon("layers")}</span><span class="row-copy"><strong>Planes</strong><span>${PLANS.length} planes</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>
    </div>
    <div class="end-actions">${btn2("Cerrar sesión", "logout")}</div>`,
});

V["admin-planes"] = () => ({
  body: `${innerBar()}<h1 class="screen-title">Planes</h1>
    <div class="rows block" data-group="plans">${PLANS.map((p) => `<button class="row" type="button" data-go="admin-plan" data-id="${p.id}"><span class="bubble" aria-hidden="true">${planWeekly(p)}</span><span class="row-copy"><strong>${p.name}</strong><span>${cap(planSummary(p))} · ${money(p.price)}</span></span>${icon("chevron").replace("<svg", '<svg class="chev"')}</button>`).join("")}</div>`,
  dock: btn(`${icon("plus")}Nuevo plan`, "go", 'data-to="admin-plan" data-id="nuevo"'),
});

V["admin-plan"] = () => {
  const p = M.params.id === "nuevo" ? { id: "nuevo", name: "", price: 0, quotas: [{ count: 1, acts: "any" }] } : planById(M.params.id) || planById("combinado");
  if (!M.a.draft || M.a.draft.id !== p.id) M.a.draft = JSON.parse(JSON.stringify(p));
  const d = M.a.draft;
  const quota = (q, i) => {
    const acts = ["gimnasio", "pilates", "yoga"];
    return `<div class="quota" data-group="quota"><div class="quota-head">
        <div class="field" style="margin-top:0"><label for="q${i}">Cupo ${i + 1}: clases por semana</label><select id="q${i}" class="input" data-act-change="quota-count" data-i="${i}">${[1, 2, 3, 4, 5].map((n) => `<option${n === q.count ? " selected" : ""} value="${n}">${n}</option>`).join("")}</select></div>
        <div><span class="label" style="font-size:14px;font-weight:800">Actividades</span><div class="toggles" style="margin-top:6px">
          <button class="toggle" type="button" aria-pressed="${q.acts === "any"}" data-act="quota-any" data-i="${i}">${q.acts === "any" ? icon("check") : ""}Cualquiera</button>
          ${acts.map((a) => { const on = q.acts !== "any" && q.acts.includes(a); return `<button class="toggle" type="button" aria-pressed="${on}" data-act="quota-act" data-i="${i}" data-a="${a}">${on ? icon("check") : ""}${ACTIVITIES[a].name}</button>`; }).join("")}
        </div></div>
      </div>${d.quotas.length > 1 ? `<button class="link" type="button" data-act="quota-remove" data-i="${i}">Quitar cupo ${i + 1}</button>` : ""}</div>`;
  };
  return {
    body: `${innerBar()}<h1 class="screen-title">${M.params.id === "nuevo" ? "Nuevo plan" : "Editar plan"}</h1>
      <div class="field-row"><div class="field"><label for="pn">Nombre</label><input id="pn" class="input" value="${esc(M.params.id === "nuevo" ? "" : d.name)}"></div>
      <div class="field"><label for="pp">Precio por mes</label><input id="pp" class="input" inputmode="numeric" value="${M.params.id === "nuevo" ? "" : d.price.toLocaleString("es-AR")}"></div></div>
      <section class="block"><h2 class="section-title">Cupos semanales</h2>
        <p class="copy">Cada cupo es una cantidad de clases y las actividades en las que se pueden usar.</p>
        ${d.quotas.map(quota).join("")}
        <button class="link" type="button" data-act="quota-add">Agregar otro cupo</button>
        ${info("layers", `Total: ${planWeekly(d)} clases por semana · ${cap(planSummary(d))}`)}
      </section>`,
    dock: btn("Guardar", "save-plan"),
  };
};
