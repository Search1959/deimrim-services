// ─── Roles ────────────────────────────────────────────────────────────────────
export enum UserRole {
  SYSTEM_ADMIN  = "SYSTEM_ADMIN",
  TENANT_ADMIN  = "TENANT_ADMIN",
  STAFF         = "STAFF",
  CLIENT        = "CLIENT",
}

// ─── Tenant (company) ─────────────────────────────────────────────────────────
export type TenantType = "salon" | "agency" | "general";

export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  state?: string;
  logo?: string;
  createdAt: string;
  active: boolean;
  plan: "free" | "pro";
}

// ─── User / Auth ──────────────────────────────────────────────────────────────
export interface AppUser {
  id: string;
  tenantId: string;           // "SYSTEM" for system admin
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// ─── Client (service customer) ────────────────────────────────────────────────
export interface Client {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  state?: string;
  gstin?: string;
  type: "individual" | "business";
  tags: string[];
  notes: string;
  createdAt: string;
  totalSpend: number;
}

// ─── Service Catalogue ────────────────────────────────────────────────────────
export interface ServiceItem {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;           // minutes (for appointments)
  taxable: boolean;
  taxPct: number;
  active: boolean;
}

// ─── Appointment (salon / clinic) ─────────────────────────────────────────────
export type AppointmentStatus = "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  staffId: string;
  serviceIds: string[];
  date: string;               // YYYY-MM-DD
  time: string;               // HH:MM
  durationMins: number;
  status: AppointmentStatus;
  notes: string;
  totalAmount: number;
  createdAt: string;
}

// ─── Project (agency / studio) ────────────────────────────────────────────────
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type MilestoneStatus = "pending" | "in_progress" | "done";

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  status: MilestoneStatus;
  amount: number;
}

export interface Project {
  id: string;
  tenantId: string;
  code: string;
  title: string;
  clientId: string;
  assignedStaffIds: string[];
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  totalValue: number;
  milestones: Milestone[];
  notes: string;
  createdAt: string;
}

// ─── Quote / Invoice ──────────────────────────────────────────────────────────
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type SupplyType = "intra" | "inter"; // intra = CGST+SGST, inter = IGST

export interface InvoiceLineItem {
  id: string;
  serviceId: string;
  description: string;
  qty: number;
  rate: number;
  taxPct: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  type: "quote" | "invoice";
  number: string;
  clientId: string;
  projectId?: string;
  appointmentId?: string;
  supplyType: SupplyType;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  notes: string;
  createdAt: string;
}

// ─── Payment ──────────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  tenantId: string;
  invoiceId: string;
  clientId: string;
  amount: number;
  method: "cash" | "upi" | "bank" | "card" | "other";
  date: string;
  reference: string;
  notes: string;
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave";

export interface StaffMember {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  role: string;               // designation label e.g. "Senior Stylist"
  salary: number;
  commissionPct: number;
  joiningDate: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  staffId: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

// ─── Leave Management ─────────────────────────────────────────────────────────
export type LeaveType   = "casual" | "sick" | "earned" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  tenantId: string;
  staffId: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────
export type PayrollStatus = "pending" | "paid";

export interface PayrollRecord {
  id: string;
  tenantId: string;
  staffId: string;
  month: string;          // YYYY-MM
  presentDays: number;
  workingDays: number;
  grossSalary: number;
  epfEmployee: number;    // 12% of basic
  esicEmployee: number;   // 0.75% if gross <= 21000
  pt: number;             // 200 if gross >= 10000
  tds: number;            // 10% if gross > 50000
  totalDeductions: number;
  netPay: number;
  status: PayrollStatus;
  paidDate?: string;
}

// ─── Finance Transaction ──────────────────────────────────────────────────────
export interface FinanceTx {
  id: string;
  tenantId: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description: string;
  method: "cash" | "upi" | "bank" | "card" | "other";
  referenceId?: string;
}

// ─── GST Module ───────────────────────────────────────────────────────────────
export interface GSTSettings {
  gstin: string;
  legalName: string;
  stateCode: string;
  pan: string;
  registrationType: "regular" | "composition";
  returnFrequency: "monthly" | "quarterly";
  fyStart: string; // e.g. "2025-04-01"
  hsnCodes: { code: string; description: string; rate: number }[];
  sacCodes: { code: string; description: string; rate: number }[];
}

export interface GSTReturn {
  id: string;
  tenantId: string;
  type: "GSTR-1" | "GSTR-3B" | "GSTR-9";
  period: string; // "2025-06" or "2025-Q1"
  status: "draft" | "ready" | "filed";
  filedDate?: string;
  totalTax: number;
  createdAt: string;
  notes: string;
}

export interface GSTAuditLog {
  id: string;
  tenantId: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  userId: string;
  userName: string;
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const formatINR = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  salon: "Salon / Clinic / Spa",
  agency: "Agency / Studio / IT",
  general: "General Services",
};
