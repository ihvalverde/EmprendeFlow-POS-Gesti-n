import {
  Boxes,
  Calendar,
  CreditCard,
  ExternalLink,
  FileImage,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { assetUrl } from '../../lib/api.js';
import { EXPENSE_TYPES, PAYMENT_MAP } from '../../lib/constants.js';
import { formatDate, formatDateTime, formatMoney } from '../../lib/format.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

export default function ExpenseDetailModal({ open, expense, onClose, onRequestDelete }) {
  if (!expense) return null;

  const type = EXPENSE_TYPES[expense.type] || EXPENSE_TYPES.OPERATING;
  const payment = PAYMENT_MAP[expense.paymentMethod];
  const itemsTotal = (expense.items || []).reduce((sum, item) => sum + item.lineTotal, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del movimiento"
      description={formatDateTime(expense.createdAt)}
      size="md"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {onRequestDelete && (
              <Button variant="danger" onClick={() => onRequestDelete(expense)}>
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            <X className="h-4 w-4" /> Cerrar
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${type.badge}`}>
              {type.label}
            </span>
            {expense.expenseCategory && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{
                  backgroundColor: `${expense.expenseCategory.color}16`,
                  color: expense.expenseCategory.color,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: expense.expenseCategory.color }}
                />
                {expense.expenseCategory.name}
              </span>
            )}
            {payment && <Badge tone="slate">{payment.label}</Badge>}
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
            {expense.description}
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {formatMoney(expense.amount)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="h-3.5 w-3.5" /> {formatDate(expense.date)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <Store className="h-3 w-3" /> Proveedor
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {expense.supplier || 'No especificado'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <CreditCard className="h-3 w-3" /> Método de pago
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {payment?.label || expense.paymentMethod || 'No especificado'}
            </p>
          </div>
        </div>

        {expense.items?.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <Boxes className="h-3.5 w-3.5" /> Stock vinculado
              </p>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {formatMoney(itemsTotal)}
              </p>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-3 py-2 font-bold">Producto</th>
                  <th className="px-3 py-2 text-center font-bold">Cant.</th>
                  <th className="px-3 py-2 text-right font-bold">Costo unit.</th>
                  <th className="px-3 py-2 text-right font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                {expense.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-500 dark:text-slate-400">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500 dark:text-slate-400">
                      {formatMoney(item.unitCost)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-slate-900 dark:text-white">
                      {formatMoney(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {expense.notes && (
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs italic text-slate-500 dark:bg-slate-800/40 dark:text-slate-400">
            “{expense.notes}”
          </div>
        )}

        {expense.receiptUrl && (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <FileImage className="h-3.5 w-3.5" /> Comprobante
            </p>
            <a
              href={assetUrl(expense.receiptUrl)}
              target="_blank"
              rel="noreferrer"
              className="group relative block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <img
                src={assetUrl(expense.receiptUrl)}
                alt="Comprobante"
                className="max-h-64 w-full object-cover transition group-hover:opacity-90"
              />
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-slate-950/70 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                <ExternalLink className="h-3 w-3" /> Ver completa
              </span>
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}
