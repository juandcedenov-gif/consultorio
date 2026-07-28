import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Owner, Pet, ServiceRecord, Invoice, WeeklySnapshot, Appointment, PharmacyItem, PharmacySale, Expense, Debt, DebtPayment, ServiceType, LabResult, HealthCertificate } from '../types';
import { HELPER_BASE_WEEKLY, HELPER_COMMISSION_RATE, HELPER_BATH_CORTE_FIXED, HELPER_EXPORTACION_COMMISSION } from '../types';

interface AppContextValue {
  owners: Owner[];
  pets: Pet[];
  services: ServiceRecord[];
  invoices: Invoice[];
  weeklySnapshots: WeeklySnapshot[];
  appointments: Appointment[];
  pharmacyItems: PharmacyItem[];
  pharmacySales: PharmacySale[];
  expenses: Expense[];
  debts: Debt[];
  labResults: LabResult[];
  healthCertificates: HealthCertificate[];

  addOwner: (owner: Owner) => void;
  updateOwner: (owner: Owner) => void;
  deleteOwner: (id: string) => void;

  addPet: (pet: Pet) => void;
  updatePet: (pet: Pet) => void;
  deletePet: (id: string) => void;

  addService: (service: ServiceRecord) => void;
  updateService: (service: ServiceRecord) => void;
  deleteService: (id: string) => void;

  addInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  nextInvoiceNumber: () => string;

  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  deleteAppointment: (id: string) => void;
  getTodayAppointments: () => Appointment[];
  getUpcomingAppointments: (limit?: number) => Appointment[];

  addPharmacyItem: (item: PharmacyItem) => void;
  updatePharmacyItem: (item: PharmacyItem) => void;
  deletePharmacyItem: (id: string) => void;
  addPharmacySale: (sale: PharmacySale) => void;
  deletePharmacySale: (id: string) => void;

  addExpense: (e: Expense) => void;
  updateExpense: (e: Expense) => void;
  deleteExpense: (id: string) => void;

  addDebt: (d: Debt) => void;
  updateDebt: (d: Debt) => void;
  deleteDebt: (id: string) => void;
  addDebtPayment: (debtId: string, payment: DebtPayment) => void;
  deleteDebtPayment: (debtId: string, paymentId: string) => void;

  addLabResult: (r: LabResult) => void;
  deleteLabResult: (id: string) => void;
  addHealthCertificate: (c: HealthCertificate) => void;
  deleteHealthCertificate: (id: string) => void;

  getCurrentWeekServices: () => ServiceRecord[];
  getWeekServicesForDate: (date: Date) => ServiceRecord[];
  getWeekAbonosForDate: (date: Date) => { debt: Debt; payment: DebtPayment }[];
  getWeeklyTotals: (weekDate?: Date) => { cash: number; yappy: number; transfer: number; total: number; count: number };
  getExpensesForWeek: (weekDate: Date) => Expense[];
  getServiceCommission: (s: ServiceRecord) => number;
  getHelperWeeklyPay: () => { base: number; commissions: number; total: number; breakdown: { service: ServiceRecord; commission: number }[]; debtCommissions: { debt: Debt; payment: DebtPayment; commission: number }[] };
  getAbanoCommissionAtPayment: (serviceType: ServiceType, abonoAmount: number, debtTotal: number, totalPaidBefore: number) => number;}

const AppContext = createContext<AppContextValue | null>(null);

function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 5);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Migrate legacy `type` field to `types[]` and ensure `payments` exists */
function migrateServices(raw: ServiceRecord[]): ServiceRecord[] {
  return raw.map(s => {
    const types: ServiceType[] = (!s.types || s.types.length === 0)
      ? (s.type ? [s.type] : ['Consulta'])
      : (s.types as ServiceType[]);
    return { ...s, types, payments: s.payments ?? [] };
  });
}

