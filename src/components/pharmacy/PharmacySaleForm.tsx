import { useState } from 'react';
import { X } from 'lucide-react';
import type { PharmacyItem, PharmacySale, PaymentMethod } from '../../types';
import { localDateString } from '../../context/AppContext';

interface Props {
  items: PharmacyItem[];
  onSave: (sale: PharmacySale) => void;
  onClose: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; color: string }[] = [
  { value: 'Efectivo', color: 'bg-green-600 border-green-600' },
  { value: 'Yappy', color: 'bg-blue-600 border-blue-600' },
  { value: 'Transferencia', color: 'bg-violet-600 border-violet-600' },
];

export default function PharmacySaleForm({ items, onSave, onClose }: Props) {
  const [itemId, setItemId] = useState(items[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [date, setDate] = useState(localDateString());
  const [notes, setNotes] = useState('');

  const selectedItem = items.find(i => i.id === itemId);
  const total = selectedItem ? selectedItem.salePrice * quantity : 0;
  const insufficient = selectedItem ? quantity > selectedItem.stock : false;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem || quantity < 1 || insufficient) return;
    onSave({
      id: crypto.randomUUID(),
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity,
      unitPrice: selectedItem.salePrice,
      total,
      paymentMethod,
      date,
      notes,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-slate-800 font-semibold">Registrar Venta</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Producto *</label>
            <select
              value={itemId}
              onChange={e => { setItemId(e.target.value); setQuantity(1); }}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {items.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} — ${i.salePrice.toFixed(2)} (stock: {i.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Cantidad *</label>
              <input
                type="number"
                min="1"
                max={selectedItem?.stock ?? 999}
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                required
                className={`w-full px-3 py-2 rounded-lg border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  insufficient ? 'border-red-400 bg-red-50' : 'border-slate-200'
                }`}
              />
              {insufficient && (
                <p className="text-red-500 text-xs mt-1">Stock insuficiente (disponible: {selectedItem?.stock})</p>
              )}
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Método de Pago *</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(({ value: m, color }) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    paymentMethod === m ? `${color} text-white` : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Notas</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Cliente, observaciones..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {selectedItem && (
            <div className="bg-teal-50 rounded-lg p-3 flex justify-between items-center">
              <span className="text-teal-700 text-sm font-medium">Total a cobrar</span>
              <span className="text-teal-800 font-bold text-lg">${total.toFixed(2)}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={insufficient || !selectedItem || quantity < 1}
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar Venta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
