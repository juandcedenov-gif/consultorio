import { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Printer,
  PawPrint,
  Banknote,
  Smartphone,
  ArrowLeftRight,
  X,
  CheckSquare,
  Square,
  Check,
  Download,
  Paperclip,
  FlaskConical,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ServiceRecord } from '../../types';
import ServiceForm from './ServiceForm';
import LabResultForm from '../lab/LabResultForm';
import HealthCertificateForm from '../certificates/HealthCertificateForm';

interface Props {
  petId: string;
  onBack: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  Consulta: 'bg-blue-100 text-blue-700',
  Vacunación: 'bg-teal-100 text-teal-700',
  Desparasitación: 'bg-green-100 text-green-700',
  Cirugía: 'bg-red-100 text-red-700',
  'Baño y Corte': 'bg-amber-100 text-amber-700',
  'Baño Medicado': 'bg-orange-100 text-orange-700',
  'Baño Garrapaticida': 'bg-lime-100 text-lime-700',
  'Baño Normal': 'bg-yellow-100 text-yellow-700',
  Tratamiento: 'bg-cyan-100 text-cyan-700',
  'Clínica': 'bg-indigo-100 text-indigo-700',
  'Exámenes': 'bg-fuchsia-100 text-fuchsia-700',
  Otro: 'bg-slate-100 text-slate-600',
};

const TYPE_COLORS_PRINT: Record<string, string> = {
  Consulta: '#3b82f6',
  Vacunación: '#14b8a6',
  Desparasitación: '#22c55e',
  Cirugía: '#ef4444',
  'Baño y Corte': '#f59e0b',
  'Baño Medicado': '#f97316',
  'Baño Garrapaticida': '#84cc16',
  'Baño Normal': '#eab308',
  Tratamiento: '#06b6d4',
  'Clínica': '#6366f1',
  'Exámenes': '#d946ef',
  Otro: '#64748b',
};

