import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, X, CreditCard, DollarSign, Calendar, Search, Check, ChevronDown, ChevronRight, User, PawPrint, Banknote, Smartphone, ArrowLeftRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Debt, DebtPayment, ServiceType, PaymentMethod } from '../../types';

const SERVICE_TYPES: ServiceType[] = [
  'Consulta',
  'Vacunación',
  'Desparasitación',
  'Cirugía',
  'Baño y Corte',
  'Baño Medicado',
  'Baño Garrapaticida',
  'Baño Normal',
  'Tratamiento',
  'Clínica',
  'Exámenes',
  'Exportación',
  'Corte de Uña',
  'Otro',
];

const PAYMENT_METHODS: PaymentMethod[] = ['Efectivo', 'Yappy', 'Transferencia'];

export default function DebtsModule() {
  const { debts, owners, pets, addDebt, updateDebt, deleteDebt, addDebtPayment, deleteDebtPayment } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [expandedPetId, setExpandedPetId] = useState<string | null>(null);
  const [abonoPetId, setAbonoPetId] = useState<string | null>(null);
  const [abonoForm, setAbonoForm] = useState<{ amount: number; date: string; method: PaymentMethod }>({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    method: 'Efectivo',
  });

  const [form, setForm] = useState({
    ownerId: '',
    petId: '',
    description: '',
    totalAmount: 0,
    date: new Date().toISOString().slice(0, 10),
    serviceType: 'Consulta' as ServiceType,
  });

  // Client search results (for the main search bar)
  const clientResults = useMemo(() => {
    const q = clientSearch.toLowerCase().trim();
    if (!q) return [];
    return owners.filter(o => {
      const ownerMatch = o.name.toLowerCase().includes(q);
      const petMatch = pets.some(p => p.ownerId === o.id && p.name.toLowerCase().includes(q));
      return ownerMatch || petMatch;
    }).slice(0, 8);
  }, [clientSearch, owners, pets]);

  const selectedOwner = owners.find(o => o.id === selectedOwnerId);

  // All debts for the selected owner, grouped by pet
  const ownerDebts = useMemo(() => {
    if (!selectedOwnerId) return [];
    return debts.filter(d => d.ownerId === selectedOwnerId);
  }, [debts, selectedOwnerId]);

  const debtsByPet = useMemo(() => {
    const map = new Map<string, Debt[]>();
    ownerDebts.forEach(d => {
      const arr = map.get(d.petId) ?? [];
      arr.push(d);
      map.set(d.petId, arr);
    });
    return map;
  }, [ownerDebts]);

  const ownerPets = useMemo(() => {
    if (!selectedOwnerId) return [];
    return pets.filter(p => p.ownerId === selectedOwnerId);
  }, [pets, selectedOwnerId]);

  // Totals
  const totalGeneral = ownerDebts.reduce((sum, d) => {
    const paid = d.payments.reduce((s, p) => s + p.amount, 0);
    return sum + (d.totalAmount - paid);
  }, 0);

  const totalDebtAll = ownerDebts.reduce((s, d) => s + d.totalAmount, 0);
  const totalPaidAll = ownerDebts.reduce((s, d) => s + d.payments.reduce((sum, p) => sum + p.amount, 0), 0);

  // Summary of all clients with active debts (Req 3)
  const allDebtorsSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of debts) {
      const paid = d.payments.reduce((s, p) => s + p.amount, 0);
      const balance = d.totalAmount - paid;
      if (balance > 0.01) {
        map.set(d.ownerId, (map.get(d.ownerId) ?? 0) + balance);
      }
    }
    return owners
      .map(o => ({ owner: o, balance: map.get(o.id) ?? 0 }))
      .filter(r => r.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);
  }, [debts, owners]);

  const grandTotalDebts = allDebtorsSummary.reduce((s, r) => s + r.balance, 0);

  function petSubtotal(petId: string) {
    const petDebts = debtsByPet.get(petId) ?? [];
    return petDebts.reduce((sum, d) => {
      const paid = d.payments.reduce((s, p) => s + p.amount, 0);
      return sum + (d.totalAmount - paid);
    }, 0);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ownerId: selectedOwnerId || '', petId: '', description: '', totalAmount: 0, date: new Date().toISOString().slice(0, 10), serviceType: 'Consulta' });
    setShowForm(true);
  }

  function openEdit(d: Debt) {
    setEditing(d);
    setForm({ ownerId: d.ownerId, petId: d.petId, description: d.description, totalAmount: d.totalAmount, date: d.date, serviceType: d.serviceType ?? 'Consulta' });
    setShowForm(true);
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form.ownerId || !form.petId || form.totalAmount <= 0) return;
    if (editing) {
      updateDebt({ ...editing, ownerId: form.ownerId, petId: form.petId, description: form.description, totalAmount: form.totalAmount, date: form.date, serviceType: form.serviceType });
    } else {
      addDebt({
        id: crypto.randomUUID(),
        ownerId: form.ownerId,
        petId: form.petId,
        description: form.description.trim(),
        totalAmount: form.totalAmount,
        date: form.date,
        payments: [],
        serviceType: form.serviceType,
        createdAt: new Date().toISOString(),
      });
    }
    setShowForm(false);
  }

  function handleAddAbono(debtId: string) {
    if (abonoForm.amount <= 0) return;
    const payment: DebtPayment = {
      id: crypto.randomUUID(),
      amount: abonoForm.amount,
      date: abonoForm.date,
      createdAt: new Date().toISOString(),
      commissionEarned: 0,
      method: abonoForm.method,
    };
    addDebtPayment(debtId, payment);
    setAbonoForm({ amount: 0, date: new Date().toISOString().slice(0, 10), method: 'Efectivo' });
    setAbonoPetId(null);
  }

  const formOwnerPets = pets.filter(p => p.ownerId === form.ownerId);
  const selectedFormOwner = owners.find(o => o.id === form.ownerId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <CreditCard size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-slate-800 font-semibold text-lg">Deudas / Cuentas por Cobrar</h2>
            <p className="text-slate-400 text-xs">Estado de Cuenta consolidado por cliente</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <Plus size={16} /> Nueva Deuda
        </button>
      </div>

      {/* Client search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-slate-600 text-sm font-medium mb-2">Buscar Cliente</label>
        <div className="relative">
          <input
            type="text"
            value={clientSearch}
            onChange={e => {
              setClientSearch(e.target.value);
              setShowClientDropdown(true);
            }}
            onFocus={() => setShowClientDropdown(true)}
            onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
            placeholder="Escribe el nombre del cliente o mascota..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          {showClientDropdown && clientResults.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
              {clientResults.map(o => {
                const oPets = pets.filter(p => p.ownerId === o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onMouseDown={() => {
                      setSelectedOwnerId(o.id);
                      setClientSearch(o.name);
                      setShowClientDropdown(false);
                      setExpandedPetId(null);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      {selectedOwnerId === o.id && <Check size={14} className="text-red-500 flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-slate-800 text-sm font-medium truncate">{o.name}</p>
                        {oPets.length > 0 && (
                          <p className="text-slate-400 text-xs truncate">{oPets.map(p => p.name).join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Estado de Cuenta */}
      {selectedOwner ? (
        <div className="space-y-4">
          {/* Client header + total general */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-white/70 text-xs">Estado de Cuenta de</p>
                  <h3 className="text-white font-bold text-lg">{selectedOwner.name}</h3>
                  <p className="text-white/70 text-xs">{selectedOwner.phone || 'Sin teléfono'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs uppercase tracking-wide">Total General Adeudado</p>
                <p className="text-3xl font-bold">${totalGeneral.toFixed(2)}</p>
                <p className="text-white/70 text-xs">Deuda: ${totalDebtAll.toFixed(2)} · Abonado: ${totalPaidAll.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {ownerDebts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Check size={32} className="text-green-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Este cliente no tiene deudas registradas.</p>
              <p className="text-slate-400 text-xs mt-1">Estado de cuenta al día.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Per-pet breakdown */}
              {ownerPets.map(pet => {
                const petDebts = debtsByPet.get(pet.id) ?? [];
                if (petDebts.length === 0) return null;
                const subtotal = petSubtotal(pet.id);
                const isExpanded = expandedPetId === pet.id;

                return (
                  <div key={pet.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    {/* Pet header */}
                    <div
                      className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50/50"
                      onClick={() => setExpandedPetId(isExpanded ? null : pet.id)}
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <PawPrint size={16} className="text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 font-medium text-sm">{pet.name} <span className="text-slate-400 font-normal">· {pet.species}</span></p>
                        <p className="text-slate-400 text-xs">{petDebts.length} deuda{petDebts.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-slate-800 font-bold text-sm">${subtotal.toFixed(2)}</p>
                        <p className="text-slate-400 text-xs">subtotal</p>
                      </div>
                      {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    </div>

                    {/* Expanded: debts list */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {petDebts.map(d => {
                          const paid = d.payments.reduce((s, p) => s + p.amount, 0);
                          const balance = d.totalAmount - paid;
                          const showAbono = abonoPetId === d.id;

                          return (
                            <div key={d.id} className="p-4 bg-slate-50/30 space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-slate-700 text-sm font-medium">{d.description || 'Deuda sin descripción'}</p>
                                  <p className="text-slate-400 text-xs">{d.date}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-slate-800 font-bold text-sm">${balance.toFixed(2)}</p>
                                  <p className="text-slate-400 text-xs">de ${d.totalAmount.toFixed(2)}</p>
                                </div>
                              </div>

                              {/* Progress */}
                              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${d.totalAmount > 0 ? (paid / d.totalAmount) * 100 : 0}%` }}
                                />
                              </div>

                              {/* Payments */}
                              {d.payments.length > 0 && (
                                <div className="space-y-1">
                                  {d.payments.map(p => (
                                    <div key={p.id} className="flex items-center gap-2 bg-white rounded-md border border-slate-100 px-2.5 py-1.5">
                                      <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                                      <span className="text-slate-500 text-xs flex-1">{p.date}</span>
                                      <span className="text-slate-400 text-xs">{p.method || 'Efectivo'}</span>
                                      <span className="text-green-600 text-xs font-medium">${p.amount.toFixed(2)}</span>
                                      {p.commissionEarned > 0 && (
                                        <span className="text-teal-600 text-xs font-medium" title="Comisión del ayudante generada por este abono">+${p.commissionEarned.toFixed(2)}</span>
                                      )}
                                      <button
                                        onClick={() => deleteDebtPayment(d.id, p.id)}
                                        className="p-0.5 rounded text-slate-300 hover:text-red-500 transition-colors"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Quick abono with payment method (Req 4) */}
                              {showAbono ? (
                                <div className="bg-white rounded-lg border border-green-200 p-2.5 space-y-2">
                                  <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                      <label className="block text-slate-500 text-xs mb-0.5">Monto</label>
                                      <div className="relative">
                                        <DollarSign size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={abonoForm.amount}
                                          onChange={e => setAbonoForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                          placeholder="0.00"
                                          className="w-full pl-6 pr-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="block text-slate-500 text-xs mb-0.5">Fecha</label>
                                      <input
                                        type="date"
                                        value={abonoForm.date}
                                        onChange={e => setAbonoForm(prev => ({ ...prev, date: e.target.value }))}
                                        className="px-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-slate-500 text-xs mb-0.5">Método de Pago</label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {PAYMENT_METHODS.map(m => {
                                        const active = abonoForm.method === m;
                                        const icon = m === 'Efectivo' ? <Banknote size={12} /> : m === 'Yappy' ? <Smartphone size={12} /> : <ArrowLeftRight size={12} />;
                                        return (
                                          <button
                                            key={m}
                                            type="button"
                                            onClick={() => setAbonoForm(prev => ({ ...prev, method: m }))}
                                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                          >
                                            {icon} {m}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleAddAbono(d.id)}
                                      className="flex-1 px-3 py-1.5 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5"
                                    >
                                      <Plus size={14} /> Registrar Abono
                                    </button>
                                    <button
                                      onClick={() => setAbonoPetId(null)}
                                      className="px-2 py-1.5 rounded-md border border-slate-200 text-slate-500 text-sm hover:bg-slate-100 transition-colors"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setAbonoPetId(d.id); setAbonoForm({ amount: 0, date: new Date().toISOString().slice(0, 10), method: 'Efectivo' }); }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors"
                                  >
                                    <Plus size={12} /> Abonar
                                  </button>
                                  <button
                                    onClick={() => openEdit(d)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                                  >
                                    <Pencil size={11} /> Editar
                                  </button>
                                  <button
                                    onClick={() => deleteDebt(d.id)}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={11} /> Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setSelectedOwnerId(null)}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
          >
            <ChevronRight size={14} className="rotate-180" /> Volver al resumen general
          </button>
        </div>
      ) : (
        /* Default: summary of all clients with active debts (Req 3) */
        <div className="space-y-4">
          {allDebtorsSummary.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <Check size={32} className="text-green-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">No hay deudas activas registradas.</p>
              <p className="text-slate-400 text-xs mt-1">Todas las cuentas están al día.</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-5 text-white shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-xs uppercase tracking-wide">Total por Cobrar</p>
                  <p className="text-3xl font-bold">${grandTotalDebts.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-xs uppercase tracking-wide">Clientes con Deuda</p>
                  <p className="text-3xl font-bold">{allDebtorsSummary.length}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Cliente</th>
                      <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Mascotas</th>
                      <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Teléfono</th>
                      <th className="text-right px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Total Adeudado</th>
                      <th className="text-right px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDebtorsSummary.map(({ owner, balance }) => {
                      const oPets = pets.filter(p => p.ownerId === owner.id);
                      return (
                        <tr key={owner.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-800 text-sm font-medium">{owner.name}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{oPets.map(p => p.name).join(', ') || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{owner.phone || '—'}</td>
                          <td className="px-4 py-3 text-right text-red-600 text-sm font-bold">${balance.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setSelectedOwnerId(owner.id);
                                setClientSearch(owner.name);
                                setExpandedPetId(null);
                              }}
                              className="px-3 py-1.5 rounded-md bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
                            >
                              Ver Estado
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-slate-800 font-semibold">{editing ? 'Editar Deuda' : 'Nueva Deuda'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Cliente *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.ownerId ? selectedFormOwner?.name ?? clientSearch : clientSearch}
                    onChange={e => {
                      setClientSearch(e.target.value);
                      setForm(prev => ({ ...prev, ownerId: '', petId: '' }));
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                    placeholder="Buscar por cliente o mascota..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  {showClientDropdown && clientResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
                      {clientResults.map(o => {
                        const oPets = pets.filter(p => p.ownerId === o.id);
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onMouseDown={() => {
                              setForm(prev => ({ ...prev, ownerId: o.id, petId: '' }));
                              setClientSearch(o.name);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              {form.ownerId === o.id && <Check size={14} className="text-red-500 flex-shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-slate-800 text-sm font-medium truncate">{o.name}</p>
                                {oPets.length > 0 && (
                                  <p className="text-slate-400 text-xs truncate">{oPets.map(p => p.name).join(', ')}</p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Mascota *</label>
                <select
                  value={form.petId}
                  onChange={e => setForm(prev => ({ ...prev, petId: e.target.value }))}
                  required
                  disabled={!form.ownerId}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-slate-50"
                >
                  <option value="">Seleccionar mascota...</option>
                  {formOwnerPets.map(p => <option key={p.id} value={p.id}>{p.name} ({p.species})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Descripción</label>
                <input
                  value={form.description}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ej. Cirugía, tratamiento prolongado..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Servicio Realizado *</label>
                <select
                  value={form.serviceType}
                  onChange={e => setForm(prev => ({ ...prev, serviceType: e.target.value as ServiceType }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <p className="text-slate-400 text-xs mt-1">La comisión del ayudante se calcula sobre los abonos, no sobre el total.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Monto Total (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={e => setForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
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
