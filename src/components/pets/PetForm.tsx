import { useState } from 'react';
import { X } from 'lucide-react';
import type { Pet } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  initial?: Pet;
  defaultOwnerId?: string;
  onSave: (p: Pet) => void;
  onClose: () => void;
}

export default function PetForm({ initial, defaultOwnerId, onSave, onClose }: Props) {
  const { owners } = useApp();
  const [form, setForm] = useState<Pet>(
    initial ?? {
      id: crypto.randomUUID(),
      ownerId: defaultOwnerId ?? (owners[0]?.id ?? ''),
      name: '',
      species: 'Perro',
      breed: '',
      gender: 'Macho',
      color: '',
      birthDate: '',
      ageManual: '',
      weight: '',
      createdAt: new Date().toISOString(),
    }
  );

  const set = <K extends keyof Pet>(k: K, v: Pet[K]) => setForm(prev => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerId) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-slate-800 font-semibold">{initial ? 'Editar Mascota' : 'Nueva Mascota'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Owner */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Propietario *</label>
            <select
              value={form.ownerId}
              onChange={e => set('ownerId', e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Seleccionar propietario</option>
              {owners.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Nombre *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Especie</label>
              <select
                value={form.species}
                onChange={e => set('species', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {['Perro', 'Gato', 'Ave', 'Conejo', 'Reptil', 'Otro'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Raza</label>
              <input
                value={form.breed}
                onChange={e => set('breed', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Sexo</label>
              <select
                value={form.gender}
                onChange={e => set('gender', e.target.value as Pet['gender'])}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option>Macho</option>
                <option>Hembra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Color / Pelaje</label>
              <input
                value={form.color}
                onChange={e => set('color', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Peso (kg)</label>
              <input
                value={form.weight}
                onChange={e => set('weight', e.target.value)}
                placeholder="Ej. 5.2"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Birth date / age */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <p className="text-slate-600 text-sm font-medium">Edad / Fecha de Nacimiento</p>
            <div>
              <label className="block text-slate-500 text-xs mb-1">Fecha de nacimiento (si se conoce)</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={e => set('birthDate', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-xs mb-1">O ingrese la edad manualmente (ej. "3 años", "6 meses")</label>
              <input
                value={form.ageManual}
                onChange={e => set('ageManual', e.target.value)}
                placeholder="Ej. 2 años, 8 meses..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
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
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              {initial ? 'Guardar cambios' : 'Registrar mascota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
