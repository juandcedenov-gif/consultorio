export type PaymentMethod = 'Efectivo' | 'Yappy' | 'Transferencia';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
}

export type ServiceType =
  | 'Consulta'
  | 'Vacunación'
  | 'Desparasitación'
  | 'Cirugía'
  | 'Baño y Corte'
  | 'Baño Medicado'
  | 'Baño Garrapaticida'
  | 'Baño Normal'
  | 'Tratamiento'
  | 'Clínica'
  | 'Exámenes'
  | 'Exportación'
  | 'Corte de Uña'
  | 'Otro';

export type AppointmentStatus = 'Pendiente' | 'Completada' | 'Cancelada';

// Available vaccines - easy to extend by adding more options
export const VACCINES: string[] = [
  'Parvovirus',
  'Parvovirus/Distemper',
  'Rabia',
  'Múltiple',
  'Quíntuple',
  'Séxtuple',
  'Leptospira',
  'Bordetella',
  'Influenza Canina',
];

export interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string;
  gender: 'Macho' | 'Hembra';
  color: string;
  birthDate: string;
  ageManual: string;
  weight: string;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  petId: string;
  ownerId: string;
  date: string;
  types: ServiceType[];
  vaccines: string[];
  description: string;
  observations: string;
  diagnosis: string;
  treatment: string;
  price: number;
  paymentMethod: PaymentMethod;
  payments: PaymentSplit[];
  vet: string;
  createdAt: string;
  attachment?: { name: string; data: string; type: string };
  /** @deprecated use types[] */
  type?: ServiceType;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  ownerName: string;
  petName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  createdAt: string;
}

export interface WeeklySnapshot {
  weekStart: string;
  weekEnd: string;
  totalCash: number;
  totalYappy: number;
  totalRevenue: number;
  serviceCount: number;
}

export interface Expense {
  id: string;
  description: string;
  cost: number;
  date: string;
  createdAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  createdAt: string;
  /** Commission the helper earns from this specific abono (calculated at payment time). */
  commissionEarned: number;
  /** Payment method for this abono, feeds into Dashboard totals. */
  method: PaymentMethod;
}

export interface Debt {
  id: string;
  ownerId: string;
  petId: string;
  description: string;
  totalAmount: number;
  date: string;
  payments: DebtPayment[];
  /** The service type associated with this debt, used to calculate abono commissions. */
  serviceType: ServiceType;
  createdAt: string;
}

export const HELPER_BASE_WEEKLY = 80;
export const HELPER_COMMISSION_RATE = 0.20;
export const HELPER_BATH_CORTE_FIXED = 5;
export const HELPER_EXPORTACION_COMMISSION = 0;

export interface Appointment {
  id: string;
  ownerId: string;
  petId: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  notes: string;
  createdAt: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  salePrice: number;
  stock: number;
  category: 'Medicamento' | 'Accesorio' | 'Alimento' | 'Otro';
  imageUrl?: string;
  createdAt: string;
}

export interface PharmacySale {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  paymentMethod: PaymentMethod;
  date: string;
  notes: string;
  createdAt: string;
}

export interface LabTestResult {
  name: string;
  result: 'Positivo' | 'Negativo' | '';
  details: string;
}

export interface LabResult {
  id: string;
  petId: string;
  ownerId: string;
  date: string;
  tests: LabTestResult[];
  observations: string;
  signatureData: string;
  createdAt: string;
}

export interface HealthCertificate {
  id: string;
  petId: string;
  ownerId: string;
  date: string;
  passport: string;
  address: string;
  exportTo: string;
  healthStatus: string;
  observations: string;
  signatureData: string;
  createdAt: string;
}


