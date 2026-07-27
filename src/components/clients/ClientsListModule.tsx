import { useState } from 'react';
import { Plus, Search, Users, Phone, Mail, PawPrint } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Owner } from '../../types';
import OwnerForm from '../owners/OwnerForm';
import ClientProfile from './ClientProfile';

export default function ClientsModule() {
  const { owners, pets, services, addOwner } = useApp();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  // If a client is selected, show their profile
  if (selectedOwnerId) {
    return <ClientProfile ownerId={selectedOwnerId} onBack={() => setSelectedOwnerId(null)} />;
  }

  const q = search.toLowerCase();
  const filtered = owners.filter(o => {
    const ownerMatch =
      o.name.toLowerCase().includes(q) ||
      o.phone.includes(search) ||
      o.email.toLowerCase().includes(q);
    const petMatch = pets.some(p => p.ownerId === o.id && p.name.toLowerCase().includes(q));
    return ownerMatch || petMatch;
  });

  // Sort alphabetically by name (A-Z)
  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );

  function handleAddOwner(owner: Owner) {
    addOwner(owner);
    setFormOpen(false);
    setSelectedOwnerId(owner.id);
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
            placeholder="Buscar por cliente, mascota, teléfono, correo..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Clients list */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Users size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {search ? 'Sin resultados.' : 'No hay clientes registrados aún. Agrega el primero.'}
          </p>
          {!search && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-3 text-teal-600 text-sm font-medium hover:underline"
            >
              Agregar cliente
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(owner => {
            const ownerPets = pets.filter(p => p.ownerId === owner.id);
            const ownerServices = services.filter(s => s.ownerId === owner.id);

            return (
              <button
                key={owner.id}
                onClick={() => setSelectedOwnerId(owner.id)}
                className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-teal-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-lg flex-shrink-0">
                    {owner.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-slate-800 font-semibold truncate">{owner.name}</p>
                      <span className="text-xs text-slate-400 hidden sm:block">
                        {ownerPets.length} mascota{ownerPets.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      {owner.phone && (
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Phone size={12} /> {owner.phone}
                        </span>
                      )}
                      {owner.email && (
                        <span className="text-slate-500 text-sm flex items-center gap-1 truncate">
                          <Mail size={12} /> {owner.email}
                        </span>
                      )}
                    </div>

                    {/* Mini pet badges */}
                    {ownerPets.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ownerPets.slice(0, 3).map(pet => (
                          <span
                            key={pet.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs"
                          >
                            <PawPrint size={10} /> {pet.name}
                          </span>
                        ))}
                        {ownerPets.length > 3 && (
                          <span className="text-slate-400 text-xs">+{ownerPets.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-slate-700 font-semibold text-sm">{ownerServices.length}</p>
                    <p className="text-slate-400 text-xs">visitas</p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex items-center text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {formOpen && (
        <OwnerForm
          existingOwners={owners}
          onSave={handleAddOwner}
          onClose={() => setFormOpen(false)}
        />
      )}
    </div>
  );
}
