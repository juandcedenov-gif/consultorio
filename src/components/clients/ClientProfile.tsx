import { useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Owner, Pet } from '../../types';
import OwnerForm from '../owners/OwnerForm';
import PetForm from '../pets/PetForm';
import PetProfile from '../services/PetProfile';

interface Props {
  ownerId: string;
  onBack: () => void;
}

const SPECIES_EMOJI: Record<string, string> = {
  Perro: '🐶',
  Gato: '🐱',
  Ave: '🐦',
  Conejo: '🐰',
  Reptil: '🦎',
  Otro: '🐾',
};

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

export default function ClientProfile({ ownerId, onBack }: Props) {
  const { owners, pets, services, updateOwner, deleteOwner, addPet, updatePet, deletePet } = useApp();

  const [editOwnerOpen, setEditOwnerOpen] = useState(false);
  const [addPetOpen, setAddPetOpen] = useState(false);
  const [editPet, setEditPet] = useState<Pet | null>(null);
  const [viewPetId, setViewPetId] = useState<string | null>(null);

  const owner = owners.find(o => o.id === ownerId);
  const ownerPets = pets.filter(p => p.ownerId === ownerId);

  if (!owner) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-400">Cliente no encontrado.</p>
        <button onClick={onBack} className="text-teal-600 text-sm mt-2 hover:underline">Volver</button>
      </div>
    );
  }

  // If viewing a pet's clinical history
  if (viewPetId) {
    return <PetProfile petId={viewPetId} onBack={() => setViewPetId(null)} />;
  }

  function handleDeleteOwner() {
    const petCount = ownerPets.length;
    const serviceCount = services.filter(s => s.ownerId === ownerId).length;
    const msg = `Este cliente tiene ${petCount} mascota(s) y ${serviceCount} servicio(s) registrados. ¿Eliminar todo?`;
    if (confirm(msg)) {
      deleteOwner(ownerId);
      onBack();
    }
  }

  function handleSavePet(pet: Pet) {
    if (editPet) {
      updatePet(pet);
    } else {
      addPet(pet);
    }
    setAddPetOpen(false);
    setEditPet(null);
  }

  function handleDeletePet(petId: string) {
    const svcCount = services.filter(s => s.petId === petId).length;
    const msg = svcCount > 0
      ? `Esta mascota tiene ${svcCount} servicio(s). ¿Eliminar todo?`
      : '¿Eliminar esta mascota?';
    if (confirm(msg)) deletePet(petId);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Volver a clientes
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setEditOwnerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <Pencil size={14} /> Editar cliente
          </button>
          <button
            onClick={handleDeleteOwner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>

      {/* Client card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Header with name */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
              {owner.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-white font-bold text-xl">{owner.name}</h2>
              <p className="text-teal-100 text-sm">
                {ownerPets.length} mascota{ownerPets.length !== 1 ? 's' : ''} registrada{ownerPets.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-100">
          {owner.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-slate-400" />
              <span className="text-slate-700">{owner.phone}</span>
            </div>
          )}
          {owner.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-400" />
              <span className="text-slate-700">{owner.email}</span>
            </div>
          )}
          {owner.address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={14} className="text-slate-400" />
              <span className="text-slate-700">{owner.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pets section */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-slate-700 font-semibold flex items-center gap-2">
            <PawPrint size={16} className="text-teal-500" />
            Mascotas
          </h3>
          <button
            onClick={() => { setEditPet(null); setAddPetOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus size={14} /> Nueva mascota
          </button>
        </div>

        {ownerPets.length === 0 ? (
          <div className="p-8 text-center">
            <PawPrint size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Este cliente no tiene mascotas registradas.</p>
            <button
              onClick={() => { setEditPet(null); setAddPetOpen(true); }}
              className="mt-3 text-teal-600 text-sm font-medium hover:underline"
            >
              Agregar primera mascota
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {ownerPets.map(pet => {
              const petServices = services.filter(s => s.petId === pet.id);
              const lastService = petServices.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
              )[0];

              return (
                <div key={pet.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                  {/* Pet avatar */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {SPECIES_EMOJI[pet.species] ?? '🐾'}
                  </div>

                  {/* Pet info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-800 font-semibold">{pet.name}</p>
                      <span className="text-slate-400 text-xs">{pet.gender}</span>
                    </div>
                    <p className="text-slate-500 text-sm">
                      {pet.species} {pet.breed ? `· ${pet.breed}` : ''} · Edad: {getAge(pet)}
                      {pet.weight ? ` · ${pet.weight} kg` : ''}
                    </p>
                    {lastService && (
                      <p className="text-slate-400 text-xs mt-1">
                        Última visita: {new Date(lastService.date).toLocaleDateString('es-PA')} ({lastService.type})
                      </p>
                    )}
                  </div>

                  {/* Stats and actions */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-slate-700 font-semibold text-sm">{petServices.length}</p>
                      <p className="text-slate-400 text-xs">visitas</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewPetId(pet.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-teal-50 text-teal-600 text-xs font-medium hover:bg-teal-100 transition-colors"
                      >
                        <Calendar size={12} /> Historial
                      </button>
                      <button
                        onClick={() => { setEditPet(pet); setAddPetOpen(true); }}
                        className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {editOwnerOpen && (
        <OwnerForm
          initial={owner}
          onSave={(o: Owner) => { updateOwner(o); setEditOwnerOpen(false); }}
          onClose={() => setEditOwnerOpen(false)}
        />
      )}

      {addPetOpen && (
        <PetForm
          initial={editPet ?? undefined}
          defaultOwnerId={ownerId}
          onSave={handleSavePet}
          onClose={() => { setAddPetOpen(false); setEditPet(null); }}
        />
      )}
    </div>
  );
}