/** Returns 'YYYY-MM-DD' in local timezone to avoid UTC offset bugs */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [owners, setOwners] = useState<Owner[]>(() => load('vc_owners', []));
  const [pets, setPets] = useState<Pet[]>(() => load('vc_pets', []));
  const [services, setServices] = useState<ServiceRecord[]>(() =>
    migrateServices(load('vc_services', []))
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() => load('vc_invoices', []));
  const [weeklySnapshots, _setWeeklySnapshots] = useState<WeeklySnapshot[]>(() =>
    load('vc_weekly_snapshots', [])
  );
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    load('vc_appointments', [])
  );
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItem[]>(() =>
    load('vc_pharmacy_items', [])
  );
  const [pharmacySales, setPharmacySales] = useState<PharmacySale[]>(() =>
    load('vc_pharmacy_sales', [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => load('vc_expenses', []));
  const [debts, setDebts] = useState<Debt[]>(() => load('vc_debts', []));
  const [labResults, setLabResults] = useState<LabResult[]>(() => load('vc_lab_results', []));
  const [healthCertificates, setHealthCertificates] = useState<HealthCertificate[]>(() => load('vc_health_certs', []));

  useEffect(() => { save('vc_owners', owners); }, [owners]);
  useEffect(() => { save('vc_pets', pets); }, [pets]);
  useEffect(() => { save('vc_services', services); }, [services]);
  useEffect(() => { save('vc_invoices', invoices); }, [invoices]);
  useEffect(() => { save('vc_weekly_snapshots', weeklySnapshots); }, [weeklySnapshots]);
  useEffect(() => { save('vc_appointments', appointments); }, [appointments]);
  useEffect(() => { save('vc_pharmacy_items', pharmacyItems); }, [pharmacyItems]);
  useEffect(() => { save('vc_pharmacy_sales', pharmacySales); }, [pharmacySales]);
  useEffect(() => { save('vc_expenses', expenses); }, [expenses]);
  useEffect(() => { save('vc_debts', debts); }, [debts]);
  useEffect(() => { save('vc_lab_results', labResults); }, [labResults]);
  useEffect(() => { save('vc_health_certs', healthCertificates); }, [healthCertificates]);

  const addOwner = useCallback((o: Owner) => setOwners(prev => [...prev, o]), []);
  const updateOwner = useCallback((o: Owner) => setOwners(prev => prev.map(x => x.id === o.id ? o : x)), []);
  const deleteOwner = useCallback((id: string) => {
    setOwners(prev => prev.filter(x => x.id !== id));
    setPets(prev => prev.filter(x => x.ownerId !== id));
    setAppointments(prev => prev.filter(x => x.ownerId !== id));
    setLabResults(prev => prev.filter(x => x.ownerId !== id));
    setHealthCertificates(prev => prev.filter(x => x.ownerId !== id));
  }, []);

  const addPet = useCallback((p: Pet) => setPets(prev => [...prev, p]), []);
  const updatePet = useCallback((p: Pet) => setPets(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const deletePet = useCallback((id: string) => {
    setPets(prev => prev.filter(x => x.id !== id));
    setServices(prev => prev.filter(x => x.petId !== id));
    setAppointments(prev => prev.filter(x => x.petId !== id));
    setLabResults(prev => prev.filter(x => x.petId !== id));
    setHealthCertificates(prev => prev.filter(x => x.petId !== id));
  }, []);

  const addService = useCallback((s: ServiceRecord) => setServices(prev => [...prev, s]), []);
  const updateService = useCallback((s: ServiceRecord) => setServices(prev => prev.map(x => x.id === s.id ? s : x)), []);
  const deleteService = useCallback((id: string) => setServices(prev => prev.filter(x => x.id !== id)), []);

  const nextInvoiceNumber = useCallback((): string => {
    const existing = invoices.map(inv => {
      const match = inv.invoiceNumber.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNum = existing.length > 0 ? Math.max(...existing) : 0;
    const next = Math.min(maxNum + 1, 1500);
    return `#${String(next).padStart(4, '0')}`;
  }, [invoices]);

  const addInvoice = useCallback((inv: Invoice) => setInvoices(prev => [...prev, inv]), []);
  const deleteInvoice = useCallback((id: string) => setInvoices(prev => prev.filter(x => x.id !== id)), []);

  const addAppointment = useCallback((a: Appointment) => setAppointments(prev => [...prev, a]), []);
  const updateAppointment = useCallback((a: Appointment) =>
    setAppointments(prev => prev.map(x => x.id === a.id ? a : x)), []);
  const deleteAppointment = useCallback((id: string) =>
    setAppointments(prev => prev.filter(x => x.id !== id)), []);

  const getTodayAppointments = useCallback((): Appointment[] => {
    const today = localDateString(new Date());
    return appointments
      .filter(a => a.date === today && a.status !== 'Cancelada')
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

  const getUpcomingAppointments = useCallback((limit = 10): Appointment[] => {
    const today = localDateString(new Date());
    return appointments
      .filter(a => a.date >= today && a.status !== 'Cancelada')
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return a.time.localeCompare(b.time);
      })
      .slice(0, limit);
  }, [appointments]);

  const addPharmacyItem = useCallback((item: PharmacyItem) =>
    setPharmacyItems(prev => [...prev, item]), []);
  const updatePharmacyItem = useCallback((item: PharmacyItem) =>
    setPharmacyItems(prev => prev.map(x => x.id === item.id ? item : x)), []);
  const deletePharmacyItem = useCallback((id: string) =>
    setPharmacyItems(prev => prev.filter(x => x.id !== id)), []);

  const addPharmacySale = useCallback((sale: PharmacySale) => {
    setPharmacySales(prev => [...prev, sale]);
    setPharmacyItems(prev =>
      prev.map(item =>
        item.id === sale.itemId
          ? { ...item, stock: Math.max(0, item.stock - sale.quantity) }
          : item
      )
    );
  }, []);
  const deletePharmacySale = useCallback((id: string) =>
    setPharmacySales(prev => prev.filter(x => x.id !== id)), []);

  const addExpense = useCallback((e: Expense) => setExpenses(prev => [...prev, e]), []);
  const updateExpense = useCallback((e: Expense) => setExpenses(prev => prev.map(x => x.id === e.id ? e : x)), []);
  const deleteExpense = useCallback((id: string) => setExpenses(prev => prev.filter(x => x.id !== id)), []);

  const addDebt = useCallback((d: Debt) => setDebts(prev => [...prev, d]), []);
  const updateDebt = useCallback((d: Debt) => setDebts(prev => prev.map(x => x.id === d.id ? d : x)), []);
  const deleteDebt = useCallback((id: string) => setDebts(prev => prev.filter(x => x.id !== id)), []);
  const getAbanoCommissionAtPayment = useCallback((serviceType: ServiceType, abonoAmount: number, debtTotal: number, totalPaidBefore: number): number => {
    if (serviceType === 'Exportación') return 0;
    if (serviceType === 'Baño y Corte') {
      const cumulative = totalPaidBefore + abonoAmount;
      if (cumulative >= debtTotal && totalPaidBefore < debtTotal) {
        return HELPER_BATH_CORTE_FIXED;
      }
      return 0;
    }
    return abonoAmount * HELPER_COMMISSION_RATE;
  }, []);

  const addDebtPayment = useCallback((debtId: string, payment: DebtPayment) =>
    setDebts(prev => prev.map(d => {
      if (d.id !== debtId) return d;
      const totalPaidBefore = d.payments.reduce((s, p) => s + p.amount, 0);
      const commissionEarned = getAbanoCommissionAtPayment(d.serviceType, payment.amount, d.totalAmount, totalPaidBefore);
      return { ...d, payments: [...d.payments, { ...payment, commissionEarned }] };
    })), [getAbanoCommissionAtPayment]);
  const deleteDebtPayment = useCallback((debtId: string, paymentId: string) =>
    setDebts(prev => prev.map(d => d.id === debtId ? { ...d, payments: d.payments.filter(p => p.id !== paymentId) } : d)), []);

  const addLabResult = useCallback((r: LabResult) => setLabResults(prev => [...prev, r]), []);
  const deleteLabResult = useCallback((id: string) => setLabResults(prev => prev.filter(x => x.id !== id)), []);
  const addHealthCertificate = useCallback((c: HealthCertificate) => setHealthCertificates(prev => [...prev, c]), []);
  const deleteHealthCertificate = useCallback((id: string) => setHealthCertificates(prev => prev.filter(x => x.id !== id)), []);

  const getWeekServicesForDate = useCallback((date: Date): ServiceRecord[] => {
    const { start, end } = getWeekBounds(date);
    return services.filter(s => {
      const d = new Date(s.date + 'T12:00:00');
      return d >= start && d <= end;
    });
  }, [services]);

  const getExpensesForWeek = useCallback((date: Date): Expense[] => {
    const { start, end } = getWeekBounds(date);
    return expenses.filter(e => {
      const d = new Date(e.date + 'T12:00:00');
      return d >= start && d <= end;
    });
  }, [expenses]);

  const getCurrentWeekServices = useCallback((): ServiceRecord[] => {
    return getWeekServicesForDate(new Date());
  }, [getWeekServicesForDate]);

  const getWeekAbonosForDate = useCallback((date: Date): { debt: Debt; payment: DebtPayment }[] => {
    const { start, end } = getWeekBounds(date);
    const weekStartStr = localDateString(start);
    const weekEndStr = localDateString(end);
    const result: { debt: Debt; payment: DebtPayment }[] = [];
    for (const d of debts) {
      for (const p of d.payments) {
        if (p.date >= weekStartStr && p.date <= weekEndStr) {
          result.push({ debt: d, payment: p });
        }
      }
    }
    return result;
  }, [debts]);

  const getServiceCommission = useCallback((s: ServiceRecord): number => {
    const types = s.types?.length ? s.types : s.type ? [s.type as ServiceType] : ['Consulta'];
    if (types.includes('Exportación')) return HELPER_EXPORTACION_COMMISSION;
    if (types.includes('Baño y Corte')) return HELPER_BATH_CORTE_FIXED;
    return s.price * HELPER_COMMISSION_RATE;
  }, []);

  const getHelperWeeklyPay = useCallback(() => {
    const weekServices = getCurrentWeekServices();
    const breakdown = weekServices.map(s => ({ service: s, commission: getServiceCommission(s) }));
    const serviceCommissions = breakdown.reduce((a, b) => a + b.commission, 0);

    const debtCommissions: { debt: Debt; payment: DebtPayment; commission: number }[] = [];
    const { start: weekStart, end: weekEnd } = getWeekBounds(new Date());
    const weekStartStr = localDateString(weekStart);
    const weekEndStr = localDateString(weekEnd);

    debts.forEach(d => {
      let cumulativePaid = 0;
      const sortedPayments = [...d.payments].sort((a, b) => a.date.localeCompare(b.date));
      for (const p of sortedPayments) {
        if (p.date >= weekStartStr && p.date <= weekEndStr) {
          const commission = getAbanoCommissionAtPayment(d.serviceType, p.amount, d.totalAmount, cumulativePaid);
          if (commission > 0) {
            debtCommissions.push({ debt: d, payment: p, commission });
          }
        }
        cumulativePaid += p.amount;
      }
    });

    const debtCommissionsTotal = debtCommissions.reduce((a, dc) => a + dc.commission, 0);
    const commissions = serviceCommissions + debtCommissionsTotal;
    return {
      base: HELPER_BASE_WEEKLY,
      commissions,
      total: HELPER_BASE_WEEKLY + commissions,
      breakdown,
      debtCommissions,
    };
  }, [getCurrentWeekServices, getServiceCommission, getAbanoCommissionAtPayment, debts]);

  const getWeeklyTotals = useCallback((weekDate?: Date) => {
    const date = weekDate ?? new Date();
    const current = getWeekServicesForDate(date);
    let cash = 0, yappy = 0, transfer = 0;
    for (const s of current) {
      if (s.payments && s.payments.length > 0) {
        for (const p of s.payments) {
          if (p.method === 'Efectivo') cash += p.amount;
          else if (p.method === 'Yappy') yappy += p.amount;
          else if (p.method === 'Transferencia') transfer += p.amount;
        }
      } else {
        if (s.paymentMethod === 'Efectivo') cash += s.price;
        else if (s.paymentMethod === 'Yappy') yappy += s.price;
        else if (s.paymentMethod === 'Transferencia') transfer += s.price;
      }
    }
    // Include debt abonos made this week, broken down by payment method
    const { start: weekStart, end: weekEnd } = getWeekBounds(date);
    const weekStartStr = localDateString(weekStart);
    const weekEndStr = localDateString(weekEnd);
    for (const d of debts) {
      for (const p of d.payments) {
        if (p.date >= weekStartStr && p.date <= weekEndStr) {
          if (p.method === 'Efectivo') cash += p.amount;
          else if (p.method === 'Yappy') yappy += p.amount;
          else if (p.method === 'Transferencia') transfer += p.amount;
        }
      }
    }
    return { cash, yappy, transfer, total: cash + yappy + transfer, count: current.length };
  }, [getWeekServicesForDate, debts]);

  const value: AppContextValue = {
    owners, pets, services, invoices, weeklySnapshots, appointments,
    pharmacyItems, pharmacySales, expenses, debts, labResults, healthCertificates,
    addOwner, updateOwner, deleteOwner,
    addPet, updatePet, deletePet,
    addService, updateService, deleteService,
    addInvoice, deleteInvoice, nextInvoiceNumber,
    addAppointment, updateAppointment, deleteAppointment,
    getTodayAppointments, getUpcomingAppointments,
    addPharmacyItem, updatePharmacyItem, deletePharmacyItem,
    addPharmacySale, deletePharmacySale,
    addExpense, updateExpense, deleteExpense,
    addDebt, updateDebt, deleteDebt, addDebtPayment, deleteDebtPayment,
    addLabResult, deleteLabResult, addHealthCertificate, deleteHealthCertificate,
    getCurrentWeekServices, getWeekServicesForDate, getWeekAbonosForDate, getWeeklyTotals, getExpensesForWeek, getServiceCommission, getAbanoCommissionAtPayment, getHelperWeeklyPay,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
