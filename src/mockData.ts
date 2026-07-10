import { Tenant, AppUser, Client, ServiceItem, Appointment, Project, Invoice, StaffMember, FinanceTx, Payment, UserRole } from "./types";

// ── Demo Tenant ──────────────────────────────────────────────────────────────
export const demoTenants: Tenant[] = [
  {
    id: "t-salon-1",
    name: "Glamour Studio",
    type: "salon",
    ownerName: "Priya Sharma",
    email: "priya@glamourstudio.in",
    phone: "9876543210",
    address: "12 Park Street, Kolkata",
    createdAt: "2026-01-15",
    active: true,
    plan: "free",
  },
  {
    id: "t-agency-1",
    name: "Pixel Craft Agency",
    type: "agency",
    ownerName: "Rahul Mehta",
    email: "rahul@pixelcraft.in",
    phone: "9123456789",
    address: "4th Floor, Tech Park, Bangalore",
    createdAt: "2026-02-10",
    active: true,
    plan: "free",
  },
];

// ── Demo Users ───────────────────────────────────────────────────────────────
export const demoUsers: AppUser[] = [
  {
    id: "u-sysadmin",
    tenantId: "SYSTEM",
    name: "System Admin",
    email: "admin@deinrim360.in",
    password: "admin123",
    role: UserRole.SYSTEM_ADMIN,
  },
  {
    id: "u-salon-admin",
    tenantId: "t-salon-1",
    name: "Priya Sharma",
    email: "priya@glamourstudio.in",
    password: "demo123",
    role: UserRole.TENANT_ADMIN,
  },
  {
    id: "u-salon-staff",
    tenantId: "t-salon-1",
    name: "Meena Kapoor",
    email: "meena@glamourstudio.in",
    password: "demo123",
    role: UserRole.STAFF,
  },
  {
    id: "u-agency-admin",
    tenantId: "t-agency-1",
    name: "Rahul Mehta",
    email: "rahul@pixelcraft.in",
    password: "demo123",
    role: UserRole.TENANT_ADMIN,
  },
];

// ── Demo Clients ─────────────────────────────────────────────────────────────
export const demoClients: Client[] = [
  { id: "cl-1", tenantId: "t-salon-1", code: "CLT-001", name: "Anita Bose", email: "anita@gmail.com", phone: "9000000001", address: "Salt Lake, Kolkata", type: "individual", tags: ["VIP"], notes: "Prefers morning slots", createdAt: "2026-03-01", totalSpend: 8500 },
  { id: "cl-2", tenantId: "t-salon-1", code: "CLT-002", name: "Ritu Singh", email: "ritu@gmail.com", phone: "9000000002", address: "New Town, Kolkata", type: "individual", tags: [], notes: "", createdAt: "2026-03-15", totalSpend: 3200 },
  { id: "cl-3", tenantId: "t-agency-1", code: "CLT-001", name: "Sunrise Exports", email: "ceo@sunrise.in", phone: "9111111111", address: "MG Road, Bangalore", type: "business", tags: ["Retainer"], notes: "Monthly retainer client", createdAt: "2026-01-20", totalSpend: 125000 },
  { id: "cl-4", tenantId: "t-agency-1", code: "CLT-002", name: "TechNova Pvt Ltd", email: "contact@technova.in", phone: "9222222222", address: "Whitefield, Bangalore", type: "business", tags: [], notes: "", createdAt: "2026-03-05", totalSpend: 48000 },
];

