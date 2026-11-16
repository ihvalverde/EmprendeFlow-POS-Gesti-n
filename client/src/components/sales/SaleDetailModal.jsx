import { Ban, Calendar, CreditCard, Receipt, User, X } from 'lucide-react';
import { formatDateTime, formatMoney, formatPercent } from '../../lib/format.js';
import { PAYMENT_MAP } from '../../lib/constants.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Badge from '../ui/Badge.jsx';

export default function SaleDetailModal({ open, sale, onClose, onRequestCancel }) {
  if (!sale) return null;

  const payment = PAYMENT_MAP[sale.paymentMethod];
  const cancelled = sale.status === 'CANCELLED';
  const marginPercent = sale.total > 0 ? (sale.profit / sale.total) * 100 : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Venta ${sale.code}`}
      description={formatDateTime(sale.soldAt)}
      size="lg"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>
            {!cancelled && (
              <Button variant="danger" onClick={() => onRequestCancel?.(sale)}>
                <Ban className="h-4 w-4" /> Anular venta
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={cancelled ? 'rose' : 'emerald'} dot>
            {cancelled ? 'Anulada' : 'Completada'}
          </Badge>
          {payment && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${payment.badge}`}>
              <payment.icon className="h-3 w-3" /> {payment.label}
            </span>
          )}
          <Badge tone="slate">
            {sale.itemCount} artículo{sale.itemCount === 1 ? '' : 's'}
          </Badge>
          {sale.totalDiscount > 0 && (
            <Badge tone="amber">Rebaja −{formatMoney(sale.totalDiscount)}</Badge>
          )}
        </div>

        {cancelled && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            Esta venta fue anulada el {formatDateTime(sale.cancelledAt)}. El stock fue restaurado.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total cobrado</p>
            <p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">
              {formatMoney(sale.total)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Costo real</p>
            <p className="mt-1 text-sm font-extrabold text-slate-700 dark:text-slate-200">
              {formatMoney(sale.totalCost)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
              Ganancia
            </p>
            <p className="mt-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatMoney(sale.profit)}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300">
              Rebaja otorgada
            </p>
            <p className="mt-1 text-sm font-extrabold text-amber-700 dark:text-amber-300">
              {formatMoney(sale.totalDiscount)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/60">
              <tr>
                <th className="px-3 py-2.5 font-bold">Producto</th>
                <th className="px-3 py-2.5 text-center font-bold">Cant.</th>
                <th className="px-3 py-2.5 text-right font-bold">P. lista</th>
                <th className="px-3 py-2.5 text-right font-bold">P. vendido</th>
                <th className="px-3 py-2.5 text-right font-bold">Rebaja</th>
                <th className="px-3 py-2.5 text-right font-bold">Costo</th>
                <th className="px-3 py-2.5 text-right font-bold">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{item.productName}</p>
                    <p className="text-[10px] text-slate-400">
                      {item.variant ? `${item.variant} · ` : ''}
                      {item.categoryName}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold text-slate-600 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400">
                    {formatMoney(item.listPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                    {formatMoney(item.finalSoldPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {item.discount > 0 ? (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        −{formatMoney(item.discount)}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500 dark:text-slate-400">
                    {formatMoney(item.costPrice * item.quantity)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {formatMoney(item.lineProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Receipt className="h-3.5 w-3.5" /> Detalle de la venta
            </p>
            <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <User className="h-3.5 w-3.5 text-slate-400" />
              {sale.customerName || 'Cliente mostrador'}
            </p>
            <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              {payment?.label || sale.paymentMethod}
            </p>
            <p className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {formatDateTime(sale.soldAt)}
            </p>
            {sale.notes && (
              <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] italic text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                “{sale.notes}”
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Totales</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Precio de lista</span>
                <span className="font-semibold">{formatMoney(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>Rebaja otorgada</span>
                <span className="font-bold">−{formatMoney(sale.totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Costo real</span>
                <span className="font-semibold">{formatMoney(sale.totalCost)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white">Total cobrado</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {formatMoney(sale.total)}
                </span>
              </div>
              <div className="flex justify-between rounded-lg bg-emerald-50 px-2 py-1.5 dark:bg-emerald-500/10">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">Ganancia bruta</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                  {formatMoney(sale.profit)} · {formatPercent(marginPercent)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
