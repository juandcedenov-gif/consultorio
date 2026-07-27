import { useMemo } from 'react';
import { CalendarDays, User, PawPrint, Wallet, TrendingUp, Scissors, Banknote } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ServiceRecord, Debt, DebtPayment } from '../../types';

interface AbonoRow {
  kind: 'abono';
  id: string;
  date: string;
  ownerId: string;
  petId: string;
  serviceType: string;
  amount: number;
  method: string;
  debt: Debt;
  payment: DebtPayment;
}

interface ServiceRow {
  kind: 'service';
  id: string;
  date: string;
  ownerId: string;
  petId: string;
  types: string[];
  price: number;
  service: ServiceRecord;
}

type WeekRow = AbonoRow | ServiceRow;

export default function WeeklyRecordModule() {
  const { getCurrentWeekServices, getWeekAbonosForDate, getHelperWeeklyPay, owners, pets } = useApp();
  const weekServices = getCurrentWeekServices();
  const weekAbonos = getWeekAbonosForDate(new Date());
  const helperPay = getHelperWeeklyPay();

  const weekRange = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }),
      end: sunday.toLocaleDateString('es-PA', { day: 'numeric', month: 'short' }),
    };
  }, []);

  // Merge services and abonos into a single sorted list
  const mergedRows = useMemo<WeekRow[]>(() => {
    const serviceRows: ServiceRow[] = weekServices.map(s => ({
      kind: 'service' as const,
      id: s.id,
      date: s.date,
      ownerId: s.ownerId,
      petId: s.petId,
      types: s.types?.length ? s.types : ['Consulta'],
      price: s.price,
      service: s,
    }));
    const abonoRows: AbonoRow[] = weekAbonos.map(({ debt, payment }: { debt: Debt; payment: DebtPayment }) => ({
      kind: 'abono' as const,
      id: payment.id,
      date: payment.date,
      ownerId: debt.ownerId,
      petId: debt.petId,
      serviceType: debt.serviceType ?? 'Otro',
      amount: payment.amount,
      method: payment.method ?? 'Efectivo',
      debt,
      payment,
    }));
    return [...serviceRows, ...abonoRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [weekServices, weekAbonos]);

  const totalServicios = weekServices.reduce((a, s) => a + s.price, 0);
  const totalAbonos = weekAbonos.reduce((a: number, { payment }: { debt: Debt; payment: DebtPayment }) => a + payment.amount, 0);
  const totalSemana = totalServicios + totalAbonos;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
          <CalendarDays size={20} className="text-teal-600" />
        </div>
        <div>
          <h2 className="text-slate-800 font-semibold text-lg">Registro Semanal</h2>
          <p className="text-slate-400 text-xs">Semana del {weekRange.start} al {weekRange.end}</p>
        </div>
      </div>

      {/* Helper Pay Summary */}
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} className="text-teal-600" />
          <h3 className="text-slate-800 font-semibold text-sm">Pago del Ayudante</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-0.5">Salario Base</p>
            <p className="text-lg font-bold text-slate-700">${helperPay.base.toFixed(2)}</p>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-slate-400 text-xs mb-0.5">Comisiones</p>
            <p className="text-lg font-bold text-teal-600">${helperPay.commissions.toFixed(2)}</p>
          </div>
          <div className="bg-teal-600 rounded-lg p-3">
            <p className="text-teal-100 text-xs mb-0.5">Pago Total</p>
            <p className="text-lg font-bold text-white">${helperPay.total.toFixed(2)}</p>
          </div>
        </div>
        <p className="text-slate-400 text-xs mt-3 flex items-center gap-1.5">
          <Scissors size={12} />
          20% en la mayoría de los servicios · $5 fijo en "Baño y Corte" · 0% en "Exportación"
        </p>
      </div>

      {/* Commission breakdown — services + abonos */}
      {(helperPay.breakdown.length > 0 || helperPay.debtCommissions.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-500" />
            <h3 className="text-slate-700 font-medium text-sm">Desglose de Comisiones</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {helperPay.breakdown.map(({ service, commission }) => {
              const owner = owners.find(o => o.id === service.ownerId);
              const pet = pets.find(p => p.id === service.petId);
              const types = service.types?.length ? service.types : ['Consulta'];
              return (
                <div key={service.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm truncate">{owner?.name ?? '—'} · {pet?.name ?? '—'}</p>
                    <p className="text-slate-400 text-xs">{types.join(', ')} · {service.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-500 text-xs">${service.price.toFixed(2)}</p>
                    <p className="text-teal-600 text-sm font-semibold">+${commission.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
            {helperPay.debtCommissions.map(({ debt, payment, commission }: { debt: Debt; payment: DebtPayment; commission: number }) => {
              const owner = owners.find(o => o.id === debt.ownerId);
              const pet = pets.find(p => p.id === debt.petId);
              return (
                <div key={payment.id} className="flex items-center gap-3 px-4 py-2.5 bg-amber-50/40">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm truncate">
                      {owner?.name ?? '—'} · {pet?.name ?? '—'}
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase">Abono</span>
                    </p>
                    <p className="text-slate-400 text-xs">{debt.serviceType ?? 'Otro'} · {payment.date} · {payment.method ?? 'Efectivo'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-slate-500 text-xs">${payment.amount.toFixed(2)}</p>
                    <p className="text-teal-600 text-sm font-semibold">+${commission.toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed weekly table — services + abonos merged */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-slate-700 font-medium text-sm">Historial Detallado de la Semana</h3>
        </div>
        {mergedRows.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays size={28} className="text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No hay movimientos registrados esta semana.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><User size={12} /> Cliente</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                    <span className="flex items-center gap-1.5"><PawPrint size={12} /> Mascota</span>
                  </th>
                  <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Servicio</th>
                  <th className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Fecha</th>
                  <th className="text-right px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">Monto</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.map(row => {
                  const owner = owners.find(o => o.id === row.ownerId);
                  const pet = pets.find(p => p.id === row.petId);
                  if (row.kind === 'service') {
                    return (
                      <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-700 text-sm">{owner?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600 text-sm">{pet?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {row.types.map(t => (
                              <span key={t} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-sm">{row.date}</td>
                        <td className="px-4 py-3 text-right text-slate-800 text-sm font-semibold">${row.price.toFixed(2)}</td>
                      </tr>
                    );
                  }
                  // abono row
                  return (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0 hover:bg-amber-50/40 bg-amber-50/20">
                      <td className="px-4 py-3 text-slate-700 text-sm">{owner?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{pet?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">{row.serviceType}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1">
                            <Banknote size={10} /> Abono
                          </span>
                          <span className="text-slate-400 text-xs">{row.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-sm">{row.date}</td>
                      <td className="px-4 py-3 text-right text-amber-700 text-sm font-semibold">${row.amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide text-right">
                    Servicios: ${totalServicios.toFixed(2)} · Abonos: ${totalAbonos.toFixed(2)} · Total:
                  </td>
                  <td className="px-4 py-3 text-right text-slate-800 text-base font-bold">${totalSemana.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
