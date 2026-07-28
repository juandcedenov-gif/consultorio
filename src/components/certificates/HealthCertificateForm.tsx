import { useState, useRef } from 'react';
import { X, Printer, Award, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { HealthCertificate, ServiceRecord } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

export default function HealthCertificateForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addHealthCertificate, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [healthStatus, setHealthStatus] = useState('Saludable');
  const [observations, setObservations] = useState('');
  const [signatureData, setSignatureData] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

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
    if (!passport.trim()) {
      setError('El número de pasaporte es obligatorio.');
      return;
    }
    if (!signatureData) {
      setError('Debes subir la imagen de la firma/sello.');
      return;
    }
    setError('');
    const cert: HealthCertificate = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      passport,
      address,
      exportTo,
      healthStatus,
      observations,
      signatureData,
      createdAt: new Date().toISOString(),
    };
    addHealthCertificate(cert);

    const service: ServiceRecord = {
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      type: 'Exportación',
      types: ['Exportación'],
      vaccines: [],
      description: 'Certificado de Salud',
      observations: `Certificado de Salud - Pasaporte: ${passport}`,
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
      <HealthCertPreview
        pet={pet}
        owner={owner}
        date={date}
        passport={passport}
        address={address}
        exportTo={exportTo}
        healthStatus={healthStatus}
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
            <Award size={20} className="text-amber-600" />
            <h2 className="text-slate-800 font-semibold">Certificado de Salud</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Patient summary */}
          <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 text-sm">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
              <Award size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-slate-800 font-medium">{pet.name} <span className="text-slate-400 font-normal">· {pet.species} {pet.breed ? `/ ${pet.breed}` : ''}</span></p>
              <p className="text-slate-400 text-xs">Propietario: {owner.name}</p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del certificado</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Passport */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">
              Número de Pasaporte <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={passport}
              onChange={e => setPassport(e.target.value)}
              placeholder="Ej. 12345-ABC"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Dirección del Propietario</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Dirección completa..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Export destination */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Destino de Exportación</label>
            <input
              type="text"
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              placeholder="País o región de destino..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Health status */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Estado de Salud</label>
            <select
              value={healthStatus}
              onChange={e => setHealthStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="Saludable">Saludable</option>
              <option value="En tratamiento">En tratamiento</option>
              <option value="Recuperado">Recuperado</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Observaciones</label>
            <textarea
              value={observations}
              onChange={e => setObservations(e.target.value)}
              rows={3}
              placeholder="Observaciones del certificado..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Generar Documento
          </button>
        </div>
      </div>
    </div>
  );
}

function HealthCertPreview({
  pet,
  owner,
  date,
  passport,
  address,
  exportTo,
  healthStatus,
  observations,
  signatureData,
  onClose,
}: {
  pet: NonNullable<ReturnType<typeof useApp>['pets'][0]>;
  owner: NonNullable<ReturnType<typeof useApp>['owners'][0]>;
  date: string;
  passport: string;
  address: string;
  exportTo: string;
  healthStatus: string;
  observations: string;
  signatureData: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* On-screen toolbar */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">Vista Previa - Certificado de Salud</span>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
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
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Certificado de Salud Animal</p>
          </div>

          {/* Title bar */}
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px 16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', margin: 0 }}>
              <strong>Certificado No:</strong> {passport}
            </p>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
              <strong>Fecha de emisión:</strong> {new Date(date + 'T12:00:00').toLocaleDateString('es-PA', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
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
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Color</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{pet.color || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Propietario</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{owner.name}</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Teléfono</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }}>{owner.phone || '—'}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Dirección</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }} colSpan={3}>{address || '—'}</td>
              </tr>
              {exportTo && (
                <tr>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Destino</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '6px 10px' }} colSpan={3}>{exportTo}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Health declaration */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px' }}>Estado de Salud</h2>
            <p style={{ fontSize: '13px', textAlign: 'left' }}>
              Por medio del presente certificado, se hace constar que el animal identificado arriba
              ha sido examinado clínicamente y se encuentra en estado: <strong>{healthStatus}</strong>.
            </p>
          </div>

          {/* Observations */}
          {observations && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '8px' }}>Observaciones</h2>
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
