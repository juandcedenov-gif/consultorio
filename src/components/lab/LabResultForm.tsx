import { useState, useRef } from 'react';
import { X, Printer, FlaskConical, Plus, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { LabResult, LabTestResult, ServiceRecord } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

const LAB_TESTS = [
  'HW Ag',
  'E. Canis',
  'Leish',
  'FIV',
  'FeLV',
  'Giardia',
  'Anaplas',
  'Parvovirus',
  'Distemper',
  'CCV',
];

const NEGATIVE_AUTOFILL: Record<string, string> = {
  'HW Ag': 'No hay antígeno de gusano adulto en sangre.',
  'E. Canis': 'Sin anticuerpos contra Ehrlichia canis.',
  'Leish': 'Sin anticuerpos detectados.',
  'FIV': 'Sin anticuerpos detectados.',
  'FeLV': 'Sin anticuerpos detectados.',
  'Giardia': 'Sin anticuerpos detectados.',
  'Anaplas': 'Sin evidencia de infección.',
  'Parvovirus': 'No se detectó antígenos.',
  'Distemper': 'No se detectó antígenos.',
  'CCV': 'No se detectó antígenos.',
};

export default function LabResultForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addLabResult, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tests, setTests] = useState<LabTestResult[]>([
    { name: '', result: '', details: '' },
  ]);
  const [observations, setObservations] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  function handleTestChange(idx: number, field: keyof LabTestResult, value: string) {
    setTests(prev => prev.map((t, i) => {
      if (i !== idx) return t;
      const updated = { ...t, [field]: value };
      if (field === 'result' && value === 'Negativo' && updated.name) {
        const auto = NEGATIVE_AUTOFILL[updated.name];
        if (auto) updated.details = auto;
      }
      return updated;
    }));
  }

  function addTestRow() {
    setTests(prev => [...prev, { name: '', result: '', details: '' }]);
  }

  function removeTestRow(idx: number) {
    setTests(prev => prev.filter((_, i) => i !== idx));
  }

  function handleSignatureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setError('La imagen de la firma es demasiado grande. Máximo 2 MB.');
      return;
    }
    setSignatureName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureData(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  }

  function handleGenerate() {
    const validTests = tests.filter(t => t.name.trim());
    if (validTests.length === 0) {
      setError('Agrega al menos un examen.');
      return;
    }
    if (!signatureData) {
      setError('Debes subir la imagen de la firma/sello.');
      return;
    }
    setError('');
    const labResult: LabResult = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      tests: validTests,
      observations,
      signatureData,
      createdAt: new Date().toISOString(),
    };
    addLabResult(labResult);

    const service: ServiceRecord = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      type: 'Exámenes',
      types: ['Exámenes'],
      vaccines: [],
      description: 'Examen de Laboratorio',
      observations: `Laboratorio: ${validTests.map(t => t.name).join(', ')}`,
      diagnosis: '',
      treatment: '',
      price: 0,
      paymentMethod: 'Efectivo',
      payments: [],
      vet: '',
      createdAt: new Date().toISOString(),
    };
    addService(service);

    setShowPreview(true);
  }

  if (!pet || !owner) return null;

  if (showPreview) {
    return (
      <LabResultPreview
        pet={pet}
        owner={owner}
        date={date}
        tests={tests.filter(t => t.name.trim())}
        observations={observations}
        signatureData={signatureData}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 print:bg-white print:p-0 print:block print:items-start print:justify-start">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col print:shadow-none print:rounded-none print:max-h-none print:w-full">
        {/* Header */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-fuchsia-600" />
            <h2 className="text-slate-800 font-semibold">Resultados de Laboratorio</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Patient summary */}
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-lg bg-fuchsia-100 flex items-center justify-center">
              <FlaskConical size={16} className="text-fuchsia-600" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">{pet.name} <span className="text-slate-400 font-normal">· {pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</span></p>
              <p className="text-slate-400 text-xs">Propietario: {owner.name}</p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del examen</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>

          {/* Tests */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-2">Exámenes realizados</label>
            <div className="space-y-2">
              {tests.map((test, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={test.name}
                      onChange={e => handleTestChange(idx, 'name', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                      <option value="">Seleccionar examen...</option>
                      {LAB_TESTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={test.result}
                      onChange={e => handleTestChange(idx, 'result', e.target.value)}
                      className="px-2 py-1.5 rounded-md border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                    >
                      <option value="">Resultado...</option>
                      <option value="Positivo">Positivo</option>
                      <option value="Negativo">Negativo</option>
                    </select>
                    {tests.length > 1 && (
                      <button
                        onClick={() => removeTestRow(idx)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={test.details}
                    onChange={e => handleTestChange(idx, 'details', e.target.value)}
                    placeholder="Detalle / observación del examen..."
                    className="w-full px-2 py-1.5 rounded-md border border-slate-200 text-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addTestRow}
              className="mt-2 flex items-center gap-1.5 text-fuchsia-600 text-sm font-medium hover:underline"
            >
              <Plus size={14} /> Agregar examen
            </button>
          </div>

          {/* General observations */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Observaciones generales</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={3}
              placeholder="Notas adicionales del laboratorio..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 resize-none"
            />
          </div>

          {/* Signature upload */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Firma / Sello del veterinario <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
              >
                <Upload size={15} /> Subir imagen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleSignatureUpload}
                className="hidden"
              />
              {signatureName && (
                <span className="text-slate-500 text-sm">{signatureName}</span>
              )}
              {signatureData && (
                <img src={signatureData} alt="Firma" className="h-12 object-contain rounded border border-slate-200" />
              )}
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="print:hidden flex gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-4 py-2.5 rounded-lg bg-fuchsia-600 text-white text-sm font-medium hover:bg-fuchsia-700 transition-colors"
          >
            Generar Documento
          </button>
        </div>
      </div>
    </div>
  );
}

function LabResultPreview({
  pet,
  owner,
  date,
  tests,
  observations,
  signatureData,
  onClose,
}: {
  pet: NonNullable<ReturnType<typeof useApp>['pets'][0]>;
  owner: NonNullable<ReturnType<typeof useApp>['owners'][0]>;
  date: string;
  tests: LabTestResult[];
  observations: string;
  signatureData: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* On-screen toolbar */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Vista Previa - Resultados de Laboratorio</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 bg-fuchsia-600 rounded-lg text-sm font-medium hover:bg-fuchsia-700 transition-colors"
          >
            <Printer size={15} /> Guardar como PDF / Imprimir
          </button>
          <button onClick={onClose} className="text-slate-300 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="bg-slate-100 min-h-screen pt-16 pb-8 print:pt-0 print:pb-0 print:bg-white print:min-h-0">
        <div
          className="print-document mx-auto bg-white shadow-lg print:shadow-none"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '20mm',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.5',
            color: '#1e293b',
            textAlign: 'left',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Consultorio Veterinario Dr. Cedeño</h1>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Resultados de Exámenes de Laboratorio</p>
          </div>

          {/* Patient info table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', width: '25%', backgroundColor: '#f8fafc' }}>Paciente</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{pet.name}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', width: '25%', backgroundColor: '#f8fafc' }}>Especie / Raza</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Sexo</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{pet.gender}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Propietario</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{owner.name}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Fecha</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{new Date(date + 'T12:00:00').toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Teléfono</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{owner.phone || '—'}</td>
              </tr>
            </tbody>
          </table>

          {/* Tests results */}
          <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>Resultados de Exámenes</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9' }}>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left', fontWeight: 'bold' }}>Examen</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left', fontWeight: 'bold', width: '120px' }}>Resultado</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px 10px', textAlign: 'left', fontWeight: 'bold' }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((t, i) => (
                <tr key={i}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px', fontWeight: 'bold' }}>{t.name}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px' }}>
                    <span style={{
                      fontWeight: 'bold',
                      color: t.result === 'Negativo' ? '#16a34a' : t.result === 'Positivo' ? '#dc2626' : '#475569',
                    }}>
                      {t.result || '—'}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px 10px' }}>{t.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Observations */}
          {observations && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Observaciones Generales</h2>
              <p style={{ fontSize: '13px', textAlign: 'left' }}>{observations}</p>
            </div>
          )}

          {/* Signature */}
          <div style={{ marginTop: '48px', textAlign: 'left' }}>
            <div style={{ display: 'inline-block', textAlign: 'center' }}>
              <img
                src={signatureData}
                alt="Firma del veterinario"
                style={{ height: '80px', maxWidth: '200px', objectFit: 'contain' }}
              />
              <div style={{ borderTop: '1px solid #334155', marginTop: '4px', paddingTop: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                Dr. Cedeño
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Médico Veterinario</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '40px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
            Documento generado el {new Date().toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </>
  );
}
