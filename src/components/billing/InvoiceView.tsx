import { Printer, X } from 'lucide-react';
import type { Invoice } from '../../types';

interface Props {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoiceView({ invoice, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Actions bar - hidden on print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 print:hidden flex-shrink-0">
          <h2 className="text-slate-800 font-semibold">Vista Previa de Factura</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice body */}
        <div className="overflow-y-auto flex-1 p-6 invoice-print-area">
          <PrintableInvoice invoice={invoice} />
        </div>
      </div>
    </div>
  );
}

export function PrintableInvoice({ invoice }: { invoice: Invoice }) {
  return (
    <div className="font-sans text-slate-800 max-w-lg mx-auto" id="invoice-print">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Consultorio Veterinario Dr. Cedeño</h1>
        <p className="text-slate-500 text-sm mt-1">Factura de Servicios</p>
      </div>

      {/* Meta */}
      <div className="flex justify-between mb-6 text-sm">
        <div>
          <p className="text-slate-500">Factura No.</p>
          <p className="font-semibold text-slate-800">{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Fecha</p>
          <p className="font-semibold text-slate-800">
            {new Date(invoice.date).toLocaleDateString('es-PA', {
              day: '2-digit', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Client */}
      <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm">
        <p className="text-slate-500 text-xs uppercase tracking-wide font-medium mb-2">Cliente</p>
        <p className="font-semibold text-slate-800">{invoice.ownerName || '–'}</p>
        {invoice.petName && <p className="text-slate-600">Paciente: {invoice.petName}</p>}
      </div>

      {/* Items table */}
      <table className="w-full text-sm mb-5">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left text-slate-500 font-medium pb-2 text-xs uppercase tracking-wide">Descripción</th>
            <th className="text-center text-slate-500 font-medium pb-2 text-xs uppercase tracking-wide">Cant.</th>
            <th className="text-right text-slate-500 font-medium pb-2 text-xs uppercase tracking-wide">P. Unit.</th>
            <th className="text-right text-slate-500 font-medium pb-2 text-xs uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map(item => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2 text-slate-700">{item.description}</td>
              <td className="py-2 text-center text-slate-600">{item.quantity}</td>
              <td className="py-2 text-right text-slate-600">${item.unitPrice.toFixed(2)}</td>
              <td className="py-2 text-right font-medium text-slate-700">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex flex-col items-end gap-1 text-sm mb-4">
        <div className="flex justify-between w-48">
          <span className="text-slate-500">Subtotal</span>
          <span className="text-slate-700">${invoice.subtotal.toFixed(2)}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="flex justify-between w-48">
            <span className="text-slate-500">ITBMS (7%)</span>
            <span className="text-slate-700">${invoice.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between w-48 border-t border-slate-300 pt-2 font-bold text-base">
          <span>Total</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-slate-50 rounded-lg p-3 text-sm">
          <p className="text-slate-500 text-xs font-medium mb-1">Notas</p>
          <p className="text-slate-700">{invoice.notes}</p>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        Gracias por confiar en el Consultorio Veterinario Dr. Cedeño
      </div>
    </div>
  );
}
