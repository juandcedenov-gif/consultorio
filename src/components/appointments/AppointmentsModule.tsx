import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Calendar as CalendarIcon,
  Clock,
  User,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { localDateString } from '../../context/AppContext';
import type { Appointment, AppointmentStatus } from '../../types';
import AppointmentForm from './AppointmentForm';

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; icon: React.ReactNode; bg: string }> = {
  Pendiente: { color: 'text-amber-600', icon: <AlertCircle size={12} />, bg: 'bg-amber-50' },
  Completada: { color: 'text-green-600', icon: <CheckCircle size={12} />, bg: 'bg-green-50' },
  Cancelada: { color: 'text-red-500', icon: <XCircle size={12} />, bg: 'bg-red-50' },
};

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AppointmentsModule() {
  const { owners, pets, appointments, addAppointment, updateAppointment, deleteAppointment, getTodayAppointments, getUpcomingAppointments } = useApp();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments(5);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        if (!search) return true;
        const owner = owners.find(o => o.id === a.ownerId);
        const pet = pets.find(p => p.id === a.petId);
        const searchLower = search.toLowerCase();
        return (
          owner?.name.toLowerCase().includes(searchLower) ||
          pet?.name.toLowerCase().includes(searchLower) ||
          a.reason.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return a.time.localeCompare(b.time);
      });
  }, [appointments, search, owners, pets]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: { date: Date; isCurrentMonth: boolean; appointments: Appointment[] }[] = [];

    // Previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dateStr = localDateString(d);
      const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'Cancelada');
      days.push({ date: d, isCurrentMonth: false, appointments: dayAppts });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = localDateString(d);
      const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'Cancelada');
      days.push({ date: d, isCurrentMonth: true, appointments: dayAppts });
    }

    // Next month days to fill the grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = localDateString(d);
      const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'Cancelada');
      days.push({ date: d, isCurrentMonth: false, appointments: dayAppts });
    }

    return days;
  }, [viewDate, appointments]);

  const today = localDateString(new Date());

  function handleSave(a: Appointment) {
    if (editing) {
      updateAppointment(a);
    } else {
      addAppointment(a);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function handleDelete(id: string) {
    if (confirm('¿Eliminar esta cita?')) deleteAppointment(id);
  }

  function navigateMonth(direction: number) {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  }

  const selectedDateAppointments = selectedDate
    ? appointments
        .filter(a => a.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time))
    : [];

  const showSearchResults = search.trim().length > 0;

  return (
    <div className="space-y-5">
      {/* Top search + action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente o mascota..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors whitespace-nowrap"
        >
          <Plus size={16} /> Nueva Cita
        </button>
      </div>

      {/* Search results panel */}
      {showSearchResults && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 font-semibold text-sm mb-3 flex items-center gap-2">
            <Search size={14} className="text-teal-500" />
            Resultados para "{search}"
            <span className="text-slate-400 font-normal text-xs">({filteredAppointments.length} citas)</span>
          </h3>
          {filteredAppointments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No se encontraron citas.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredAppointments.map(apt => (
                <DetailCard
                  key={apt.id}
                  appointment={apt}
                  showDate
                  onEdit={() => { setEditing(apt); setFormOpen(true); }}
                  onDelete={() => handleDelete(apt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick view: Today's and Upcoming */}
      {!showSearchResults && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's appointments */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                <CalendarIcon size={16} className="text-teal-500" />
                Citas de Hoy
              </h3>
              <span className="text-xs text-slate-400">
                {new Date().toLocaleDateString('es-PA', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            {todayAppointments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay citas programadas para hoy.</p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map(apt => (
                  <MiniCard key={apt.id} appointment={apt} onEdit={() => { setEditing(apt); setFormOpen(true); }} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                <Clock size={16} className="text-blue-500" />
                Próximas Citas
              </h3>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay citas próximas.</p>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map(apt => (
                  <MiniCard key={apt.id} appointment={apt} showDate onEdit={() => { setEditing(apt); setFormOpen(true); }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendar and list view */}
      {!showSearchResults && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-slate-800 font-semibold">
              {MONTHS_ES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_ES.map(d => (
              <div key={d} className="text-center text-slate-400 text-xs font-medium py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dateStr = localDateString(day.date);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[60px] p-1 rounded-lg text-left transition-all ${
                    !day.isCurrentMonth
                      ? 'text-slate-300'
                      : isSelected
                        ? 'bg-teal-100 border-2 border-teal-500'
                        : isToday
                          ? 'bg-blue-50'
                          : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    {day.date.getDate()}
                  </span>
                  {day.appointments.length > 0 && (
                    <div className="mt-1">
                      {day.appointments.slice(0, 2).map(apt => (
                        <div
                          key={apt.id}
                          className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            apt.status === 'Completada'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.time.slice(0, 5)}
                        </div>
                      ))}
                      {day.appointments.length > 2 && (
                        <div className="text-[10px] text-slate-400 px-1">+{day.appointments.length - 2}</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day details or full list */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-slate-700 font-semibold text-sm mb-4">
            {selectedDate
              ? `Citas del ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}`
              : search
                ? 'Resultados de búsqueda'
                : 'Selecciona un día'}
          </h3>

          {selectedDate ? (
            selectedDateAppointments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">No hay citas para este día.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateAppointments.map(apt => (
                  <DetailCard
                    key={apt.id}
                    appointment={apt}
                    onEdit={() => { setEditing(apt); setFormOpen(true); }}
                    onDelete={() => handleDelete(apt.id)}
                  />
                ))}
              </div>
            )
          ) : search ? (
            filteredAppointments.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-6">Sin resultados.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredAppointments.map(apt => (
                  <DetailCard
                    key={apt.id}
                    appointment={apt}
                    onEdit={() => { setEditing(apt); setFormOpen(true); }}
                    onDelete={() => handleDelete(apt.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <p className="text-slate-400 text-sm text-center py-6">Haz clic en un día del calendario.</p>
          )}
        </div>
      </div>
      )}

      {formOpen && (
        <AppointmentForm
          initial={editing ?? undefined}
          defaultOwnerId={editing?.ownerId}
          defaultPetId={editing?.petId}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function MiniCard({
  appointment,
  showDate,
  onEdit,
}: {
  appointment: Appointment;
  showDate?: boolean;
  onEdit: () => void;
}) {
  const { owners, pets } = useApp();
  const owner = owners.find(o => o.id === appointment.ownerId);
  const pet = pets.find(p => p.id === appointment.petId);
  const status = STATUS_CONFIG[appointment.status];

  return (
    <button
      onClick={onEdit}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1`}>
            {status.icon}
            {appointment.time.slice(0, 5)}
          </span>
          {showDate && (
            <span className="text-slate-400 text-xs">
              {new Date(appointment.date + 'T12:00:00').toLocaleDateString('es-PA', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <p className="text-slate-700 text-sm font-medium mt-1 truncate">{appointment.reason}</p>
        <p className="text-slate-500 text-xs truncate">
          {pet?.name} · {owner?.name}
        </p>
      </div>
      <Pencil size={13} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
    </button>
  );
}

function DetailCard({
  appointment,
  onEdit,
  onDelete,
  showDate,
}: {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  showDate?: boolean;
}) {
  const { owners, pets } = useApp();
  const owner = owners.find(o => o.id === appointment.ownerId);
  const pet = pets.find(p => p.id === appointment.petId);
  const status = STATUS_CONFIG[appointment.status];

  return (
    <div className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors group">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.bg} ${status.color} flex items-center gap-1`}>
            {status.icon}
            {appointment.time.slice(0, 5)}
          </span>
          {showDate && (
            <span className="text-slate-400 text-xs">
              {new Date(appointment.date + 'T12:00:00').toLocaleDateString('es-PA', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          <span className={`text-xs font-medium ${status.color}`}>{appointment.status}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <p className="text-slate-700 text-sm font-semibold mt-2">{appointment.reason}</p>
      <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
        <span className="flex items-center gap-1"><User size={11} /> {owner?.name}</span>
        <span className="flex items-center gap-1"><PawPrint size={11} /> {pet?.name}</span>
      </div>
      {appointment.notes && (
        <p className="text-slate-400 text-xs mt-2 truncate">{appointment.notes}</p>
      )}
    </div>
  );
}
