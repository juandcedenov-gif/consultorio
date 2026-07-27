import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, ShoppingBag, TrendingDown, Wallet, Banknote, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Expense } from '../../types';

export default function ExpensesModule() {
  const { addExpense, updateExpense, deleteExpense, getWeeklyTotals, getExpensesForWeek } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState({ description: '', cost: 0, date: new Date().toISOString().slice(0, 10) });
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = previous, etc.

  // Compute the reference date for the selected week
  const weekDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekRange = useMemo(() => {
    const d = new Date(weekDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }),
      end: sunday.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }),
    };
  }, [weekDate]);

  // Only expenses for the selected week
  const weekExpenses = useMemo(() => getExpensesForWeek(weekDate), [getExpensesForWeek, weekDate]);
  const sorted = useMemo(() => [...weekExpenses].sort((a, b) => b.date.localeCompare(a.date)), [weekExpenses]);

  // Cash available ONLY from "Efectivo" payments + abonos this week (Req 5)
  const weeklyTotals = useMemo(() => getWeeklyTotals(weekDate), [getWeeklyTotals, weekDate]);
  const cashBase = weeklyTotals.cash;

  const totalGastos = useMemo(() => weekExpenses.reduce((a, e) => a + e.cost, 0), [weekExpenses]);
  const efectivoRestante = Math.max(0, cashBase - totalGastos);

  function openAdd() {
    setEditing(null);
    setForm({ description: '', cost: 0, date: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    setForm({ description: e.description, cost: e.cost, date: e.date });
    setShowForm(true);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.description.trim() || form.cost <= 0) return;
    if (editing) {
      updateExpense({ ...editing, description: form.description.trim(), cost: form.cost, date: form.date });
    } else {
      addExpense({
        id: crypto.randomUUID(),
        description: form.description.trim(),
        cost: form.cost,
        date: form.date,
        createdAt: new Date().toISOString(),
      });
    }
    setShowForm(false);
  }

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <ShoppingBag size={20} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold text-lg">Gastos / Salidas</h2>
            <p className="text-slate-400 text-xs">Control de caja física y compras de insumos</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
        >
          <Plus size={16} /> Nuevo Gasto
        </button>
      </div>

      {/* Week selector (Req 5) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(o => o - 1)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Semana anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 text-center">
          <CalendarDays size={16} className="text-slate-400" />
          <div>
            <p className="text-slate-700 text-sm font-semibold">
              {isCurrentWeek ? 'Semana Actual' : `Hace ${Math.abs(weekOffset)} semana${Math.abs(weekOffset) !== 1 ? 's' : ''}`}
            </p>
            <p className="text-slate-400 text-xs">{weekRange.start} — {weekRange.end}</p>
          </div>
        </div>
        <button
          onClick={() => setWeekOffset(o => Math.min(0, o + 1))}
          disabled={isCurrentWeek}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Semana siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Cash box summary — only Efectivo feeds this (Req 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Banknote size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">Efectivo de la Semana (solo pagos en Efectivo)</p>
            <p className="text-xl font-bold text-slate-800">${cashBase.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-slate-400 text-xs">Total de Gastos de la Semana</p>
            <p className="text-xl font-bold text-red-600">${totalGastos.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
            <Wallet size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-teal-700 text-xs font-medium">Efectivo Restante en Caja</p>
            <p className="text-2xl font-bold text-teal-700">${efectivoRestante.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <ShoppingBag size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No hay gastos registrados en esta semana.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-right px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Costo</th>
                <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                <th className="text-right px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(e => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-800 text-sm">{e.description}</td>
                  <td className="px-4 py-3 text-right text-slate-800 text-sm font-semibold">${e.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-slate-500 text-sm">{e.date}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(e)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteExpense(e.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={1} className="px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide text-right">Total:</td>
                <td className="px-4 py-3 text-right text-slate-800 text-sm font-bold">${totalGastos.toFixed(2)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-slate-800 font-semibold">{editing ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Producto / Descripción *</label>
                <input
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                  placeholder="Ej. Shampoo medicado, vacunas, etc."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Costo (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={e => setForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {form.cost > efectivoRestante && (
                  <p className="text-red-500 text-xs mt-1">Este gasto excede el efectivo disponible en caja (${efectivoRestante.toFixed(2)}).</p>
                )}
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors">
                  {editing ? 'Guardar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
