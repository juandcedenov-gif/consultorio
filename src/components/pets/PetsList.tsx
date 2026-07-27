import { useState } from 'react';
import { Plus, Search, Pencil, Trash2, PawPrint, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Pet } from '../../types';
import PetForm from './PetForm';

interface Props {
  filterOwnerId?: string;
  onSelectPet?: (petId: string) => void;
}

function getAge(pet: Pet): string {
  if (pet.ageManual) return pet.ageManual;
  if (pet.birthDate) {
    const diff = Date.now() - new Date(pet.birthDate).getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    if (years === 0) {
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
      return `${months} mes${months !== 1 ? 'es' : ''}`;
    }
    return `${years} año${years !== 1 ? 's' : ''}`;
  }
  return 'Desconocida';
}

const SPECIES_EMOJI: Record<string, string> = {
  Perro: '🐶',
  Gato: '🐱',
  Ave: '🐦',
  Conejo: '🐰',
  Reptil: '🦎',
  Otro: '🐾',
};

export default function PetsList({ filterOwnerId, onSelectPet }: Props) {
  const { pets, owners, services, addPet, updatePet, deletePet } = useApp();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Pet | null>(null);

  const filtered = pets.filter(p => {
    if (filterOwnerId && p.ownerId !== filterOwnerId) return false;
    const owner = owners.find(o => o.id === p.ownerId);
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.species.toLowerCase().includes(search.toLowerCase()) ||
      p.breed.toLowerCase().includes(search.toLowerCase()) ||
      owner?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  function handleSave(p: Pet) {
    if (editing) {
      updatePet(p);
    } else {
      addPet(p);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    const svcCount = services.filter(s => s.petId === id).length;
    const msg = svcCount > 0
      ? `Esta mascota tiene ${svcCount} servicio(s). ¿Eliminar todo?`
      : '¿Eliminar esta mascota?';
    if (confirm(msg)) deletePet(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mascota, raza, dueño..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Nueva mascota
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <PawPrint size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">{search ? 'Sin resultados.' : 'No hay mascotas registradas aún.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(pet => {
            const owner = owners.find(o => o.id === pet.ownerId);
            const svcCount = services.filter(s => s.petId === pet.id).length;
            return (
              <div key={pet.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {SPECIES_EMOJI[pet.species] ?? '🐾'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-800 font-semibold truncate">{pet.name}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => { setEditing(pet); setFormOpen(true); }}
                          className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(pet.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs">{pet.species} · {pet.breed || 'Sin raza'} · {pet.gender}</p>
                    <p className="text-slate-400 text-xs">Edad: {getAge(pet)}{pet.weight ? ` · ${pet.weight} kg` : ''}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-slate-400 text-xs">
                    {owner?.name ?? 'Sin propietario'} · {svcCount} visita{svcCount !== 1 ? 's' : ''}
                  </div>
                  {onSelectPet && (
                    <button
                      onClick={() => onSelectPet(pet.id)}
                      className="flex items-center gap-1 text-teal-600 text-xs font-medium hover:underline"
                    >
                      <Eye size={12} /> Historial
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <PetForm
          initial={editing ?? undefined}
          defaultOwnerId={filterOwnerId}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