// ── Demo Service Catalogue ───────────────────────────────────────────────────
export const demoServices: ServiceItem[] = [
  { id: "svc-1", tenantId: "t-salon-1", code: "SVC-001", name: "Haircut & Styling", category: "Hair", description: "Professional cut and blow dry", price: 800, duration: 60, taxable: true, taxPct: 18, active: true },
  { id: "svc-2", tenantId: "t-salon-1", code: "SVC-002", name: "Full Body Massage", category: "Spa", description: "Relaxing 60-min full body massage", price: 1500, duration: 60, taxable: true, taxPct: 18, active: true },
  { id: "svc-3", tenantId: "t-salon-1", code: "SVC-003", name: "Manicure & Pedicure", category: "Nails", description: "Nail care + polish", price: 600, duration: 45, taxable: true, taxPct: 18, active: true },
  { id: "svc-4", tenantId: "t-agency-1", code: "SVC-001", name: "Website Design", category: "Design", description: "5-page responsive website", price: 25000, duration: 0, taxable: true, taxPct: 18, active: true },
  { id: "svc-5", tenantId: "t-agency-1", code: "SVC-002", name: "SEO Package", category: "Marketing", description: "3-month SEO optimization", price: 15000, duration: 0, taxable: true, taxPct: 18, active: true },
  { id: "svc-6", tenantId: "t-agency-1", code: "SVC-003", name: "Social Media Management", category: "Marketing", description: "Monthly social media content + posting", price: 8000, duration: 0, taxable: true, taxPct: 18, active: true },
];

// ── Demo Appointments ────────────────────────────────────────────────────────
export const demoAppointments: Appointment[] = [
  { id: "apt-1", tenantId: "t-salon-1", clientId: "cl-1", staffId: "st-1", serviceIds: ["svc-1"], date: "2026-07-10", time: "10:00", durationMins: 60, status: "confirmed", notes: "", totalAmount: 944, createdAt: "2026-07-08" },
  { id: "apt-2", tenantId: "t-salon-1", clientId: "cl-2", staffId: "st-2", serviceIds: ["svc-2", "svc-3"], date: "2026-07-10", time: "12:00", durationMins: 105, status: "scheduled", notes: "First time visit", totalAmount: 2478, createdAt: "2026-07-09" },
  { id: "apt-3", tenantId: "t-salon-1", clientId: "cl-1", staffId: "st-1", serviceIds: ["svc-3"], date: "2026-07-12", time: "11:00", durationMins: 45, status: "scheduled", notes: "", totalAmount: 708, createdAt: "2026-07-09" },
];

// ── Demo Projects ────────────────────────────────────────────────────────────
export const demoProjects: Project[] = [
  {
    id: "prj-1", tenantId: "t-agency-1", code: "PRJ-001", title: "Sunrise Exports — Website Redesign",
    clientId: "cl-3", assignedStaffIds: ["st-3", "st-4"], status: "active",
    startDate: "2026-05-01", endDate: "2026-07-31", totalValue: 75000,
    milestones: [
      { id: "ms-1", title: "Discovery & Wireframes", dueDate: "2026-05-15", status: "done", amount: 15000 },
      { id: "ms-2", title: "Design Mockups", dueDate: "2026-06-15", status: "done", amount: 25000 },
      { id: "ms-3", title: "Development", dueDate: "2026-07-15", status: "in_progress", amount: 25000 },
      { id: "ms-4", title: "Testing & Launch", dueDate: "2026-07-31", status: "pending", amount: 10000 },
    ],
    notes: "Priority client. Weekly check-ins every Monday.", createdAt: "2026-04-28",
  },
  {
    id: "prj-2", tenantId: "t-agency-1", code: "PRJ-002", title: "TechNova — SEO + Social",
    clientId: "cl-4", assignedStaffIds: ["st-4"], status: "active",
    startDate: "2026-06-01", endDate: "2026-08-31", totalValue: 48000,
    milestones: [
      { id: "ms-5", title: "Audit & Strategy", dueDate: "2026-06-15", status: "done", amount: 8000 },
      { id: "ms-6", title: "Month 1 Execution", dueDate: "2026-06-30", status: "done", amount: 16000 },
      { id: "ms-7", title: "Month 2 Execution", dueDate: "2026-07-31", status: "in_progress", amount: 16000 },
      { id: "ms-8", title: "Month 3 + Report", dueDate: "2026-08-31", status: "pending", amount: 8000 },
    ],
    notes: "", createdAt: "2026-05-28",
  },
];

