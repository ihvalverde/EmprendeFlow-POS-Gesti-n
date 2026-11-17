const LIMA_TZ = 'America/Lima';
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000;

const MONTHS_ES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function limaISODate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function limaStartOfDay(isoDate) {
  return new Date(`${isoDate}T00:00:00-05:00`);
}

export function getRange(range = 'month') {
  const today = limaISODate();
  const [year, month, day] = today.split('-').map(Number);

  if (range === 'all') {
    return { from: null, to: null, label: 'Histórico total', key: 'all' };
  }

  if (range === 'today') {
    return { from: limaStartOfDay(today), to: new Date(), label: 'Hoy', key: 'today' };
  }

  if (range === 'week') {
    const base = new Date(Date.UTC(year, month - 1, day));
    const offset = (base.getUTCDay() + 6) % 7; // lunes = 0
    base.setUTCDate(base.getUTCDate() - offset);
    const iso = base.toISOString().slice(0, 10);
    return { from: limaStartOfDay(iso), to: new Date(), label: 'Esta semana', key: 'week' };
  }

  const iso = `${year}-${String(month).padStart(2, '0')}-01`;
  return { from: limaStartOfDay(iso), to: new Date(), label: 'Este mes', key: 'month' };
}

export function previousRange({ from, to }) {
  if (!from || !to) return null;
  const duration = to.getTime() - from.getTime();
  const prevTo = new Date(from.getTime() - 1);
  const prevFrom = new Date(prevTo.getTime() - duration);
  return { from: prevFrom, to: prevTo };
}

export function limaMonthKey(date) {
  return new Date(date.getTime() - LIMA_OFFSET_MS).toISOString().slice(0, 7);
}

export function lastMonthKeys(count = 6) {
  const today = limaISODate();
  const [year, month] = today.split('-').map(Number);
  const keys = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export function startOfMonthsAgo(count = 5) {
  const today = limaISODate();
  const [year, month] = today.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1 - count, 1));
  const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return limaStartOfDay(iso);
}

export function monthLabel(key) {
  return MONTHS_ES[Number(key.slice(5, 7)) - 1] || key;
}

export function dateFilter(from, to) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

export function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100;
}
