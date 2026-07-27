import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Receipt,
  Calendar,
  Menu,
  X,
  Stethoscope,
  Pill,
  ShoppingBag,
  CreditCard,
  CalendarDays,
} from 'lucide-react';

export type ActiveView =
  | 'dashboard'
  | 'clients'
  | 'services'
  | 'billing'
  | 'appointments'
  | 'pharmacy'
  | 'expenses'
  | 'debts'
  | 'weekly';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'appointments', label: 'Citas y Agenda', icon: <Calendar size={20} /> },
  { id: 'clients', label: 'Clientes y Pacientes', icon: <Users size={20} /> },
  { id: 'services', label: 'Historial Clínico', icon: <FileText size={20} /> },
  { id: 'billing', label: 'Facturación', icon: <Receipt size={20} /> },
  { id: 'pharmacy', label: 'Farmacia', icon: <Pill size={20} /> },
  { id: 'weekly', label: 'Registro Semanal', icon: <CalendarDays size={20} /> },
  { id: 'expenses', label: 'Gastos / Salidas', icon: <ShoppingBag size={20} /> },
  { id: 'debts', label: 'Deudas', icon: <CreditCard size={20} /> },
];

interface Props {
  active: ActiveView;
  onNavigate: (v: ActiveView) => void;
  children: React.ReactNode;
}

export default function Layout({ active, onNavigate, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={20} className="text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm leading-none">Consultorio Veterinario</p>
            <p className="text-teal-400 font-semibold text-sm">Dr. Cedeño</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active === item.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-slate-700">
          <p className="text-slate-500 text-xs">v1.0.0 &copy; 2025</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-slate-800 font-semibold text-base leading-none">
              {navItems.find(n => n.id === active)?.label}
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Consultorio Veterinario Dr. Cedeño</p>
          </div>
          <button
            className="ml-auto lg:hidden p-1.5 text-slate-400 hover:text-slate-700"
            onClick={() => setMobileOpen(false)}
          >
            {mobileOpen && <X size={18} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
