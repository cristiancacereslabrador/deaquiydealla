
/**
 * @description Configuración de horarios reales del restaurante (fuente: Google Maps).
 * Zona horaria: Europe/Madrid (Granada, España).
 *
 * Horario real:
 *  - Lunes, Martes, Miércoles: 12:00 – 16:00
 *  - Jueves: CERRADO
 *  - Viernes, Sábado, Domingo: 12:00 – 21:30
 */

export type DaySchedule = {
  open: string;   // "HH:MM"
  close: string;  // "HH:MM"
} | null; // null = cerrado ese día

/** Índice 0 = Domingo, 1 = Lunes, ... 6 = Sábado */
export const DAILY_SCHEDULE: DaySchedule[] = [
  { open: "12:00", close: "21:30" }, // 0 Domingo
  { open: "12:00", close: "16:00" }, // 1 Lunes
  { open: "12:00", close: "16:00" }, // 2 Martes
  { open: "12:00", close: "16:00" }, // 3 Miércoles
  null,                               // 4 Jueves — CERRADO
  { open: "12:00", close: "21:30" }, // 5 Viernes
  { open: "12:00", close: "21:30" }, // 6 Sábado
];

const DAY_NAMES_ES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export type StoreStatusReason = "panic" | "schedule" | "closed_day" | null;

export type StoreStatus = {
  isOpen: boolean;
  reason: StoreStatusReason;
  nextOpening?: string; // Texto amigable para mostrar al usuario
};

/**
 * @description Obtiene la hora actual en Granada (Europe/Madrid) desglosada.
 */
function getNowInGranada() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "long",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";

  const hour = parseInt(get("hour"));
  const minute = parseInt(get("minute"));
  const weekdayName = get("weekday").toLowerCase();

  const dayMap: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miércoles: 3,
    jueves: 4, viernes: 5, sábado: 6,
  };

  const dayNumber = dayMap[weekdayName] ?? -1;
  const totalMinutes = hour * 60 + minute;

  return { dayNumber, totalMinutes };
}

/**
 * @description Obtiene el texto de próxima apertura buscando el siguiente día abierto.
 */
function getNextOpeningText(fromDay: number): string {
  for (let i = 1; i <= 7; i++) {
    const nextDay = (fromDay + i) % 7;
    const schedule = DAILY_SCHEDULE[nextDay];
    if (schedule) {
      const dayName = DAY_NAMES_ES[nextDay];
      const label = i === 1 ? "mañana" : `el ${dayName}`;
      return `${label} a las ${schedule.open}`;
    }
  }
  return "próximamente";
}

/**
 * @description Verifica si el local está abierto basándose en el horario real de Granada y el estado de pánico.
 * @param {boolean} panicActive - Si el cierre temporal manual está activado.
 * @returns {StoreStatus} Estado detallado del local.
 */
export function getStoreStatus(panicActive: boolean): StoreStatus {
  if (panicActive) {
    return { isOpen: false, reason: "panic" };
  }

  const { dayNumber, totalMinutes } = getNowInGranada();
  const todaySchedule = DAILY_SCHEDULE[dayNumber];

  // Día sin horario = cerrado ese día
  if (!todaySchedule) {
    const nextOpening = getNextOpeningText(dayNumber);
    return { isOpen: false, reason: "closed_day", nextOpening };
  }

  const [openH, openM] = todaySchedule.open.split(":").map(Number);
  const [closeH, closeM] = todaySchedule.close.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  // Dentro del horario
  if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
    return { isOpen: true, reason: null };
  }

  // Fuera de horario — antes de abrir hoy o después de cerrar
  if (totalMinutes < openMinutes) {
    return {
      isOpen: false,
      reason: "schedule",
      nextOpening: `hoy a las ${todaySchedule.open}`,
    };
  }

  // Ya cerró hoy, buscar siguiente día abierto
  return {
    isOpen: false,
    reason: "schedule",
    nextOpening: getNextOpeningText(dayNumber),
  };
}

/** Para uso en el admin: devuelve el horario de hoy como texto legible */
export function getTodayScheduleText(): string {
  const { dayNumber } = getNowInGranada();
  const schedule = DAILY_SCHEDULE[dayNumber];
  if (!schedule) return "Cerrado hoy";
  return `${schedule.open} – ${schedule.close}`;
}

