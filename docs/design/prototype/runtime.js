// Navegación, transiciones, estados de demo y eventos.

const TAB_ROLE = { "mis-clases": "cliente", "mi-plan": "cliente", pagos: "cliente", "admin-hoy": "admin", "admin-clientes": "admin", "admin-agenda": "admin", "admin-pagos": "admin" };

function paint() {
  const view = V[M.screen]();
  const phone = main();
  phone.classList.toggle("with-nav", !!view.nav);
  phone.classList.toggle("with-dock", !!view.dock);
  phone.classList.toggle("dock-tall", !!view.dock && view.dock.includes("aviso"));
  phone.dataset.screen = M.screen;
  phone.innerHTML = `${statusBar()}<section class="app-shell">${view.body}</section>
    ${view.dock ? `<div class="dock">${view.dock}</div>` : ""}
    ${view.nav ? nav(view.nav, view.tab) : ""}
    <div class="home-indicator" aria-hidden="true"></div>${view.sheet || ""}`;
  phone.querySelectorAll(".day-strip").forEach((strip) => {
    const selDay = strip.querySelector(".selected");
    if (selDay) strip.scrollLeft = Math.max(0, selDay.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + selDay.offsetWidth / 2);
  });
  if (!document.body.classList.contains("shot")) {
    history.replaceState(null, "", `#${M.screen}${M.params.id ? "/" + M.params.id : ""}`);
    renderDemo();
  }
}

// View Transition de elemento compartido: tarjeta <-> encabezado del detalle (PR #3).
function tag(el, on) {
  if (!el) return;
  const set = (node, name) => node && (node.style.viewTransitionName = on ? name : "");
  set(el, "clase-fondo");
  set(el.querySelector("h3, .clase-title"), "clase-titulo");
  set(el.querySelector(".cutout"), "clase-foto");
}
function clearTags() { document.querySelectorAll("[style*='view-transition-name']").forEach((n) => (n.style.viewTransitionName = "")); }
async function transition(update, before, after) {
  if (before) before();
  const run = () => { update(); paint(); if (after) after(); };
  if (document.startViewTransition && !document.body.classList.contains("shot")) {
    try { await document.startViewTransition(run).finished; } catch (e) { /* abortada */ }
  } else run();
  clearTags();
}

function go(screen, params = {}, sessionId) {
  const push = () => { M.stack.push({ screen: M.screen, params: M.params, selDay: M.selDay }); M.screen = screen; M.params = params; M.sheet = null; };
  if (sessionId) {
    transition(push, () => tag(document.querySelector(`[data-open="${sessionId}"]`), true), () => tag(document.querySelector(".clase-hero"), true));
  } else transition(push);
}
function back() {
  if (M.sheet) { M.sheet = null; paint(); return; }
  const prev = M.stack.pop();
  if (!prev) return;
  const fromId = document.querySelector(".clase-hero")?.dataset.hero;
  const leaving = M.screen;
  transition(() => {
    M.screen = prev.screen; M.params = prev.params; M.selDay = prev.selDay;
    M.c.justBooked = null; M.a.justAbsent = null; M.justAssigned = false;
    if (leaving === "clase") M.c.justCancelled = null;
  }, () => fromId && tag(document.querySelector(".clase-hero"), true), () => fromId && tag(document.querySelector(`[data-open="${fromId}"]`), true));
}
function tab(screen) {
  if (screen === M.screen) return;
  transition(() => { M.screen = screen; M.params = {}; M.stack = []; M.sheet = null; M.selDay = null; M.c.justSent = false; M.a.justReviewed = null; });
}

