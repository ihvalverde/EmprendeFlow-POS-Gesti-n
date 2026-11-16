import {
  Banknote,
  BookOpen,
  Backpack,
  Baby,
  Building2,
  CreditCard,
  Crown,
  Footprints,
  Gamepad2,
  Gem,
  Gift,
  Heart,
  Home,
  Package,
  Palette,
  QrCode,
  Rocket,
  Scissors,
  Shapes,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Star,
  Tag,
  Watch,
  Bike,
} from 'lucide-react';

export const PAYMENT_METHODS = [
  {
    value: 'EFECTIVO',
    label: 'Efectivo',
    icon: Banknote,
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300',
    dot: '#10B981',
  },
  {
    value: 'YAPE',
    label: 'Yape',
    icon: Smartphone,
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-500/10 dark:text-violet-300',
    dot: '#8B5CF6',
  },
  {
    value: 'PLIN',
    label: 'Plin',
    icon: QrCode,
    badge: 'bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-300',
    dot: '#0EA5E9',
  },
  {
    value: 'TRANSFERENCIA',
    label: 'Transferencia',
    icon: Building2,
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300',
    dot: '#F59E0B',
  },
  {
    value: 'TARJETA',
    label: 'Tarjeta',
    icon: CreditCard,
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-300',
    dot: '#EF4444',
  },
];

export const PAYMENT_MAP = PAYMENT_METHODS.reduce((acc, method) => {
  acc[method.value] = method;
  return acc;
}, {});

export const EXPENSE_TYPES = {
  INVESTMENT: {
    label: 'Inversión en mercadería',
    short: 'Inversión',
    color: '#EF4444',
    badge: 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-300',
    description: 'Compra de stock para vender',
  },
  OPERATING: {
    label: 'Gasto operativo',
    short: 'Operativo',
    color: '#F97316',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300',
    description: 'Pasajes, comida, empaques, publicidad',
  },
};

export const CATEGORY_ICONS = {
  Tag,
  Rocket,
  Heart,
  Shapes,
  Shirt,
  Sparkles,
  Baby,
  Gamepad2,
  Gift,
  Footprints,
  Gem,
  Home,
  Package,
  Palette,
  Scissors,
  ShoppingBag,
  BookOpen,
  Star,
  Crown,
  Backpack,
  Watch,
  Bike,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const CATEGORY_COLORS = [
  '#4F46E5', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#F59E0B', '#10B981', '#0EA5E9', '#14B8A6',
  '#64748B', '#0F172A',
];

export const CHART_COLORS = ['#4F46E5', '#F59E0B', '#10B981', '#0EA5E9', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export const RANGE_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'all', label: 'Histórico' },
];
