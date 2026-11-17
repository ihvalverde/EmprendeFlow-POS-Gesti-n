const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('es-PE');

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'America/Lima',
  day: '2-digit',
  month: 'short',
});

const limaISOFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const formatMoney = (value) => moneyFormatter.format(Number(value || 0));

export const formatNumber = (value) => numberFormatter.format(Number(value || 0));

export const formatPercent = (value, digits = 1) =>
  `${Number(value || 0).toFixed(digits)}%`;

export const formatDate = (value) => (value ? dateFormatter.format(new Date(value)) : '—');

export const formatDateTime = (value) =>
  value ? dateTimeFormatter.format(new Date(value)) : '—';

export const formatShortDate = (value) =>
  value ? shortDateFormatter.format(new Date(value)) : '—';

export const limaInputDate = (date = new Date()) => limaISOFormatter.format(date);

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'EF';
