// Datos de ejemplo del prototipo. Semana del lunes 9 al domingo 29 de noviembre de 2026; hoy es miércoles 11, 9:41.
const ASSETS = "../screens/reservar/assets";
const TODAY = 11;

const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const WEEKDAYS_SHORT = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const dow = (d) => (d - 9) % 7; // 9 de noviembre = lunes
const dayName = (d) => WEEKDAYS[dow(d)];
const dayLabel = (d) => (d === TODAY ? "Hoy" : d === TODAY + 1 ? "Mañana" : `${cap(WEEKDAYS_SHORT[dow(d)])} ${d}`);
const dayLong = (d) => `${cap(dayName(d))} ${d}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Una clase pendiente vence el domingo de la semana siguiente a la clase perdida.
const expiryFor = (d) => d - dow(d) + 13;

const ACTIVITIES = {
  pilates: { name: "Pilates", wash: "celeste", image: "pilates.png", imageClass: "" },
  yoga: { name: "Yoga", wash: "green", image: "yoga.png", imageClass: "yoga" },
  gimnasio: { name: "Gimnasio", wash: "blue", image: "gimnasio.png", imageClass: "gym" },
};

// Horarios de clase semanales (lun = 0).
const SLOTS = [
  { id: "lun-18-pil", day: 0, time: "18:00", act: "pilates", center: "Mendoza", instructor: "Agus", cap: 10 },
  { id: "lun-19-yog", day: 0, time: "19:00", act: "yoga", center: "Ovidio Lagos", instructor: "Mica", cap: 10 },
  { id: "mar-18-gym", day: 1, time: "18:00", act: "gimnasio", center: "Mendoza", instructor: "Nico", cap: 12 },
  { id: "mar-19-pil", day: 1, time: "19:30", act: "pilates", center: "Ovidio Lagos", instructor: "Agus", cap: 8 },
  { id: "mie-18-pil", day: 2, time: "18:00", act: "pilates", center: "Mendoza", instructor: "Agus", cap: 10 },
  { id: "mie-19-yog", day: 2, time: "19:00", act: "yoga", center: "Ovidio Lagos", instructor: "Mica", cap: 10 },
  { id: "mie-20-gym", day: 2, time: "20:00", act: "gimnasio", center: "Mendoza", instructor: "Nico", cap: 12 },
  { id: "jue-18-pil", day: 3, time: "18:00", act: "pilates", center: "Mendoza", instructor: "Agus", cap: 10 },
  { id: "jue-19-gym", day: 3, time: "19:00", act: "gimnasio", center: "Ovidio Lagos", instructor: "Nico", cap: 12 },
  { id: "vie-18-gym", day: 4, time: "18:00", act: "gimnasio", center: "Mendoza", instructor: "Nico", cap: 12 },
  { id: "vie-19-yog", day: 4, time: "19:00", act: "yoga", center: "Mendoza", instructor: "Mica", cap: 10 },
  { id: "sab-10-pil", day: 5, time: "10:00", act: "pilates", center: "Mendoza", instructor: "Agus", cap: 8 },
];
const slotById = (id) => SLOTS.find((s) => s.id === id);

// Personas con horario fijo por horario de clase (cuántos fijos tiene cada uno).
const FIXED_COUNT = {
  "lun-18-pil": 9, "lun-19-yog": 7, "mar-18-gym": 10, "mar-19-pil": 8, "mie-18-pil": 8,
  "mie-19-yog": 8, "mie-20-gym": 12, "jue-18-pil": 6, "jue-19-gym": 12, "vie-18-gym": 9,
  "vie-19-yog": 5, "sab-10-pil": 4,
};

// Sesión = horario + fecha.
const sid = (slotId, d) => `${slotId}@${d}`;
function session(id) {
  const [slotId, d] = id.split("@");
  const slot = slotById(slotId);
  return { id, slot, d: Number(d), act: ACTIVITIES[slot.act] };
}
function sessionsOn(d) {
  return SLOTS.filter((s) => s.day === dow(d)).map((s) => session(sid(s.id, d)));
}

const PLANS = [
  { id: "combinado", name: "Combinado 3", price: 38000, people: 14,
    quotas: [{ count: 1, acts: ["yoga"] }, { count: 2, acts: "any" }] },
  { id: "libre3", name: "Libre 3", price: 42000, people: 22, quotas: [{ count: 3, acts: "any" }] },
  { id: "yogapil", name: "Yoga y Pilates", price: 30000, people: 9,
    quotas: [{ count: 1, acts: ["yoga"] }, { count: 1, acts: ["pilates"] }] },
  { id: "dos", name: "2 de Yoga o Pilates", price: 29000, people: 11, quotas: [{ count: 2, acts: ["yoga", "pilates"] }] },
];
const planById = (id) => PLANS.find((p) => p.id === id);
const actsText = (acts) => (acts === "any" ? "cualquier actividad" : acts.map((a) => ACTIVITIES[a].name).join(" o "));
const quotaText = (q) => (q.acts === "any" ? `${q.count} ${q.count === 1 ? "clase libre" : "clases libres"}` : `${q.count} ${q.count === 1 ? "clase" : "clases"} de ${actsText(q.acts)}`);
const planSummary = (p) => p.quotas.map(quotaText).join(" + ");
const planWeekly = (p) => p.quotas.reduce((n, q) => n + q.count, 0);
const money = (n) => "$" + n.toLocaleString("es-AR");

// Sofi: plan Combinado 3. Cada horario fijo cubre un cupo del plan.
const SOFI_FIXED = [
  { slot: "lun-18-pil", quota: 1 },
  { slot: "mie-19-yog", quota: 0 },
  { slot: "vie-18-gym", quota: 1 },
];

const PEOPLE = [
  { id: "sofi", name: "Sofi Ortiz", initials: "SO", plan: "combinado", schedule: true, pay: "pendiente" },
  { id: "lu", name: "Lu Martínez", initials: "LM", plan: "libre3", schedule: true, pay: "pagado" },
  { id: "juan", name: "Juan Ponce", initials: "JP", plan: "dos", schedule: true, pay: "pagado" },
  { id: "carla", name: "Carla Vico", initials: "CV", plan: "yogapil", schedule: false, pay: "pagado" },
  { id: "mati", name: "Mati Ruiz", initials: "MR", plan: "libre3", schedule: true, pay: "atrasado" },
  { id: "ana", name: "Ana Gómez", initials: "AG", plan: "combinado", schedule: true, pay: "revision" },
  { id: "fede", name: "Fede Paz", initials: "FP", plan: null, schedule: false, pay: null },
  { id: "nati", name: "Nati Acosta", initials: "NA", plan: "libre3", schedule: true, pay: "revision" },
  { id: "tomi", name: "Tomi Sosa", initials: "TS", plan: "yogapil", schedule: true, pay: "revision" },
  { id: "flor", name: "Flor Ibáñez", initials: "FI", plan: "dos", schedule: true, pay: "atrasado" },
];
const personById = (id) => PEOPLE.find((p) => p.id === id);
const PAY_TEXT = { pendiente: "Cuota pendiente", revision: "Comprobante en revisión", pagado: "Al día", atrasado: "Cuota atrasada" };

// Asistentes de ejemplo (orden estable por horario).
const ROSTER_POOL = ["juan", "lu", "ana", "mati", "nati", "tomi", "flor"];
const EXTRA_NAMES = ["Pau Rey", "Gime Luna", "Leo Funes", "Caro Díaz", "Rami Gil", "Vero Paz", "Santi Roca"];