function onClick(e) {
  const t = e.target;
  const tabBtn = t.closest("[data-tab]");
  if (tabBtn) return tab(tabBtn.dataset.tab);
  const card = t.closest("[data-open]");
  if (card) { e.preventDefault(); return go(card.dataset.target, { id: card.dataset.open }, card.dataset.open); }
  const day = t.closest("[data-day]:not([data-act])");
  if (day) { M.selDay = Number(day.dataset.day); return paint(); }
  const g = t.closest("[data-go]");
  if (g) return go(g.dataset.go, { id: g.dataset.id });
  const a = t.closest("[data-act]");
  if (!a) return;
  if (a.classList.contains("sheet-backdrop") && t !== a) return; // clic dentro de la hoja
  const act = a.dataset.act;
  const actions = {
    back, dismiss: () => { M.sheet = null; paint(); },
    go: () => go(a.dataset.to, { id: a.dataset.id, mode: a.dataset.mode, day: a.dataset.day ? Number(a.dataset.day) : undefined }),
    login: () => { M.screen = M.role === "admin" ? "admin-hoy" : M.role === "instructor" ? "admin-hoy" : "mis-clases"; M.stack = []; paint(); },
    logout: () => { M.screen = "login"; M.stack = []; M.params = {}; paint(); },
    whatsapp: () => alert("Abre WhatsApp con el número de Kinaf (fuera del prototipo)."),
    "go-elegir": () => { M.selDay = null; M.c.justCancelled = null; go("elegir-clase"); },
    "ask-cancel": () => { M.sheet = "cancel"; paint(); },
    "confirm-cancel": () => { M.sheet = null; cancelBooking(M.params.id); paint(); },
    "undo-cancel": () => { undoCancel(); paint(); },
    "use-pending": () => { usePending(M.params.id); paint(); },
    "undo-book": () => { undoBook(); paint(); },
    "pick-file": () => { M.c.file = true; paint(); },
    "send-file": () => { M.c.file = false; M.c.pay = "revision"; M.c.justSent = true; M.stack = []; M.screen = "pagos"; paint(); },
    "ask-absent": () => { M.sheet = { type: "absent", person: a.dataset.person, name: a.dataset.name }; paint(); },
    "confirm-absent": () => { M.a.absent.push(`${M.params.id}:${M.sheet.person}`); M.a.justAbsent = { key: `${M.params.id}:${M.sheet.person}`, name: M.sheet.name }; M.sheet = null; paint(); },
    "undo-absent": () => { M.a.absent = M.a.absent.filter((k) => k !== M.a.justAbsent.key); M.a.justAbsent = null; paint(); },
    "ask-suspend": () => { M.sheet = { type: "suspend" }; paint(); },
    "confirm-suspend": () => { M.a.suspended.push(M.params.id); M.sheet = null; paint(); },
    "go-assign": () => {
      const id = a.dataset.id || M.params.id; const p = personById(id);
      // Si ya tiene plan y le falta el horario, se arranca directo en los horarios.
      const step = p.plan && !p.schedule ? 2 : 1;
      M.a.assign = { step, skipPlan: step === 2, plan: p.plan || "combinado", slots: [], from: 16, quota: 0 }; go("admin-asignar", { id });
    },
    "pick-plan": () => { M.a.assign.plan = a.dataset.plan; M.a.assign.slots = []; paint(); },
    "pick-slot": () => {
      const as = M.a.assign; const q = planById(as.plan).quotas[as.quota || 0]; const qi = as.quota || 0;
      const has = as.slots.find((x) => x.slot === a.dataset.slot);
      if (has) as.slots = as.slots.filter((x) => x !== has);
      else if (as.slots.filter((x) => x.q === qi).length < q.count) as.slots.push({ q: qi, slot: a.dataset.slot });
      paint();
    },
    "assign-next": () => {
      const as = M.a.assign; const plan = planById(as.plan);
      if (as.step === 1) { as.step = 2; as.quota = 0; } else as.quota++;
      paint(); main().querySelector(".app-shell").scrollTop = 0;
    },
    "pick-from": () => { M.a.assign.from = Number(a.dataset.from); paint(); },
    "assign-confirm": () => {
      const p = personById(M.params.id); p.schedule = true; p.plan = M.a.assign.plan;
      transition(() => { if (M.stack[M.stack.length - 1]?.screen === "admin-ficha") M.stack.pop(); M.screen = "admin-ficha"; M.params = { id: p.id }; M.justAssigned = true; });
    },
    "save-slot": () => { if (M.params.mode === "editar" && !M.a.capError) { M.a.capError = true; return paint(); } back(); },
    "pick-center": () => { M.a.closeCenter = a.dataset.center; paint(); },
    "confirm-close": () => { M.a.closures.push(M.params.day || 20); back(); },
    approve: () => { M.a.justReviewed = M.params.id; back(); },
    "undo-review": () => { M.a.justReviewed = null; paint(); },
    "ask-reject": () => { M.sheet = "reject"; paint(); },
    "confirm-reject": () => { M.sheet = null; back(); },
    "save-payment": back, "save-plan": back,
    "quota-any": () => { M.a.draft.quotas[a.dataset.i].acts = "any"; paint(); },
    "quota-act": () => {
      const q = M.a.draft.quotas[a.dataset.i]; let acts = q.acts === "any" ? [] : [...q.acts];
      acts = acts.includes(a.dataset.a) ? acts.filter((x) => x !== a.dataset.a) : [...acts, a.dataset.a];
      q.acts = acts.length ? acts : "any"; paint();
    },
    "quota-add": () => { M.a.draft.quotas.push({ count: 1, acts: "any" }); paint(); },
    "quota-remove": () => { M.a.draft.quotas.splice(Number(a.dataset.i), 1); paint(); },
  };
  if (actions[act]) { e.preventDefault(); actions[act](); }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.actChange === "pick-from") { M.a.assign.from = Number(t.value); return; }
  if (t.dataset.actChange === "quota-count") { M.a.draft.quotas[t.dataset.i].count = Number(t.value); paint(); }
}
function onInput(e) {
  if (e.target.dataset.input === "search") {
    M.a.search = e.target.value; paint();
    const inp = main().querySelector("#buscar"); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
}

// ---------------------------------------------------------------- estados de demo
const S = (id, role, group, label, apply) => ({ id, role, group, label, apply });
const withPending = () => { cancelBookingQuiet("lun-18-pil@16"); };
function cancelBookingQuiet(id) { cancelBooking(id); M.c.justCancelled = null; }
const holiday = () => { M.c.closures.push(20); M.c.pendings.push({ id: "p-feriado", from: "vie-18-gym@20", acts: "any", expires: 29, reason: "Feriado" }); };
const goTo = (screen, params = {}, stack = []) => { M.screen = screen; M.params = params; M.stack = stack.map((s) => ({ screen: s, params: {} })); };

const STATES = [
  S("login", "cliente", "Ingreso", "Ingresar", () => goTo("login")),
  S("login-error", "cliente", "Ingreso", "Ingresar · error", () => { M.loginError = true; goTo("login"); }),

  S("mis-clases", "cliente", "Cliente · Mis clases", "Normal", () => goTo("mis-clases")),
  S("mis-clases-pendiente", "cliente", "Cliente · Mis clases", "Con clase pendiente", () => { withPending(); goTo("mis-clases"); }),
  S("mis-clases-feriado", "cliente", "Cliente · Mis clases", "Clase suspendida por feriado", () => { holiday(); goTo("mis-clases"); }),
  S("mis-clases-sin-horario", "cliente", "Cliente · Mis clases", "Plan sin horario todavía", () => { M.c.hasSchedule = false; goTo("mis-clases"); }),
  S("mis-clases-sin-plan", "cliente", "Cliente · Mis clases", "Sin plan", () => { M.c.hasPlan = false; goTo("mis-clases"); }),

  S("clase-fija", "cliente", "Cliente · Detalle de clase", "Tu clase, con 24 h o más", () => goTo("clase", { id: "lun-18-pil@16" }, ["mis-clases"])),
  S("clase-confirmar", "cliente", "Cliente · Detalle de clase", "Confirmar “No voy a ir”", () => { goTo("clase", { id: "lun-18-pil@16" }, ["mis-clases"]); M.sheet = "cancel"; }),
  S("clase-cancelada", "cliente", "Cliente · Detalle de clase", "Recién cancelada", () => { cancelBooking("lun-18-pil@16"); goTo("clase", { id: "lun-18-pil@16" }, ["mis-clases"]); }),
  S("clase-menos-24h", "cliente", "Cliente · Detalle de clase", "Menos de 24 h", () => goTo("clase", { id: "mie-19-yog@11" }, ["mis-clases"])),
  S("clase-suspendida", "cliente", "Cliente · Detalle de clase", "Suspendida por feriado", () => { holiday(); goTo("clase", { id: "vie-18-gym@20" }, ["mis-clases"]); }),
  S("clase-usar-pendiente", "cliente", "Cliente · Detalle de clase", "Usar clase pendiente", () => { withPending(); goTo("clase", { id: "jue-18-pil@12" }, ["mis-clases", "elegir-clase"]); }),
  S("clase-reservada", "cliente", "Cliente · Detalle de clase", "Recién reservada con pendiente", () => { withPending(); usePending("jue-18-pil@12"); goTo("clase", { id: "jue-18-pil@12" }, ["mis-clases", "elegir-clase"]); }),
  S("clase-completa", "cliente", "Cliente · Detalle de clase", "Cupo completo", () => { withPending(); goTo("clase", { id: "jue-19-gym@12" }, ["mis-clases", "elegir-clase"]); }),

  S("elegir-clase", "cliente", "Cliente · Elegir clase", "Lista del día (pendiente libre)", () => { withPending(); goTo("elegir-clase", {}, ["mis-clases"]); }),
  S("elegir-clase-yoga", "cliente", "Cliente · Elegir clase", "Pendiente de Yoga (solo Yoga)", () => { cancelBookingQuiet("mie-19-yog@18"); M.selDay = 16; goTo("elegir-clase", {}, ["mis-clases"]); }),
  S("elegir-clase-vacio", "cliente", "Cliente · Elegir clase", "Día sin clases", () => { withPending(); M.selDay = 15; goTo("elegir-clase", {}, ["mis-clases"]); }),

  S("mi-plan", "cliente", "Cliente · Mi plan", "Normal", () => goTo("mi-plan")),
  S("mi-plan-pendiente", "cliente", "Cliente · Mi plan", "Con clase pendiente", () => { withPending(); goTo("mi-plan"); }),
  S("mi-plan-especifico", "cliente", "Cliente · Mi plan", "Plan Yoga y Pilates", () => { M.c.plan = "yogapil"; goTo("mi-plan"); }),
  S("mi-plan-sin-plan", "cliente", "Cliente · Mi plan", "Sin plan", () => { M.c.hasPlan = false; goTo("mi-plan"); }),

  S("pagos-pendiente", "cliente", "Cliente · Pagos", "Pendiente", () => goTo("pagos")),
  S("pagos-revision", "cliente", "Cliente · Pagos", "En revisión (recién enviado)", () => { M.c.pay = "revision"; M.c.justSent = true; goTo("pagos"); }),
  S("pagos-pagado", "cliente", "Cliente · Pagos", "Pagado", () => { M.c.pay = "pagado"; goTo("pagos"); }),
  S("pagos-atrasado", "cliente", "Cliente · Pagos", "Atrasado", () => { M.c.pay = "atrasado"; goTo("pagos"); }),
  S("comprobante", "cliente", "Cliente · Pagos", "Subir comprobante", () => goTo("subir-comprobante", {}, ["pagos"])),
  S("comprobante-listo", "cliente", "Cliente · Pagos", "Comprobante elegido", () => { M.c.file = true; goTo("subir-comprobante", {}, ["pagos"]); }),
  S("perfil", "cliente", "Cliente · Perfil", "Perfil", () => goTo("perfil", {}, ["mis-clases"])),

  S("admin-hoy", "admin", "Admin · Hoy", "Normal", () => goTo("admin-hoy")),
  S("admin-hoy-cerrado", "admin", "Admin · Hoy", "Día cerrado", () => { M.a.closures.push(TODAY); goTo("admin-hoy"); }),
  S("admin-clase", "admin", "Admin · Clase del día", "Anotados", () => goTo("admin-clase", { id: "mie-19-yog@11" }, ["admin-hoy"])),
  S("admin-clase-ausente", "admin", "Admin · Clase del día", "Confirmar ausente", () => { goTo("admin-clase", { id: "mie-19-yog@11" }, ["admin-hoy"]); M.sheet = { type: "absent", person: "juan", name: "Juan Ponce" }; }),
  S("admin-clase-ausente-ok", "admin", "Admin · Clase del día", "Ausente marcado", () => { goTo("admin-clase", { id: "mie-19-yog@11" }, ["admin-hoy"]); M.a.absent.push("mie-19-yog@11:juan"); M.a.justAbsent = { key: "mie-19-yog@11:juan", name: "Juan Ponce" }; }),
  S("admin-clase-suspender", "admin", "Admin · Clase del día", "Confirmar suspender", () => { goTo("admin-clase", { id: "mie-19-yog@11" }, ["admin-hoy"]); M.sheet = { type: "suspend" }; }),

  S("admin-clientes", "admin", "Admin · Clientes", "Lista", () => goTo("admin-clientes")),
  S("admin-clientes-vacio", "admin", "Admin · Clientes", "Búsqueda sin resultados", () => { M.a.search = "Rocío"; goTo("admin-clientes"); }),
  S("admin-ficha", "admin", "Admin · Ficha de cliente", "Activa, con pendiente", () => { withPending(); goTo("admin-ficha", { id: "sofi" }, ["admin-clientes"]); }),
  S("admin-ficha-sin-horario", "admin", "Admin · Ficha de cliente", "Sin horario", () => goTo("admin-ficha", { id: "carla" }, ["admin-clientes"])),
  S("admin-ficha-sin-plan", "admin", "Admin · Ficha de cliente", "Sin plan", () => goTo("admin-ficha", { id: "fede" }, ["admin-clientes"])),
  S("admin-asignar-plan", "admin", "Admin · Asignar plan y horario", "Paso 1: plan", () => { M.a.assign = { step: 1, plan: "yogapil", slots: [], from: 16, quota: 0 }; goTo("admin-asignar", { id: "carla" }, ["admin-clientes", "admin-ficha"]); }),
  S("admin-asignar-horarios", "admin", "Admin · Asignar plan y horario", "Paso 2: horarios (con completos)", () => { M.a.assign = { step: 2, plan: "libre3", slots: [{ q: 0, slot: "lun-18-pil" }], from: 16, quota: 0 }; goTo("admin-asignar", { id: "fede" }, ["admin-clientes", "admin-ficha"]); }),
  S("admin-asignar-ultimo", "admin", "Admin · Asignar plan y horario", "Último cupo y fecha de inicio", () => { M.a.assign = { step: 2, skipPlan: true, plan: "yogapil", slots: [{ q: 0, slot: "lun-19-yog" }, { q: 1, slot: "jue-18-pil" }], from: 16, quota: 1 }; goTo("admin-asignar", { id: "carla" }, ["admin-clientes", "admin-ficha"]); }),

  S("admin-agenda", "admin", "Admin · Agenda", "Día con clases", () => { M.selDay = 18; goTo("admin-agenda"); }),
  S("admin-agenda-cerrado", "admin", "Admin · Agenda", "Día cerrado", () => { M.a.closures.push(20); M.selDay = 20; goTo("admin-agenda"); }),
  S("admin-horario-nuevo", "admin", "Admin · Horario de clase", "Nuevo", () => goTo("admin-horario", { mode: "nuevo" }, ["admin-agenda"])),
  S("admin-horario-cupo", "admin", "Admin · Horario de clase", "Bajar cupo (bloqueado)", () => { M.a.capError = true; goTo("admin-horario", { mode: "editar" }, ["admin-agenda", "admin-clase"]); }),
  S("admin-cierre", "admin", "Admin · Cerrar un día", "Formulario e impacto", () => goTo("admin-cierre", { day: 20 }, ["admin-agenda"])),

  S("admin-pagos", "admin", "Admin · Pagos", "Lista", () => goTo("admin-pagos")),
  S("admin-comprobante", "admin", "Admin · Pagos", "Revisar comprobante", () => goTo("admin-comprobante", { id: "ana" }, ["admin-pagos"])),
  S("admin-registrar", "admin", "Admin · Pagos", "Registrar un pago", () => goTo("admin-registrar", {}, ["admin-pagos"])),
  S("admin-ajustes", "admin", "Admin · Ajustes y planes", "Ajustes", () => goTo("admin-ajustes", {}, ["admin-hoy"])),
  S("admin-planes", "admin", "Admin · Ajustes y planes", "Planes", () => goTo("admin-planes", {}, ["admin-hoy", "admin-ajustes"])),
  S("admin-plan", "admin", "Admin · Ajustes y planes", "Editar plan (cupos)", () => goTo("admin-plan", { id: "combinado" }, ["admin-hoy", "admin-ajustes", "admin-planes"])),

  S("instructor-hoy", "instructor", "Instructor", "Hoy", () => goTo("admin-hoy")),
  S("instructor-clase", "instructor", "Instructor", "Clase (solo lectura)", () => goTo("instructor-clase", { id: "mie-19-yog@11" }, ["admin-hoy"])),
];
function applyState(id) {
  const st = STATES.find((s) => s.id === id) || STATES[2];
  M = freshModel();
  M.role = st.role;
  st.apply();
  M.stateId = st.id;
  paint();
}

function renderDemo() {
  const box = document.querySelector(".demo");
  if (!box) return;
  const groups = [...new Set(STATES.map((s) => s.group))];
  const roleStart = { cliente: "mis-clases", admin: "admin-hoy", instructor: "instructor-hoy" };
  box.innerHTML = `<h2>Controles de demo</h2><p>No son parte de la app. Saltá de rol o de estado; dentro del teléfono todo se navega tocando.</p>
    <div class="demo-roles">${Object.keys(roleStart).map((r) => `<button type="button" data-demo-state="${roleStart[r]}" aria-pressed="${M.role === r}">${r}</button>`).join("")}</div>
    ${groups.filter((g) => STATES.some((s) => s.group === g && (s.role === M.role || g === "Ingreso"))).map((g) => `<details ${STATES.some((s) => s.group === g && s.id === M.stateId) ? "open" : ""}><summary>${g}</summary><div class="demo-states">${STATES.filter((s) => s.group === g).map((s) => `<button type="button" data-demo-state="${s.id}" aria-pressed="${s.id === M.stateId}">${s.label}</button>`).join("")}</div></details>`).join("")}
    <p style="margin-top:12px">Hoy es miércoles 11 de noviembre, 9:41. Sofi tiene plan Combinado 3: Yoga los miércoles y dos clases libres (Pilates los lunes, Gimnasio los viernes).</p>`;
}

function boot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  if (shot) document.body.classList.add("shot");
  const phone = main();
  phone.addEventListener("click", onClick);
  phone.addEventListener("change", onChange);
  phone.addEventListener("input", onInput);
  document.querySelector(".demo")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-demo-state]");
    if (b) applyState(b.dataset.demoState);
  });
  applyState(shot || params.get("state") || "mis-clases");
}
window.__proto = { applyState, STATES, get M() { return M; } };
boot();
