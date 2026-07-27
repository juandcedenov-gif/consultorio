import { useState, useRef } from 'react';
import { X, Download, Award, Stamp, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateHealthCertificatePDF, fileToDataUrl } from '../../utils/pdf';
import type { ServiceType } from '../../types';

interface Props {
  petId: string;
  ownerId: string;
  onClose: () => void;
}

export default function HealthCertificateForm({ petId, ownerId, onClose }: Props) {
  const { pets, owners, addHealthCertificate, addService } = useApp();
  const pet = pets.find(p => p.id === petId);
  const owner = owners.find(o => o.id === ownerId);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [passport, setPassport] = useState('');
  const [address, setAddress] = useState(owner?.address || '');
  const [exportTo, setExportTo] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureFileName, setSignatureFileName] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  if (!pet || !owner) return null;

  async function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setSignatureDataUrl(dataUrl);
    setSignatureFileName(file.name);
  }

  async function handleDownload() {
    if (!pet || !owner || !signatureDataUrl) return;
    setSaving(true);

    addHealthCertificate({
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      passport,
      address,
      exportTo,
      createdAt: new Date().toISOString(),
    });

    // Auto-save to pet history as a service ("Exportación")
    addService({
      id: crypto.randomUUID(),
      petId,
      ownerId,
      date,
      types: ['Exportación'] as ServiceType[],
      vaccines: [],
      description: `Certificado de Buena Salud y Exportación hacia ${exportTo}`,
      observations: `Pasaporte: ${passport}`,
      diagnosis: '',
      treatment: '',
      price: 0,
      paymentMethod: 'Efectivo',
      payments: [],
      vet: 'Dr. Ricardo Cedeño',
      createdAt: new Date().toISOString(),
    });

    await generateHealthCertificatePDF({
      date,
      petName: pet.name,
      breed: pet.breed,
      species: pet.species,
      weight: pet.weight || '',
      color: pet.color || '',
      gender: pet.gender,
      birthDate: pet.birthDate || '',
      ownerName: owner.name,
      ownerPhone: owner.phone,
      passport,
      address,
      exportTo,
      signatureDataUrl,
    });

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-teal-600" />
            <div>
              <h2 className="text-slate-800 font-semibold">Certificado de Buena Salud</h2>
              <p className="text-slate-400 text-xs">{pet.name} · {owner.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Auto-filled preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Datos del Paciente (Autocompletados)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <p><span className="text-slate-400">Nombre:</span> <span className="text-slate-700 font-medium">{pet.name}</span></p>
              <p><span className="text-slate-400">Raza:</span> <span className="text-slate-700 font-medium">{pet.breed || '—'}</span></p>
              <p><span className="text-slate-400">Especie:</span> <span className="text-slate-700 font-medium">{pet.species}</span></p>
              <p><span className="text-slate-400">Peso:</span> <span className="text-slate-700 font-medium">{pet.weight ? `${pet.weight} kg` : '—'}</span></p>
              <p><span className="text-slate-400">Color:</span> <span className="text-slate-700 font-medium">{pet.color || '—'}</span></p>
              <p><span className="text-slate-400">Sexo:</span> <span className="text-slate-700 font-medium">{pet.gender}</span></p>
              <p><span className="text-slate-400">Nacimiento:</span> <span className="text-slate-700 font-medium">{pet.birthDate || '—'}</span></p>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Fecha del Certificado</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Propietario</label>
            <input
              value={owner.name}
              disabled
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Pasaporte / Cédula <span className="text-red-400">*</span></label>
            <input
              value={passport}
              onChange={e => setPassport(e.target.value)}
              placeholder="Número de pasaporte o cédula"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Dirección <span className="text-red-400">*</span></label>
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Dirección del propietario"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1.5">Exportación hacia <span className="text-red-400">*</span></label>
            <input
              value={exportTo}
              onChange={e => setExportTo(e.target.value)}
              placeholder="País o destino de exportación"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-3">
          <button
            onClick={handleDownload}
            disabled={!passport || !address || !exportTo || !signatureDataUrl || saving}
            className="w-full px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={15} /> {saving ? 'Generando...' : 'Guardar y Generar PDF'}
          </button>
          {!signatureDataUrl && (
            <p className="text-amber-600 text-xs text-center">Sube la firma y sello para habilitar la descarga del PDF.</p>
          )}
        </div>
      </div>
    </div>
  );
}
