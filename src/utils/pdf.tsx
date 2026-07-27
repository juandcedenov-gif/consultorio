import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';

export interface LabTestData {
  name: string;
  details: string;
  result: string;
}

/* ── Print/render helper ──────────────────────────────────── */

function renderToContainer(node: React.ReactNode): { container: HTMLDivElement; root: ReturnType<typeof createRoot> } {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#fff';
  container.style.zIndex = '-1';
  document.body.appendChild(container);
  const root = createRoot(container);
  flushSync(() => root.render(node));
  return { container, root };
}

function cleanupContainer(container: HTMLDivElement, root: ReturnType<typeof createRoot>) {
  root.unmount();
  if (document.body.contains(container)) {
    document.body.removeChild(container);
  }
}

async function waitForPaint(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }));
  await new Promise<void>((resolve) => setTimeout(resolve, 500));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function downloadWithHtml2Pdf(container: HTMLElement, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default;
  const options = {
    margin: 0,
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };
  await html2pdf().set(options).from(container).save();
}

/* ── Shared document building blocks ─────────────────────── */

function DocHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="doc-header">
      <div className="doc-clinic-name">Consultorio Veterinario Dr. Cedeño</div>
      {subtitle ? (
        <>
          <div className="doc-sub">{subtitle}</div>
          <div className="doc-sub">La Locería, Calle 22A, Norte &nbsp;|&nbsp; Teléfono: 236-9453 &nbsp;|&nbsp; Celular: 6719-9283</div>
          <div className="doc-sub">Horario: Lunes a Viernes: 8:00 a.m. - 7:00 p.m. &nbsp;|&nbsp; Sábado: 8:00 a.m. - 3:30 p.m.</div>
        </>
      ) : (
        <>
          <div className="doc-sub">Doctor Ricardo Cedeño &nbsp;|&nbsp; Idoneidad # 454</div>
          <div className="doc-sub">Dir. La Locería, Calle 22A Norte, Casa 96 A &nbsp;|&nbsp; Tel. 236-9453 / 6719-9283</div>
        </>
      )}
      <div className="doc-title">{title}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="doc-section-title">{children}</div>;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="doc-data-row">
      <span className="doc-label">{label}:</span>
      <span className="doc-value">{value || '—'}</span>
    </div>
  );
}

function ResultBadge({ result }: { result: string }) {
  if (!result) return null;
  const isPos = result.toLowerCase().includes('positivo') || result.toLowerCase() === '+';
  const isNeg = result.toLowerCase().includes('negativo') || result.toLowerCase() === '-';
  const cls = isPos ? 'badge-pos' : isNeg ? 'badge-neg' : 'badge-neutral';
  return <span className={`doc-badge ${cls}`}>{result}</span>;
}

function SignatureBlock({ signatureDataUrl }: { signatureDataUrl: string | null }) {
  if (signatureDataUrl) {
    return (
      <div className="doc-signature">
        <img src={signatureDataUrl} className="doc-signature-img" alt="Firma y Sello" />
        <div className="doc-signature-name">Dr. Ricardo Cedeño</div>
        <div className="doc-signature-role">Médico Veterinario &nbsp;|&nbsp; Idoneidad # 454</div>
        <div className="doc-signature-role">Consultorio Veterinario Dr. Cedeño</div>
      </div>
    );
  }
  return (
    <div className="doc-signature">
      <div className="doc-signature-line" />
      <div className="doc-signature-name">Dr. Ricardo Cedeño</div>
      <div className="doc-signature-role">Médico Veterinario &nbsp;|&nbsp; Idoneidad # 454</div>
      <div className="doc-signature-role">Consultorio Veterinario Dr. Cedeño</div>
    </div>
  );
}

/* ── Lab Result document ─────────────────────────────────── */