// ── Demo Invoices ────────────────────────────────────────────────────────────
export const demoInvoices: Invoice[] = [
  {
    id: "inv-1", tenantId: "t-salon-1", type: "invoice", number: "INV-2026-001",
    clientId: "cl-1", lineItems: [{ id: "li-1", serviceId: "svc-1", description: "Haircut & Styling", qty: 1, rate: 800, taxPct: 18, total: 944 }],
    subtotal: 800, taxTotal: 144, grandTotal: 944, status: "paid",
    issueDate: "2026-07-01", dueDate: "2026-07-08", notes: "", createdAt: "2026-07-01",
  },
  {
    id: "inv-2", tenantId: "t-agency-1", type: "invoice", number: "INV-2026-001",
    clientId: "cl-3", projectId: "prj-1", lineItems: [
      { id: "li-2", serviceId: "svc-4", description: "Discovery & Wireframes", qty: 1, rate: 15000, taxPct: 18, total: 17700 },
    ],
    subtotal: 15000, taxTotal: 2700, grandTotal: 17700, status: "paid",
    issueDate: "2026-05-16", dueDate: "2026-05-23", notes: "Milestone 1 payment", createdAt: "2026-05-16",
  },
  {
    id: "inv-3", tenantId: "t-agency-1", type: "invoice", number: "INV-2026-002",
    clientId: "cl-3", projectId: "prj-1", lineItems: [
      { id: "li-3", serviceId: "svc-4", description: "Design Mockups", qty: 1, rate: 25000, taxPct: 18, total: 29500 },
    ],
    subtotal: 25000, taxTotal: 4500, grandTotal: 29500, status: "sent",
    issueDate: "2026-06-16", dueDate: "2026-06-30", notes: "Milestone 2 payment", createdAt: "2026-06-16",
  },
];

// ── Demo Payments ────────────────────────────────────────────────────────────
export const demoPayments: Payment[] = [
  { id: "pay-1", tenantId: "t-salon-1", invoiceId: "inv-1", clientId: "cl-1", amount: 944, method: "upi", date: "2026-07-01", reference: "UPI-29384", notes: "" },
  { id: "pay-2", tenantId: "t-agency-1", invoiceId: "inv-2", clientId: "cl-3", amount: 17700, method: "bank", date: "2026-05-20", reference: "NEFT-88123", notes: "" },
];

// ── Demo Staff ───────────────────────────────────────────────────────────────
export const demoStaff: StaffMember[] = [
  { id: "st-1", tenantId: "t-salon-1", code: "STF-001", name: "Meena Kapoor", email: "meena@glamourstudio.in", phone: "9500000001", role: "Senior Stylist", salary: 22000, commissionPct: 10, joiningDate: "2025-06-01", active: true },
  { id: "st-2", tenantId: "t-salon-1", code: "STF-002", name: "Sunita Das", email: "sunita@glamourstudio.in", phone: "9500000002", role: "Spa Therapist", salary: 18000, commissionPct: 8, joiningDate: "2025-09-15", active: true },
  { id: "st-3", tenantId: "t-agency-1", code: "STF-001", name: "Arjun Nair", email: "arjun@pixelcraft.in", phone: "9600000001", role: "Lead Designer", salary: 45000, commissionPct: 0, joiningDate: "2025-03-01", active: true },
  { id: "st-4", tenantId: "t-agency-1", code: "STF-002", name: "Divya Rao", email: "divya@pixelcraft.in", phone: "9600000002", role: "Digital Marketer", salary: 35000, commissionPct: 5, joiningDate: "2025-07-01", active: true },
];

// ── Demo Finance ─────────────────────────────────────────────────────────────
export const demoFinanceTx: FinanceTx[] = [
  { id: "ftx-1", tenantId: "t-salon-1", type: "income", category: "Service Revenue", amount: 944, date: "2026-07-01", description: "Payment from Anita Bose - INV-2026-001", method: "upi", referenceId: "inv-1" },
  { id: "ftx-2", tenantId: "t-salon-1", type: "expense", category: "Supplies", amount: 3500, date: "2026-07-03", description: "Hair care products purchase", method: "cash" },
  { id: "ftx-3", tenantId: "t-agency-1", type: "income", category: "Project Revenue", amount: 17700, date: "2026-05-20", description: "Milestone 1 - Sunrise Exports", method: "bank", referenceId: "inv-2" },
  { id: "ftx-4", tenantId: "t-agency-1", type: "expense", category: "Salary", amount: 80000, date: "2026-06-30", description: "Staff salary June 2026", method: "bank" },
];
