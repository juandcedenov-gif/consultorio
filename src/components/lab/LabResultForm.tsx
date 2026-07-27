import { useState, useRef } from 'react';
import { X, Download, FlaskConical, ImagePlus, Stamp, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateLabResultPDF, fileToDataUrl } from '../../utils/pdf';
import type { LabTestResult, ServiceType } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

const LAB_TESTS = [
  'HW Ag. (Dirofilaria)',
  'E. Canis Ab. (Ehrlichia canis)',
  'Babesia Ab',
  'Leish Ab. (Leishmaniasis)',
  'Anaplas Ab. (Anaplasmosis)',
  'CPV Ag (Parvovirus)',
  'Distemper Ag (Moquillo)',
  'FIV Ag (Inmunodeficiencia Felina)',
  'FeLV Ac (Leucemia Felina)',
  'CCV Ag (Coronavirus)',
  'Giardia Ag',
  'Coprológico',
];

// Auto-fill details exactly per user spec (Negativo default).
const AUTOCOMPLETE_DETAILS: Record<string, Record<string, string>> = {
  'HW Ag. (Dirofilaria)': {
    Negativo: 'No hay antígeno de gusano adulto en sangre.',
    Positivo: 'Antígeno de gusano adulto detectado en sangre.',
  },
  'E. Canis Ab. (Ehrlichia canis)': {
    Negativo: 'Sin anticuerpos contra Ehrlichia canis.',
    Positivo: 'Anticuerpos contra Ehrlichia canis detectados.',
  },
  'Babesia Ab': {
    Negativo: 'Sin anticuerpos contra babesia.',
    Positivo: 'Anticuerpos contra babesia detectados.',
  },
  'Leish Ab. (Leishmaniasis)': {
    Negativo: 'Sin anticuerpos detectados.',
    Positivo: 'Anticuerpos contra Leishmania detectados.',
  },
  'Anaplas Ab. (Anaplasmosis)': {
    Negativo: 'Sin evidencia de infección.',
    Positivo: 'Evidencia de infección por Anaplasma.',
  },
  'CPV Ag (Parvovirus)': {
    Negativo: 'No se detectó antígenos de parvovirus canino.',
    Positivo: 'Antígenos de parvovirus canino detectados.',
  },
  'Distemper Ag (Moquillo)': {
    Negativo: 'No se detectó antígenos de distemper canino.',
    Positivo: 'Antígenos de distemper canino detectados.',
  },
  'FIV Ag (Inmunodeficiencia Felina)': {
    Negativo: 'Sin anticuerpos detectados.',
    Positivo: 'Anticuerpos del Virus de Inmunodeficiencia Felina detectados.',
  },
  'FeLV Ac (Leucemia Felina)': {
    Negativo: 'Sin anticuerpos detectados.',
    Positivo: 'Anticuerpos contra el Virus de Leucemia Felina detectados.',
  },
  'CCV Ag (Coronavirus)': {
    Negativo: 'No se detecto antígenos de coronavirus canino.',
    Positivo: 'Antígenos de coronavirus canino detectados.',
  },
  'Giardia Ag': {
    Negativo: 'Sin anticuerpos detectados contra la giardia.',
    Positivo: 'Antígeno de Giardia detectado.',
  },
  'Coprológico': {
    Negativo: 'Examen coprológico sin hallazgos parasitarios.',
    Positivo: 'Resultado positivo. Se identificaron parásitos intestinales.',
  },
};

