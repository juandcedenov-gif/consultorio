import { useState } from 'react';
import {
  Plus,
  Trash2,
  Receipt,
  Eye,
  Search,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';
import type { Invoice, InvoiceItem } from '../../types';
import InvoiceView from './InvoiceView';

function newItem(): InvoiceItem {
  return { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 };
}

export default function BillingModule() {
  const { owners, pets, invoices, addInvoice, deleteInvoice, nextInvoiceNumber } = useApp();

  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Invoice | null>(null);

  const [ownerName, setOwnerName] = useState('');
  const [petName, setPetName] = useState('');
  const [date, setDate] = useState(localDateString());
  const [items, setItems] = useState<InvoiceItem[]>([newItem()]);
  const [applyTax, setApplyTax] = useState(false);
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const tax = applyTax ? subtotal * 0.07 : 0;
  const total = subtotal + tax;

  function handleOwnerSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const owner = owners.find(o => o.id === e.target.value);
    setOwnerName(owner?.name ?? '');
  }

  function handlePetSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const pet = pets.find(p => p.id === e.target.value);
    setPetName(pet?.name ?? '');
  }

  function updateItem(id: string, field: keyof InvoiceItem, value: string | number) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || items.every(i => !i.description.trim())) return;

    const invoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: nextInvoiceNumber(),
      date,
      ownerName,
      petName,
      items,
      subtotal,
      tax,
      total,
      notes,
      createdAt: new Date().toISOString(),
    };
    addInvoice(invoice);
    setViewing(invoice);
    resetForm();
  }

  function resetForm() {
    setCreating(false);
    setOwnerName('');
    setPetName('');
    setDate(localDateString());
    setItems([newItem()]);
    setApplyTax(false);
    setNotes('');
  }

  const filtered = invoices.filter(
    inv =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.petName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, número..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Nueva Factura
        </button>
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Receipt size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{search ? 'Sin resultados.' : 'No hay facturas emitidas aún.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">N° Factura</th>
                <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Cliente</th>
                <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden sm:table-cell">Paciente</th>
                <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide hidden md:table-cell">Fecha</th>
                <th className="text-right text-slate-500 font-medium px-4 py-3 text-xs uppercase tracking-wide">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-teal-700 font-medium text-xs">
                    Factura {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{inv.ownerName || '–'}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{inv.petName || '–'}</td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {new Date(inv.date + 'T12:00:00').toLocaleDateString('es-PA')}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    ${inv.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setViewing(inv)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        title="Ver / Imprimir"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => { if (confirm('¿Eliminar esta factura?')) deleteInvoice(inv.id); }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create invoice modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                <div>
                  <h2 className="text-slate-800 font-semibold">Nueva Factura</h2>
                  <p className="text-slate-400 text-xs">Próximo número: Factura {nextInvoiceNumber()}</p>
                </div>
              </div>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-700 text-sm">Cancelar</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Cliente (opcional)</label>
                  <select
                    onChange={handleOwnerSelect}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Seleccionar o escribir</option>
                    {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Nombre del Cliente</label>
                  <input
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="Puede escribir libremente"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Paciente</label>
                  <div className="flex gap-2">
                    <select
                      onChange={handlePetSelect}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Seleccionar</option>
                      {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      value={petName}
                      onChange={e => setPetName(e.target.value)}
                      placeholder="o escribir"
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-600 text-sm font-medium">Conceptos / Servicios *</label>
                  <button
                    type="button"
                    onClick={() => setItems(prev => [...prev, newItem()])}
                    className="flex items-center gap-1 text-teal-600 text-xs font-medium hover:underline"
                  >
                    <Plus size={13} /> Añadir línea
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-slate-400 font-medium px-1">
                    <span className="col-span-6">Descripción</span>
                    <span className="col-span-2 text-center">Cant.</span>
                    <span className="col-span-3 text-right">P. Unit.</span>
                    <span className="col-span-1" />
                  </div>
                  {items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción del servicio o producto"
                        className="col-span-6 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="col-span-3 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                        className="col-span-1 flex justify-center text-slate-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tax + totals */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={e => setApplyTax(e.target.checked)}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    Aplicar ITBMS (7%)
                  </label>
                  <div>
                    <label className="block text-slate-600 text-sm font-medium mb-1.5">Notas (opcional)</label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    />
                  </div>
                </div>
                <div className="text-sm space-y-1 min-w-36">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {applyTax && (
                    <div className="flex justify-between text-slate-500">
                      <span>ITBMS</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-1 mt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Generar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <InvoiceView invoice={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
