import { useState, useRef } from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import type { PharmacyItem } from '../../types';

interface Props {
  initial?: PharmacyItem;
  onSave: (item: PharmacyItem) => void;
  onClose: () => void;
}

const CATEGORIES: PharmacyItem['category'][] = ['Medicamento', 'Accesorio', 'Alimento', 'Otro'];

export default function PharmacyItemForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<PharmacyItem>(
    initial ?? {
      id: crypto.randomUUID(),
      name: '',
      salePrice: 0,
      stock: 0,
      category: 'Medicamento',
      createdAt: new Date().toISOString(),
    }
  );

  const imageInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PharmacyItem>(k: K, v: PharmacyItem[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar los 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('imageUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    set('imageUrl', undefined);
    if (imageInputRef.current) imageInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave(form);
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-slate-800 font-semibold">
            {initial ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Image upload */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Foto del Producto</label>
            {form.imageUrl ? (
              <div className="relative inline-block">
                <img
                  src={form.imageUrl}
                  alt={form.name}
                  className="w-full h-40 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 hover:border-teal-400 hover:bg-teal-50/50 transition-all"
              >
                <ImageIcon size={28} />
                <span className="text-sm font-medium">Subir foto del producto</span>
                <span className="text-xs text-slate-400">PNG, JPG — máx. 5 MB</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Nombre del Producto *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              placeholder="Ej. Amoxicilina 250mg, Collar antipulgas..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Categoría</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => set('category', cat)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.category === cat
                      ? 'bg-teal-600 border-teal-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-teal-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Precio de Venta (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.salePrice}
                onChange={e => set('salePrice', parseFloat(e.target.value) || 0)}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Stock Actual *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={e => set('stock', parseInt(e.target.value) || 0)}
                required
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
              {initial ? 'Guardar cambios' : 'Registrar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