export default function LabResultForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addLabResult, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState<Record<string, { details: string; result: string }>>(
    () => Object.fromEntries(LAB_TESTS.map(t => [t, { details: '', result: '' }]))
  );
  const [observations, setObservations] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureFileName, setSignatureFileName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  if (!pet || !owner) return null;

  function handleResultChange(test: string, value: string) {
    const autoDetail = AUTOCOMPLETE_DETAILS[test]?.[value] ?? '';
    setResults(prev => ({
      ...prev,
      [test]: { ...prev[test], result: value, details: autoDetail || prev[test].details },
    }));
  }

  function handleDetailsChange(test: string, value: string) {
    setResults(prev => ({ ...prev, [test]: { ...prev[test], details: value } }));
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    fileToDataUrl(file).then(setPhotoDataUrl);
  }

  async function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSignatureDataUrl(dataUrl);
    setSignatureFileName(file.name);
  }

  const filledTests: LabTestResult[] = LAB_TESTS
    .filter(t => results[t].result.trim() !== '')
    .map(t => ({ name: t, details: results[t].details, result: results[t].result }));

  const hasResults = filledTests.length > 0;

  async function handleSave(download: boolean) {
    if (!hasResults || !pet || !owner) return;
    setSaving(true);

    const labResult = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      tests: filledTests,
      observations,
      createdAt: new Date().toISOString(),
    };
    addLabResult(labResult);

    // Auto-save to pet history as a service ("Exámenes")
    const testNames = filledTests.map(t => t.name).join(', ');
    addService({
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      types: ['Exámenes'] as ServiceType[],
      vaccines: [],
      description: `Examen de Laboratorio: ${testNames}`,
      observations,
      diagnosis: filledTests.map(t => `${t.name}: ${t.result}`).join('; '),
      treatment: '',
      price: 0,
      paymentMethod: 'Efectivo',
      payments: [],
      vet: 'Dr. Ricardo Cedeño',
      createdAt: new Date().toISOString(),
    });

    if (download) {
      await generateLabResultPDF({
        date,
        petName: pet.name,
        ownerName: owner.name,
        tests: filledTests,
        observations,
        photoDataUrl,
        signatureDataUrl,
      });
    }
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-teal-600" />
            <div>
              <h2 className="text-slate-800 font-semibold">Resultados de Laboratorio</h2>
              <p className="text-slate-400 text-xs">{pet.name} · {owner.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <h3 className="text-slate-700 text-sm font-semibold mb-1">Pruebas Disponibles</h3>
            <p className="text-slate-400 text-xs mb-3">Selecciona el resultado de cada prueba realizada. El detalle se llenará automáticamente y podrás editarlo.</p>
            <div className="space-y-2">
              {LAB_TESTS.map(test => (
                <div key={test} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <div className="col-span-4 text-slate-700 text-xs font-semibold leading-tight">{test}</div>
                  <select
                    value={results[test].result}
                    onChange={e => handleResultChange(test, e.target.value)}
                    className="col-span-3 px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    <option value="">— Resultado</option>
                    <option value="Positivo">Positivo</option>
                    <option value="Negativo">Negativo</option>
                    <option value="Indeterminado">Indeterminado</option>
                    <option value="No realizado">No realizado</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Detalles / Observaciones"
                    value={results[test].details}
                    onChange={e => handleDetailsChange(test, e.target.value)}
                    className="col-span-5 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Evidencia Fotográfica</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
            >
              {photoDataUrl ? (
                <div className="space-y-2">
                  <img src={photoDataUrl} alt="Examen" className="max-h-40 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-slate-400">Clic para cambiar la imagen</p>
                </div>
              ) : (
                <div className="space-y-1 py-4">
                  <ImagePlus size={24} className="mx-auto text-slate-300" />
                  <p className="text-sm text-slate-400">Subir foto del examen</p>
                  <p className="text-xs text-slate-300">JPG, PNG, GIF · Clic para seleccionar</p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Manual signature upload — required for PDF */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Subir Firma y Sello <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => signatureInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
            >
              {signatureDataUrl ? (
                <div className="space-y-2">
                  <img src={signatureDataUrl} alt="Firma y Sello" className="max-h-24 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                    <Stamp size={12} className="text-teal-600" /> {signatureFileName} · Clic para cambiar
                  </p>
                </div>
              ) : (
                <div className="space-y-1 py-4">
                  <Upload size={24} className="mx-auto text-slate-300" />
                  <p className="text-sm text-slate-400">Subir imagen de firma y sello</p>
                  <p className="text-xs text-slate-300">Obligatorio · PNG o JPG</p>
                </div>
              )}
            </div>
            <input
              ref={signatureInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSignatureChange}
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Observaciones Clínicas</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={4}
              placeholder="Interpretación clínica, tratamiento recomendado, notas..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!hasResults || saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-teal-200 text-teal-700 text-sm font-medium hover:bg-teal-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!hasResults || !signatureDataUrl || saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Download size={15} /> {saving ? 'Generando...' : 'Guardar y PDF'}
            </button>
          </div>
          {!signatureDataUrl && (
            <p className="text-amber-600 text-xs text-center">Sube la firma y sello para habilitar la descarga del PDF.</p>
          )}
        </div>
      </div>
    </div>
  );
}
