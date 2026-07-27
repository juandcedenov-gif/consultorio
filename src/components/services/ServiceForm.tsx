import { useState, useRef } from 'react';
import { X, Check, Upload, FileText, Plus, Trash2 } from 'lucide-react';
import type { ServiceRecord, ServiceType, PaymentMethod } from '../../types';
import { VACCINES } from '../../types';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';

interface Props {
  petId: string;
  ownerId: string;
  initial?: ServiceRecord;
  onSave: (s: ServiceRecord) => void;
  onClose: () => void;
}

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

const PAYMENT_METHODS: { value: PaymentMethod; color: string }[] = [
  { value: 'Efectivo', color: 'bg-green-600 border-green-600' },
  { value: 'Yappy', color: 'bg-blue-600 border-blue-600' },
  { value: 'Transferencia', color: 'bg-violet-600 border-violet-600' },
];

export default function ServiceForm({ petId, ownerId, initial, onSave, onClose }: Props) {
  const { pets, owners } = useApp();

  const initialTypes: ServiceType[] = initial?.types && initial.types.length > 0
    ? initial.types
    : initial?.type
      ? [initial.type]
      : ['Consulta'];

  const [form, setForm] = useState<ServiceRecord>(
    initial
      ? { ...initial, types: initialTypes }
      : {
          id: crypto.randomUUID(),
          petId,
          ownerId,
          date: localDateString(),
          types: ['Consulta'],
          vaccines: [],
          description: '',
          observations: '',
          diagnosis: '',
          treatment: '',
          price: 0,
          paymentMethod: 'Efectivo',
          payments: [],
          vet: 'Dr. Cedeño',
          createdAt: new Date().toISOString(),
        }
  );

  const set = <K extends keyof ServiceRecord>(k: K, v: ServiceRecord[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const isVaccination = form.types.includes('Vacunación');
  const isTreatment = form.types.length === 1 && form.types[0] === 'Tratamiento';
  const needsAttachment = form.types.includes('Clínica') || form.types.includes('Exámenes');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [splitMode, setSplitMode] = useState((initial?.payments?.length ?? 0) > 1);
  const splitTotal = form.payments.reduce((a, p) => a + p.amount, 0);
  const splitRemaining = Math.max(0, form.price - splitTotal);

  function addPayment() {
    const usedMethods = form.payments.map(p => p.method);
    const available = PAYMENT_METHODS.find(m => !usedMethods.includes(m.value));
    if (!available) return;
    set('payments', [...form.payments, { method: available.value, amount: 0 }]);
  }

  function updatePayment(index: number, field: 'method' | 'amount', value: PaymentMethod | number) {
    setForm(prev => {
      const payments = prev.payments.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
      return { ...prev, payments };
    });
  }

  function removePayment(index: number) {
    setForm(prev => ({
      ...prev,
      payments: prev.payments.filter((_, i) => i !== index),
    }));
  }

  function toggleSplitMode() {
    if (splitMode) {
      // Switching back to single: set paymentMethod from first split or keep current
      setSplitMode(false);
      set('payments', []);
    } else {
      // Switching to split: initialize with current paymentMethod
      setSplitMode(true);
      set('payments', [{ method: form.paymentMethod, amount: form.price }]);
    }
  }

  function toggleType(type: ServiceType) {
    setForm(prev => {
      const has = prev.types.includes(type);
      const next = has ? prev.types.filter(t => t !== type) : [...prev.types, type];
      const types = next.length === 0 ? [type] : next;
      const vaccines = types.includes('Vacunación') ? prev.vaccines : [];
      return { ...prev, types, vaccines };
    });
  }

  const ACCEPTED_EXTENSIONS = '.pdf,.doc,.docx';
  const ACCEPTED_MIMES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_MIMES.includes(file.type) && !/\.(pdf|doc|docx)$/i.test(file.name)) {
      alert('Solo se permiten archivos PDF o Word (.doc, .docx)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede superar los 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('attachment', { name: file.name, data: reader.result as string, type: file.type });
    };
    reader.readAsDataURL(file);
  }

  function removeAttachment() {
    set('attachment', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function toggleVaccine(vaccine: string) {
    setForm(prev => {
      const vaccines = prev.vaccines.includes(vaccine)
        ? prev.vaccines.filter(v => v !== vaccine)
        : [...prev.vaccines, vaccine];
      return { ...prev, vaccines };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.price < 0) return;
    if (isVaccination && form.vaccines.length === 0) return;
    if (splitMode && Math.abs(splitTotal - form.price) > 0.01) return;
    onSave(form);
  }

  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-slate-800 font-semibold">
              {initial ? 'Editar Servicio' : 'Nuevo Servicio'}
            </h2>
            {pet && (
              <p className="text-slate-400 text-xs mt-0.5">
                {pet.name} · {owner?.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
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
            {/* Vet */}
            <div>
              <label className="block text-slate-600 text-sm font-medium mb-1.5">Veterinario</label>
              <input
                value={form.vet}
                onChange={e => set('vet', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Service types - multi select */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-2">
              Tipo de Servicio * <span className="text-slate-400 font-normal">(selección múltiple)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SERVICE_TYPES.map(type => {
                const selected = form.types.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleType(type)}
                    className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-teal-600 border-teal-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    {selected && <Check size={11} />}
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vaccination section */}
          {isVaccination && (
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-teal-700 text-sm font-semibold">Vacunas Aplicadas *</label>
                <span className="text-xs text-teal-500">
                  {form.vaccines.length} seleccionada{form.vaccines.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {VACCINES.map(vaccine => {
                  const isSelected = form.vaccines.includes(vaccine);
                  return (
                    <label
                      key={vaccine}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-white border-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} className="text-teal-600" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleVaccine(vaccine)}
                        className="sr-only"
                      />
                      <span className="truncate">{vaccine}</span>
                    </label>
                  );
                })}
              </div>
              {form.vaccines.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">Selecciona al menos una vacuna.</p>
              )}
            </div>
          )}

          {/* Observations */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              {isVaccination ? 'Observaciones adicionales' : isTreatment ? 'Detalles del Tratamiento *' : 'Observaciones / Motivo de consulta'}
            </label>
            <textarea
              value={form.observations}
              onChange={e => set('observations', e.target.value)}
              rows={3}
              placeholder={isVaccination ? 'Reacciones, lote de vacuna, información adicional...' : ''}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Extended fields */}
          {!isTreatment && !isVaccination && (
            <>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Descripción / Procedimiento</label>
                <input
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Diagnóstico</label>
                <input
                  value={form.diagnosis}
                  onChange={e => set('diagnosis', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-600 text-sm font-medium mb-1.5">Tratamiento indicado</label>
                <textarea
                  value={form.treatment}
                  onChange={e => set('treatment', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </>
          )}

          {/* File attachment for Clínica / Exámenes */}
          {needsAttachment && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
              <label className="text-indigo-700 text-sm font-semibold mb-2 block">
                Archivo Adjunto (Word o PDF)
              </label>
              {form.attachment ? (
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 text-sm font-medium truncate">{form.attachment.name}</p>
                    <p className="text-slate-400 text-xs">{(form.attachment.data.length / 1024).toFixed(0)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-indigo-200 rounded-lg text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Haz clic para subir un archivo</span>
                  <span className="text-xs text-indigo-400">PDF o Word (.doc, .docx) — máx. 10 MB</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Price + Payment */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-slate-600 text-sm font-semibold">Información de Pago</p>
              <button
                type="button"
                onClick={toggleSplitMode}
                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors ${
                  splitMode
                    ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                {splitMode ? 'Pago simple' : 'Pago dividido'}
              </button>
            </div>

            {!splitMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Precio (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => set('price', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Método de Pago *</label>
                  <div className="flex gap-1.5">
                    {PAYMENT_METHODS.map(({ value: m, color }) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => set('paymentMethod', m)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                          form.paymentMethod === m
                            ? `${color} text-white`
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Total price */}
                <div>
                  <label className="block text-slate-600 text-sm font-medium mb-1.5">Precio Total (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => set('price', parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Split payment rows */}
                {form.payments.map((payment, idx) => {
                  const usedMethods = form.payments.map((p, i) => i !== idx ? p.method : null).filter(Boolean);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={payment.method}
                        onChange={e => updatePayment(idx, 'method', e.target.value as PaymentMethod)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {PAYMENT_METHODS.map(({ value: m }) => (
                          <option key={m} value={m} disabled={usedMethods.includes(m)}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={e => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      {form.payments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePayment(idx)}
                          className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add second method button */}
                {form.payments.length < 3 && (
                  <button
                    type="button"
                    onClick={addPayment}
                    className="flex items-center gap-1.5 text-teal-600 text-sm font-medium hover:underline"
                  >
                    <Plus size={14} /> Añadir método de pago
                  </button>
                )}

                {/* Split summary */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 text-sm">Suma de pagos:</span>
                  <span className={`font-bold text-sm ${Math.abs(splitTotal - form.price) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                    ${splitTotal.toFixed(2)} / ${form.price.toFixed(2)}
                  </span>
                </div>
                {splitRemaining > 0.01 && (
                  <p className="text-xs text-amber-600">Faltan ${splitRemaining.toFixed(2)} por asignar.</p>
                )}
                {splitRemaining < -0.01 && (
                  <p className="text-xs text-red-500">La suma excede el total por ${Math.abs(splitRemaining).toFixed(2)}.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVaccination && form.vaccines.length === 0 || (splitMode && Math.abs(splitTotal - form.price) > 0.01)}
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {initial ? 'Guardar cambios' : 'Registrar servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
