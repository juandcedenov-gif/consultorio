import { useState, useRef, useEffect } from 'react';
import { X, Search, ChevronDown } from 'lucide-react';
import type { Appointment, AppointmentStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';

interface Props {
  initial?: Appointment;
  defaultOwnerId?: string;
  defaultPetId?: string;
  onSave: (a: Appointment) => void;
  onClose: () => void;
}

export default function AppointmentForm({ initial, defaultOwnerId, defaultPetId, onSave, onClose }: Props) {
  const { owners, pets } = useApp();
  const [form, setForm] = useState<Appointment>(
    initial ?? {
      id: crypto.randomUUID(),
      ownerId: defaultOwnerId ?? '',
      petId: defaultPetId ?? '',
      date: localDateString(),
      time: '09:00',
      reason: '',
      status: 'Pendiente',
      notes: '',
      createdAt: new Date().toISOString(),
    }
  );

  const set = <K extends keyof Appointment>(k: K, v: Appointment[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  // Searchable owner+pet selector state
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOwner = owners.find(o => o.id === form.ownerId);
  const selectedPet = pets.find(p => p.id === form.petId);

  // Build combined search results: each entry is { ownerId, ownerName, petId, petName, petSpecies }
  const searchResults = (() => {
    const q = searchQuery.toLowerCase().trim();
    const results: { ownerId: string; ownerName: string; petId: string; petName: string; petSpecies: string }[] = [];
    for (const owner of owners) {
      const ownerPets = pets.filter(p => p.ownerId === owner.id);
      if (ownerPets.length === 0) {
        if (!q || owner.name.toLowerCase().includes(q)) {
          results.push({ ownerId: owner.id, ownerName: owner.name, petId: '', petName: '', petSpecies: '' });
        }
      } else {
        for (const pet of ownerPets) {
          const matches = !q ||
            owner.name.toLowerCase().includes(q) ||
            pet.name.toLowerCase().includes(q);
          if (matches) {
            results.push({ ownerId: owner.id, ownerName: owner.name, petId: pet.id, petName: pet.name, petSpecies: pet.species });
          }
        }
      }
    }
    return results.slice(0, 50);
  })();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectResult(ownerId: string, petId: string) {
    set('ownerId', ownerId);
    set('petId', petId);
    setSearchQuery('');
    setShowDropdown(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.ownerId || !form.petId || !form.date || !form.time) return;
    onSave(form);
  }

  const selectedOwnerPets = pets.filter(p => p.ownerId === form.ownerId);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-slate-800 font-semibold">
            {initial ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Searchable client + pet selector */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Buscar Cliente / Mascota *</label>
            {selectedOwner && selectedPet ? (
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-teal-300 bg-teal-50">
                <div className="min-w-0">
                  <p className="text-slate-800 text-sm font-medium truncate">{selectedOwner.name}</p>
                  <p className="text-slate-500 text-xs truncate">{selectedPet.name} ({selectedPet.species})</p>
                </div>
                <button
                  type="button"
                  onClick={() => { set('ownerId', ''); set('petId', ''); setShowDropdown(true); }}
                  className="text-slate-400 hover:text-red-500 flex-shrink-0 ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Escribe el nombre del cliente o mascota..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}

            {showDropdown && !selectedOwner && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-64 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-3 text-slate-400 text-sm text-center">
                    {owners.length === 0 ? 'No hay clientes registrados.' : 'Sin resultados.'}
                  </p>
                ) : (
                  searchResults.map(r => (
                    <button
                      key={`${r.ownerId}-${r.petId}`}
                      type="button"
                      onClick={() => selectResult(r.ownerId, r.petId)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-teal-50 transition-colors text-left border-b border-slate-50 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-500 text-xs font-bold">
                        {r.ownerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-slate-800 text-sm font-medium truncate">{r.ownerName}</p>
                        {r.petName && (
                          <p className="text-slate-400 text-xs truncate">{r.petName} ({r.petSpecies})</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Pet selector (only if owner has multiple pets) */}
          {selectedOwner && selectedOwnerPets.length > 1 && (
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Mascota *</label>
              <select
                value={form.petId}
                onChange={e => set('petId', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {selectedOwnerPets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                ))}
              </select>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Hora *</label>
              <input
                type="time"
                value={form.time}
                onChange={e => set('time', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Motivo de la visita *</label>
            <input
              value={form.reason}
              onChange={e => set('reason', e.target.value)}
              required
              placeholder="Ej. Vacunación, Consulta general, Control..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Estado</label>
            <div className="flex gap-2">
              {(['Pendiente', 'Completada', 'Cancelada'] as AppointmentStatus[]).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.status === s
                      ? s === 'Pendiente'
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : s === 'Completada'
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-red-500 border-red-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Notas adicionales</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Observaciones, recordatorios..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!form.ownerId || !form.petId}
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initial ? 'Guardar cambios' : 'Programar cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