export function LabResultDocument({
  date,
  petName,
  ownerName,
  tests,
  observations,
  photoDataUrl,
  signatureDataUrl,
}: {
  date: string;
  petName: string;
  ownerName: string;
  tests: LabTestData[];
  observations: string;
  photoDataUrl: string | null;
  signatureDataUrl: string | null;
}) {
  const filledTests = tests.filter((t) => t.result.trim() !== '');

  return (
    <div className="doc-page">
      <DocHeader title="REPORTE DE RESULTADOS DE LABORATORIO" subtitle="R.U.C. 6-67-83 D.V.63" />

      <SectionTitle>Información del Paciente</SectionTitle>
      <div className="doc-data-grid">
        <DataRow label="Fecha" value={date} />
        <DataRow label="Paciente" value={petName} />
        <DataRow label="Propietario" value={ownerName} />
      </div>

      <hr className="doc-hr" />

      <SectionTitle>Pruebas Realizadas</SectionTitle>
      {filledTests.length > 0 ? (
        <table className="doc-table">
          <thead>
            <tr>
              <th className="doc-th" style={{ width: '35%' }}>Prueba / Parámetro</th>
              <th className="doc-th" style={{ width: '45%' }}>Detalles / Observaciones</th>
              <th className="doc-th" style={{ width: '20%', textAlign: 'center' }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {filledTests.map((t, i) => (
              <tr key={t.name} style={{ background: i % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
                <td className="doc-td" style={{ fontWeight: 600 }}>{t.name}</td>
                <td className="doc-td" style={{ color: '#334155' }}>{t.details || '—'}</td>
                <td className="doc-td" style={{ textAlign: 'center' }}>
                  <ResultBadge result={t.result} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ fontSize: 10, color: '#94a3b8' }}>No se registraron pruebas con resultados.</p>
      )}

      {photoDataUrl && (
        <>
          <SectionTitle>Evidencia Fotográfica del Examen</SectionTitle>
          <div className="doc-photo">
            <img src={photoDataUrl} alt="Examen" />
          </div>
        </>
      )}

      <SectionTitle>Observaciones Clínicas</SectionTitle>
      <div className="doc-obs">{observations || '—'}</div>

      <hr className="doc-hr" />

      <SignatureBlock signatureDataUrl={signatureDataUrl} />
    </div>
  );
}

/* ── Health Certificate document ─────────────────────────── */

export function HealthCertificateDocument({
  date,
  petName,
  breed,
  species,
  weight,
  color,
  gender,
  birthDate,
  ownerName,
  ownerPhone,
  passport,
  address,
  exportTo,
  signatureDataUrl,
}: {
  date: string;
  petName: string;
  breed: string;
  species: string;
  weight: string;
  color: string;
  gender: string;
  birthDate: string;
  ownerName: string;
  ownerPhone: string;
  passport: string;
  address: string;
  exportTo: string;
  signatureDataUrl: string | null;
}) {
  const dateObj = date ? new Date(date + 'T12:00:00') : new Date();
  const day = dateObj.getDate();
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return (
    <div className="doc-page">
      <DocHeader title="CERTIFICADO DE BUENA SALUD Y EXPORTACIÓN" />

      <SectionTitle>I. Datos del Paciente</SectionTitle>
      <div className="doc-data-grid" style={{ gap: '2px 24px' }}>
        <DataRow label="Nombre" value={petName} />
        <DataRow label="Raza" value={breed} />
        <DataRow label="Especie" value={species} />
        <DataRow label="Peso" value={weight ? `${weight} kg` : ''} />
        <DataRow label="Color" value={color} />
        <DataRow label="Sexo" value={gender} />
        <DataRow label="Fecha de Nacimiento" value={birthDate} />
      </div>

      <hr className="doc-hr" />

      <SectionTitle>II. Declaración Médica Veterinaria</SectionTitle>
      <div className="doc-obs">
        <p style={{ margin: '0 0 8px' }}>
          El médico veterinario que suscribe este documento, certifica que el animal descrito anteriormente fue examinado físicamente y se encuentra libre de evidencia de enfermedades infectocontagiosas, incluyendo lesiones de piel, diarrea, emaciación y síntomas que involucren el sistema nervioso.
        </p>
        <p style={{ margin: '0 0 8px' }}>Certifico además que el paciente cumple con los siguientes requisitos sanitarios:</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li style={{ marginBottom: 4 }}>Cuenta con la vacuna <strong>Antirrábica</strong> vigente.</li>
          <li style={{ marginBottom: 4 }}>Se encuentra debidamente desparasitado (interna y externamente).</li>
          <li>Está libre de miasis o presencia del Gusano Barrenador (<em>Cochliomyia hominivorax</em>).</li>
        </ul>
      </div>

      <hr className="doc-hr" />

      <SectionTitle>III. Datos del Propietario y Exportación</SectionTitle>
      <div className="doc-data-grid" style={{ gap: '2px 24px' }}>
        <DataRow label="Propietario" value={ownerName} />
        <DataRow label="Pasaporte / Cédula" value={passport} />
        <DataRow label="Teléfono" value={ownerPhone} />
        <DataRow label="Dirección" value={address} />
        <DataRow label="Exportación hacia" value={exportTo} />
      </div>

      <hr className="doc-hr" />

      <SectionTitle>IV. Expedición</SectionTitle>
      <div className="doc-obs">
        <p style={{ margin: '0 0 8px' }}>La presente certificación se expide a solicitud de la parte interesada.</p>
        <p style={{ margin: 0 }}>
          Dado en la Ciudad de Panamá, a los <strong>{day}</strong> días del mes de <strong>{month}</strong> del año <strong>{year}</strong>.
        </p>
      </div>

      <SignatureBlock signatureDataUrl={signatureDataUrl} />
    </div>
  );
}

/* ── Public download helpers ──────────────────────────────── */

export async function generateLabResultPDF(data: {
  date: string;
  petName: string;
  ownerName: string;
  tests: LabTestData[];
  observations: string;
  photoDataUrl: string | null;
  signatureDataUrl: string | null;
}): Promise<void> {
  const { container, root } = renderToContainer(
    <LabResultDocument
      date={data.date}
      petName={data.petName}
      ownerName={data.ownerName}
      tests={data.tests}
      observations={data.observations}
      photoDataUrl={data.photoDataUrl}
      signatureDataUrl={data.signatureDataUrl}
    />
  );
  try {
    await waitForPaint(container);
    await downloadWithHtml2Pdf(container, `Laboratorio_${data.petName}_${data.date}.pdf`);
  } finally {
    cleanupContainer(container, root);
  }
}

export async function generateHealthCertificatePDF(data: {
  date: string;
  petName: string;
  breed: string;
  species: string;
  weight: string;
  color: string;
  gender: string;
  birthDate: string;
  ownerName: string;
  ownerPhone: string;
  passport: string;
  address: string;
  exportTo: string;
  signatureDataUrl: string | null;
}): Promise<void> {
  const { container, root } = renderToContainer(
    <HealthCertificateDocument
      date={data.date}
      petName={data.petName}
      breed={data.breed}
      species={data.species}
      weight={data.weight}
      color={data.color}
      gender={data.gender}
      birthDate={data.birthDate}
      ownerName={data.ownerName}
      ownerPhone={data.ownerPhone}
      passport={data.passport}
      address={data.address}
      exportTo={data.exportTo}
      signatureDataUrl={data.signatureDataUrl}
    />
  );
  try {
    await waitForPaint(container);
    await downloadWithHtml2Pdf(container, `Certificado_${data.petName}_${data.date}.pdf`);
  } finally {
    cleanupContainer(container, root);
  }
}

/** Reads a File and returns a Base64 data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
