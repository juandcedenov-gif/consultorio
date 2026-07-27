import { useState } from 'react';
import { Search, PawPrint, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PetProfile from './PetProfile';

export default function ServicesList() {
  const { pets, owners } = useApp();
  const [search, setSearch] = useState('');
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  if (selectedPetId) {
    return <PetProfile petId={selectedPetId} onBack={() => setSelectedPetId(null)} />;
  }

  const filtered = pets.filter(p => {
    const owner = owners.find(o => o.id === p.ownerId);
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      owner?.name.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-slate-500 text-sm bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <PawPrint size={15} className="text-blue-500 flex-shrink-0" />
        <span>Selecciona una mascota para ver y gestionar su historial clínico.</span>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar mascota o dueño..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <PawPrint size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? 'Sin resultados.' : 'No hay mascotas registradas. Primero añade una mascota.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(pet => {
            const owner = owners.find(o => o.id === pet.ownerId);
            return (
              <button
                key={pet.id}
                onClick={() => setSelectedPetId(pet.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
                    <PawPrint size={18} className="text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-semibold truncate">{pet.name}</p>
                    <p className="text-slate-400 text-xs">{pet.species} · {owner?.name ?? '–'}</p>
                  </div>
                  <Eye size={15} className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