function getAge(pet: import('../../types').Pet): string {
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

export default function PetProfile({ petId, onBack }: Props) {
  const { pets, owners, services, addService, updateService, deleteService } = useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRecord | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [labFormOpen, setLabFormOpen] = useState(false);
  const [certFormOpen, setCertFormOpen] = useState(false);

  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === pet?.ownerId);
  const petServices = useMemo(
    () =>
      [...services.filter(s => s.petId === petId)].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [services, petId]
  );

  if (!pet) return <p className="text-slate-400">Mascota no encontrada.</p>;

  function handleSave(s: ServiceRecord) {
    if (editing) {
      updateService(s);
    } else {
      addService(s);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function toggleService(id: string) {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedServices(new Set(petServices.map(s => s.id)));
  }

  function deselectAll() {
    setSelectedServices(new Set());
  }

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setLabFormOpen(true)}
            className="print:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <FlaskConical size={15} /> Laboratorio
          </button>
          <button
            onClick={() => setCertFormOpen(true)}
            className="print:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <Award size={15} /> Cert. Salud
          </button>
          <button
            onClick={() => {
              setSelectedServices(new Set(petServices.map(s => s.id)));
              setPrintModalOpen(true);
            }}
            className="print:hidden flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
            <Printer size={15} /> Imprimir historial
          </button>
          <button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="print:hidden flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus size={15} /> Nuevo servicio
          </button>
        </div>
      </div>

      {/* Pet info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <PawPrint size={24} className="text-teal-600" />
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Info label="Nombre" value={pet.name} />
            <Info label="Especie" value={pet.species} />
            <Info label="Raza" value={pet.breed || '–'} />
            <Info label="Sexo" value={pet.gender} />
            <Info label="Edad" value={getAge(pet)} />
            <Info label="Peso" value={pet.weight ? `${pet.weight} kg` : '–'} />
            <Info label="Color" value={pet.color || '–'} />
            <Info label="Propietario" value={owner?.name ?? '–'} />
          </div>
        </div>
      </div>

      {/* Service history */}
      <div>
        <h3 className="text-slate-700 font-semibold mb-3 flex items-center gap-2">
          Historial de Servicios
          <span className="text-slate-400 font-normal text-sm">({petServices.length} registros)</span>
        </h3>

        {petServices.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-400 text-sm">No hay servicios registrados para esta mascota.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {petServices.map(svc => (
              <ServiceCard
                key={svc.id}
                service={svc}
                onEdit={() => { setEditing(svc); setFormOpen(true); }}
                onDelete={() => {
                  if (confirm('¿Eliminar este servicio?')) deleteService(svc.id);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {formOpen && (
        <ServiceForm
          petId={petId}
          ownerId={pet.ownerId}
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}

      {labFormOpen && (
        <LabResultForm
          petId={petId}
          ownerId={pet.ownerId}
          onClose={() => setLabFormOpen(false)}
        />
      )}

      {certFormOpen && (
        <HealthCertificateForm
          petId={petId}
          ownerId={pet.ownerId}
          onClose={() => setCertFormOpen(false)}
        />
      )}

      {/* Print selection modal */}
      {printModalOpen && (
        <PrintSelectionModal
          pet={pet}
          owner={owner}
          services={petServices}
          selectedServices={selectedServices}
          onToggle={toggleService}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onClose={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-slate-700 text-sm font-medium">{value}</p>
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const types = service.types?.length ? service.types : service.type ? [service.type] : ['Consulta'];
  const isVaccination = types.includes('Vacunación');
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-shadow">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {types.map(t => (
              <span key={t} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-600'}`}>
                {t}
              </span>
            ))}
            <span className="text-slate-500 text-xs">
              {new Date(service.date + 'T12:00:00').toLocaleDateString('es-PA', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </span>
            {service.vet && (
              <span className="text-slate-400 text-xs hidden sm:inline">· {service.vet}</span>
            )}
          </div>
          {service.observations && (
            <p className="text-slate-600 text-sm mt-1 truncate">{service.observations}</p>
          )}
          {service.description && !service.observations && (
            <p className="text-slate-600 text-sm mt-1 truncate">{service.description}</p>
          )}
          {isVaccination && service.vaccines && service.vaccines.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {service.vaccines.map(v => (
                <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-600 text-white text-xs font-medium">
                  {v}
                </span>
              ))}
            </div>
          )}
          {service.attachment && (
            <div className="flex items-center gap-1.5 mt-2">
              <a
                href={service.attachment.data}
                download={service.attachment.name}
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                <Paperclip size={12} />
                {service.attachment.name}
              </a>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-slate-800 font-semibold text-sm">${service.price.toFixed(2)}</span>
          <span className="print:hidden">
            {service.payments && service.payments.length > 1 ? (
              <span className="flex items-center gap-1">
                {service.payments.map((p, idx) => (
                  <span key={idx} title={`${p.method}: ${p.amount.toFixed(2)}`}>
                    {p.method === 'Efectivo'
                      ? <Banknote size={15} className="text-green-500" />
                      : p.method === 'Yappy'
                        ? <Smartphone size={15} className="text-blue-500" />
                        : <ArrowLeftRight size={15} className="text-violet-500" />}
                  </span>
                ))}
              </span>
            ) : service.paymentMethod === 'Efectivo'
              ? <Banknote size={15} className="text-green-500" />
              : service.paymentMethod === 'Yappy'
                ? <Smartphone size={15} className="text-blue-500" />
                : <ArrowLeftRight size={15} className="text-violet-500" />}
          </span>
          <div className="print:hidden flex gap-1">
            <button
              onClick={e => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-md text-slate-400 hover:text-teal-600 hover:bg-teal-50"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-2 text-sm">
          {isVaccination && service.vaccines && service.vaccines.length > 0 && (
            <div>
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Vacunas aplicadas: </span>
              <span className="text-teal-700 font-medium">{service.vaccines.join(', ')}</span>
            </div>
          )}
          {service.observations && (
            <Detail label="Observaciones" value={service.observations} />
          )}
          {service.description && (
            <Detail label="Procedimiento" value={service.description} />
          )}
          {service.diagnosis && (
            <Detail label="Diagnóstico" value={service.diagnosis} />
          )}
          {service.treatment && (
            <Detail label="Tratamiento" value={service.treatment} />
          )}
          {service.payments && service.payments.length > 1 ? (
            <div className="pt-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Pagos divididos: </span>
              <span className="text-slate-700 text-sm font-medium">
                {service.payments.map((p) => `${p.method} ${p.amount.toFixed(2)}`).join(' + ')}
              </span>
            </div>
          ) : (
            <Detail label="Método de pago" value={service.paymentMethod} />
          )}
          {service.attachment && (
            <div className="pt-1">
              <a
                href={service.attachment.data}
                download={service.attachment.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <Download size={14} />
                Descargar: {service.attachment.name}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}: </span>
      <span className="text-slate-700">{value}</span>
    </div>
  );
}

function PrintSelectionModal({
  pet,
  owner,
  services,
  selectedServices,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onClose,
}: {
  pet: NonNullable<ReturnType<typeof useApp>['pets'][0]>;
  owner: ReturnType<typeof useApp>['owners'][0] | undefined;
  services: ServiceRecord[];
  selectedServices: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onClose: () => void;
}) {
  const [showPrintView, setShowPrintView] = useState(false);
  const servicesToPrint = services.filter(s => selectedServices.has(s.id));

  if (showPrintView) {
    return <PrintPreview pet={pet} owner={owner} services={servicesToPrint} onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="text-slate-800 font-semibold">Imprimir Historial Clínico</h2>
            <p className="text-slate-400 text-xs mt-0.5">Selecciona los registros a incluir</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Selection controls */}
        <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <button
            onClick={onSelectAll}
            className="text-teal-600 text-sm font-medium hover:underline flex items-center gap-1"
          >
            <Check size={14} /> Seleccionar todos
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={onDeselectAll}
            className="text-slate-500 text-sm font-medium hover:underline"
          >
            Ninguno
          </button>
          <span className="ml-auto text-sm text-slate-500">
            {selectedServices.size} de {services.length} seleccionados
          </span>
        </div>

        {/* Service list with checkboxes */}
        <div className="flex-1 overflow-y-auto p-4">
          {services.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No hay servicios para imprimir.</p>
          ) : (
            <div className="space-y-2">
              {services.map(svc => {
                const isSelected = selectedServices.has(svc.id);
                const svcTypes = svc.types?.length ? svc.types : svc.type ? [svc.type] : ['Consulta'];

                return (
                  <label
                    key={svc.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="pt-0.5 flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare size={18} className="text-teal-600" />
                      ) : (
                        <Square size={18} className="text-slate-300" />
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(svc.id)}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {svcTypes.map(t => (
                          <span key={t} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[t] ?? 'bg-slate-100 text-slate-600'}`}>
                            {t}
                          </span>
                        ))}
                        <span className="text-slate-500 text-xs">
                          {new Date(svc.date + 'T12:00:00').toLocaleDateString('es-PA', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      {svc.observations && (
                        <p className="text-slate-600 text-sm mt-1">{svc.observations}</p>
                      )}
                      {svcTypes.includes('Vacunación') && svc.vaccines && svc.vaccines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {svc.vaccines.map(v => (
                            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-medium">
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                      {svc.description && !svc.observations && (
                        <p className="text-slate-600 text-sm mt-1">{svc.description}</p>
                      )}
                    </div>
                    <span className="text-slate-700 font-semibold text-sm flex-shrink-0">
                      ${svc.price.toFixed(2)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => setShowPrintView(true)}
            disabled={selectedServices.size === 0}
            className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Printer size={15} />
            Vista previa ({selectedServices.size})
          </button>
        </div>
      </div>
    </div>
  );
}

function PrintPreview({
  pet,
  owner,
  services,
  onClose,
}: {
  pet: NonNullable<ReturnType<typeof useApp>['pets'][0]>;
  owner: ReturnType<typeof useApp>['owners'][0] | undefined;
  services: ServiceRecord[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Actions bar - hidden on print */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h2 className="text-slate-800 font-semibold">Vista Previa - Historial Clínico</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              <Printer size={15} /> Imprimir / PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div className="flex-1 overflow-y-auto p-6 print:p-0" id="clinical-history-print">
          <div className="max-w-lg mx-auto">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
              <h1 className="text-xl font-bold text-slate-900">Consultorio Veterinario Dr. Cedeño</h1>
              <p className="text-sm text-slate-500 mt-1">Historial Clínico del Paciente</p>
            </div>

            {/* Pet info */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400 text-xs">Paciente</span>
                  <p className="font-semibold text-slate-800">{pet.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Especie / Raza</span>
                  <p className="font-semibold text-slate-800">{pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Sexo / Edad</span>
                  <p className="font-semibold text-slate-800">{pet.gender} / {getAge(pet)}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Propietario</span>
                  <p className="font-semibold text-slate-800">{owner?.name ?? '–'}</p>
                </div>
              </div>
            </div>

            {/* Services */}
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              Registros Seleccionados ({services.length})
            </h2>

            {services.map((svc) => {
              const svcTypes = svc.types?.length ? svc.types : svc.type ? [svc.type] : ['Consulta'];
              return (
              <div
                key={svc.id}
                className="mb-4 pb-4 border-b border-slate-200 last:border-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {svcTypes.map(t => (
                      <span
                        key={t}
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (TYPE_COLORS_PRINT[t] ?? '#64748b') + '20',
                          color: TYPE_COLORS_PRINT[t] ?? '#64748b',
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    <span className="text-xs text-slate-500">
                      {new Date(svc.date + 'T12:00:00').toLocaleDateString('es-PA', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </span>
                  </div>
                  {svc.vet && (
                    <span className="text-xs text-slate-400">{svc.vet}</span>
                  )}
                </div>

                {svcTypes.includes('Vacunación') && svc.vaccines && svc.vaccines.length > 0 && (
                  <p className="text-slate-700 text-sm mb-1"><strong>Vacunas aplicadas:</strong> {svc.vaccines.join(', ')}</p>
                )}
                {svc.observations && (
                  <p className="text-slate-700 text-sm mb-1"><strong>Observaciones:</strong> {svc.observations}</p>
                )}
                {svc.description && (
                  <p className="text-slate-700 text-sm mb-1"><strong>Procedimiento:</strong> {svc.description}</p>
                )}
                {svc.diagnosis && (
                  <p className="text-slate-600 text-sm mb-1"><strong>Diagnóstico:</strong> {svc.diagnosis}</p>
                )}
                {svc.treatment && (
                  <p className="text-slate-600 text-sm">{svc.treatment}</p>
                )}
              </div>
              );
            })}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
              Documento generado el{' '}
              {new Date().toLocaleDateString('es-PA', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
