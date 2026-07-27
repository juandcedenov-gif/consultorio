import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, PawPrint, Phone, Mail } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Owner } from '../../types';
import OwnerForm from './OwnerForm';

interface Props {
  onSelectOwner?: (ownerId: string) => void;
}

export default function OwnersList({ onSelectOwner }: Props) {
  const { owners, pets, addOwner, updateOwner, deleteOwner } = useApp();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Owner | null>(null);

  const filtered = owners.filter(
    o =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.email.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  function handleSave(o: Owner) {
    if (editing) {
      updateOwner(o);
    } else {
      addOwner(o);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    const petCount = pets.filter(p => p.ownerId === id).length;
    const msg = petCount > 0
      ? `Este cliente tiene ${petCount} mascota(s). ¿Eliminar todo?`
      : '¿Eliminar este cliente?';
    if (confirm(msg)) deleteOwner(id);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">{search ? 'Sin resultados.' : 'No hay clientes registrados aún.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map(owner => {
            const ownerPets = pets.filter(p => p.ownerId === owner.id);
            return (
              <div key={owner.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 font-semibold truncate">{owner.name}</p>
                    {owner.phone && (
                      <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                        <Phone size={12} /> {owner.phone}
                      </p>
                    )}
                    {owner.email && (
                      <p className="text-slate-500 text-sm flex items-center gap-1.5">
                        <Mail size={12} /> {owner.email}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(owner); setFormOpen(true); }}
                      className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(owner.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                    <PawPrint size={13} />
                    <span>{ownerPets.length} mascota{ownerPets.length !== 1 ? 's' : ''}</span>
                  </div>
                  {onSelectOwner && (
                    <button
                      onClick={() => onSelectOwner(owner.id)}
                      className="text-teal-600 text-xs font-medium hover:underline"
                    >
                      Ver mascotas →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <OwnerForm
          initial={editing ?? undefined}
          existingOwners={owners}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
