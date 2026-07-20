import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Users, Layers, Calendar, Briefcase, FileText,
  UserCheck, DollarSign, LogOut, ShieldCheck, ChevronRight, Building2, Menu, X,
  FileSpreadsheet, FolderOpen, Settings, UserCog, KeyRound, ChevronDown
} from "lucide-react";

import { AppUser, Tenant, Client, ServiceItem, Appointment, Project, Invoice, Payment, StaffMember, AttendanceRecord, FinanceTx, LeaveRequest, PayrollRecord, UserRole, GSTSettings, GSTReturn } from "./types";
import { demoUsers } from "./mockData";

import HomePage from "./components/home/HomePage";
import SystemAdminView from "./components/admin/SystemAdminView";
import DashboardView from "./components/dashboard/DashboardView";
import ClientsView from "./components/clients/ClientsView";
import ServiceCatalogueView from "./components/catalogue/ServiceCatalogueView";
import AppointmentsView from "./components/appointments/AppointmentsView";
import ProjectsView from "./components/projects/ProjectsView";
import InvoicingView from "./components/invoicing/InvoicingView";
import HRView from "./components/hr/HRView";
import FinanceView from "./components/finance/FinanceView";
import GSTView from "./components/gst/GSTView";
import DocumentsView from "./components/documents/DocumentsView";

// -- API helpers (server is single source of truth for tenants & users) --------
const SYSTEM_ADMINS: AppUser[] = [
  { id: "u-apex7tech", tenantId: "SYSTEM", name: "Apex7Tech Admin", email: "apex7tech@gmail.com", password: "Search@1959", role: UserRole.SYSTEM_ADMIN },
  { id: "u-arun",     tenantId: "SYSTEM", name: "Arun Jaiswal",    email: "deinrimsolutionss@gmail.com", password: "admin123", role: UserRole.SYSTEM_ADMIN },
];

async function apiGetTenants(): Promise<Tenant[]> {
  try {
    const res = await fetch("/api/services/tenants");
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function apiSaveTenant(t: Tenant, isNew: boolean): Promise<void> {
  const url = isNew ? "/api/services/tenants" : `/api/services/tenants/${t.id}`;
  await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }).catch(() => {});
}

async function apiDeleteTenant(id: string): Promise<void> {
  await fetch(`/api/services/tenants/${id}`, { method: "DELETE" }).catch(() => {});
}

async function apiGetUsers(): Promise<AppUser[]> {
  try {
    const res = await fetch("/api/services/users");
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

// Fetch Company Admin users from the main OMS global_users table
// and expose them as TENANT_ADMIN users in /services so they can log in here too
async function apiGetOmsUsers(): Promise<AppUser[]> {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) return [];
    const all = await res.json();
    if (!Array.isArray(all)) return [];
    return all
      .filter((u: any) => u.role === "Company Admin" && u.companyId && u.email && u.password)
      .map((u: any): AppUser => ({
        id: `oms-${u.id}`,
        tenantId: u.companyId,
        name: u.name,
        email: u.email,
        password: u.password,
        role: UserRole.TENANT_ADMIN,
      }));
  } catch { return []; }
}

async function apiSaveUser(u: AppUser, isNew: boolean): Promise<void> {
  const url = isNew ? "/api/services/users" : `/api/services/users/${u.id}`;
  await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(u) }).catch(() => {});
}

async function apiDeleteUser(id: string): Promise<void> {
  await fetch(`/api/services/users/${id}`, { method: "DELETE" }).catch(() => {});
}

// -- MySQL persistence for tenant operational data ----------------------------
async function apiLoadEntity<T>(tenantId: string, entity: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`/api/data/${tenantId}/${entity}`);
    if (!res.ok) return fallback;
    const data = await res.json();
    return data ?? fallback;
  } catch { return fallback; }
}
async function apiSaveEntity(tenantId: string, entity: string, data: unknown): Promise<void> {
  await fetch(`/api/data/${tenantId}/${entity}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  }).catch(() => {});
}

const DEFAULT_GST_SETTINGS: GSTSettings = {
  gstin: "", legalName: "", stateCode: "", pan: "",
  registrationType: "regular", returnFrequency: "monthly",
  fyStart: "2025-04-01", hsnCodes: [], sacCodes: [],
};

type AppTab = "dashboard" | "clients" | "catalogue" | "appointments" | "projects" | "invoicing" | "staff" | "finance" | "gst" | "documents" | "settings";

export default function App() {
  // Tenants & users — from MySQL, start empty
  const [tenants, setTenants]           = useState<Tenant[]>([]);
  const [users, setUsers]               = useState<AppUser[]>([...SYSTEM_ADMINS]);
  const [dbReady, setDbReady]           = useState(false);

  // Operational data — all from MySQL, keyed per tenant; start empty
  const [clients, setClients]           = useState<Client[]>([]);
  const [services, setServices]         = useState<ServiceItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [projects, setProjects]         = useState<Project[]>([]);
  const [invoices, setInvoices]         = useState<Invoice[]>([]);
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [staff, setStaff]               = useState<StaffMember[]>([]);
  const [attendance, setAttendance]     = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [financeTx, setFinanceTx]       = useState<FinanceTx[]>([]);
  const [gstSettings, setGSTSettings]   = useState<GSTSettings>(DEFAULT_GST_SETTINGS);
  const [gstReturns, setGSTReturns]     = useState<GSTReturn[]>([]);
  const [tenantDataLoaded, setTenantDataLoaded] = useState(false);
  const saveEnabled = useRef(false);

  // Auth
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Navigation
  const [activeTab, setActiveTab]     = useState<AppTab>("dashboard");
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminTab, setAdminTab]       = useState<"tenants" | "documents">("tenants");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCredModal, setShowCredModal] = useState(false);
  const [credForm, setCredForm] = useState({ email: "", newPassword: "", confirmPassword: "" });
  const [credMsg, setCredMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Load tenants & users from MySQL on mount
  useEffect(() => {
    Promise.all([apiGetTenants(), apiGetUsers(), apiGetOmsUsers()]).then(([dbTenants, dbUsers, omsUsers]) => {
      setTenants(dbTenants);
      const servicesEmails = new Set(dbUsers.map((u: AppUser) => u.email.toLowerCase()));
      const newOms = omsUsers.filter(u => !servicesEmails.has(u.email.toLowerCase()));
      setUsers([...SYSTEM_ADMINS, ...dbUsers.filter(u => u.role !== UserRole.SYSTEM_ADMIN), ...newOms]);
      setDbReady(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load tenant operational data from MySQL after login (when activeTenantId changes)
  useEffect(() => {
    if (!activeTenantId) return;
    saveEnabled.current = false;
    setTenantDataLoaded(false);
    const tid = activeTenantId;
    Promise.all([
      apiLoadEntity<Client[]>(tid, "svc_clients", []),
      apiLoadEntity<ServiceItem[]>(tid, "svc_services", []),
      apiLoadEntity<Appointment[]>(tid, "svc_appointments", []),
      apiLoadEntity<Project[]>(tid, "svc_projects", []),
      apiLoadEntity<Invoice[]>(tid, "svc_invoices", []),
      apiLoadEntity<Payment[]>(tid, "svc_payments", []),
      apiLoadEntity<StaffMember[]>(tid, "svc_staff", []),
      apiLoadEntity<AttendanceRecord[]>(tid, "svc_attendance", []),
      apiLoadEntity<LeaveRequest[]>(tid, "svc_leaves", []),
      apiLoadEntity<PayrollRecord[]>(tid, "svc_payroll", []),
      apiLoadEntity<FinanceTx[]>(tid, "svc_finance", []),
      apiLoadEntity<GSTSettings | null>(tid, "svc_gst_settings", null),
      apiLoadEntity<GSTReturn[]>(tid, "svc_gst_returns", []),
    ]).then(([dbC, dbSvc, dbApt, dbPrj, dbInv, dbPay, dbStf, dbAtt, dbLv, dbPr, dbFin, dbGstS, dbGstR]) => {
      setClients(dbC);
      setServices(dbSvc);
      setAppointments(dbApt);
      setProjects(dbPrj);
      setInvoices(dbInv);
      setPayments(dbPay);
      setStaff(dbStf);
      setAttendance(dbAtt);
      setLeaveRequests(dbLv);
      setPayrollRecords(dbPr);
      setFinanceTx(dbFin);
      setGSTSettings(dbGstS ?? DEFAULT_GST_SETTINGS);
      setGSTReturns(dbGstR);
      setTenantDataLoaded(true);
      saveEnabled.current = true;
    });
  }, [activeTenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist tenant operational data to MySQL on every change (after initial load)
  useEffect(() => {
    if (!saveEnabled.current || !activeTenantId) return;
    const tid = activeTenantId;
    apiSaveEntity(tid, "svc_clients", clients);
    apiSaveEntity(tid, "svc_services", services);
    apiSaveEntity(tid, "svc_appointments", appointments);
    apiSaveEntity(tid, "svc_projects", projects);
    apiSaveEntity(tid, "svc_invoices", invoices);
    apiSaveEntity(tid, "svc_payments", payments);
    apiSaveEntity(tid, "svc_staff", staff);
    apiSaveEntity(tid, "svc_attendance", attendance);
    apiSaveEntity(tid, "svc_leaves", leaveRequests);
    apiSaveEntity(tid, "svc_payroll", payrollRecords);
    apiSaveEntity(tid, "svc_finance", financeTx);
    apiSaveEntity(tid, "svc_gst_settings", gstSettings);
    apiSaveEntity(tid, "svc_gst_returns", gstReturns);
  }, [clients, services, appointments, projects, invoices, payments, staff, attendance, leaveRequests, payrollRecords, financeTx, gstSettings, gstReturns]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    if (user.role === UserRole.SYSTEM_ADMIN) {
      setActiveTenantId(null);
    } else {
      setActiveTenantId(user.tenantId);
      // If this is an OMS user logging in for the first time, auto-create their tenant stub
      const tenantExists = tenants.find(t => t.id === user.tenantId);
      if (!tenantExists) {
        const stub: Tenant = {
          id: user.tenantId,
          name: user.tenantId, // placeholder — user can update in Settings
          type: "general",
          ownerName: user.name,
          email: user.email,
          phone: "",
          address: "",
          active: true,
          plan: "free",
          createdAt: new Date().toISOString().split("T")[0],
        };
        setTenants(prev => [...prev, stub]);
        apiSaveTenant(stub, true);
      }
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    saveEnabled.current = false;
    setCurrentUser(null);
    setActiveTenantId(null);
    setTenantDataLoaded(false);
    setClients([]); setServices([]); setAppointments([]); setProjects([]);
    setInvoices([]); setPayments([]); setStaff([]); setAttendance([]);
    setLeaveRequests([]); setPayrollRecords([]); setFinanceTx([]);
    setGSTSettings(DEFAULT_GST_SETTINGS); setGSTReturns([]);
  };

  // Tenant-scoped data helpers
  const tid = activeTenantId || "";
  const tenantClients     = clients.filter(c => c.tenantId === tid);
  const tenantServices    = services.filter(s => s.tenantId === tid);
  const tenantAppointments= appointments.filter(a => a.tenantId === tid);
  const tenantProjects    = projects.filter(p => p.tenantId === tid);
  const tenantInvoices    = invoices.filter(i => i.tenantId === tid);
  const tenantPayments    = payments.filter(p => p.tenantId === tid);
  const tenantStaff       = staff.filter(s => s.tenantId === tid);
  const tenantAttendance  = attendance.filter(a => a.tenantId === tid);
  const tenantLeaves      = leaveRequests.filter(l => l.tenantId === tid);
  const tenantPayroll     = payrollRecords.filter(p => p.tenantId === tid);
  const tenantFinanceTx   = financeTx.filter(t => t.tenantId === tid);

  const currentTenant = tenants.find(t => t.id === tid);
  const isSysAdmin = currentUser?.role === UserRole.SYSTEM_ADMIN;
  const isSalon = currentTenant?.type === "salon";
  const isAgency = currentTenant?.type === "agency";

  const handleFinanceTx = (_type: "income", amount: number, description: string, referenceId: string) => {
    const tx: FinanceTx = {
      id: `ftx-${Date.now()}`, tenantId: tid, type: "income",
      category: "Service Revenue", amount, date: new Date().toISOString().split("T")[0],
      description, method: "bank", referenceId,
    };
    setFinanceTx(prev => [tx, ...prev]);
  };

  // -- HOME / LOGIN PAGE -------------------------------------------------------
  if (!currentUser) {
    return <HomePage users={users} onLogin={handleLogin} />;
  }

  // -- SYSTEM ADMIN SHELL ------------------------------------------------------
  const adminNav = [
    { id: "tenants"   as const, label: "Tenants & Users", icon: Building2,  desc: "Manage all businesses" },
    { id: "documents" as const, label: "Documents",        icon: FolderOpen, desc: "Platform file storage" },
  ];

  if (isSysAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white font-black text-sm cursor-pointer transition-all" title="Go to Home">DS</button>
            <div>
              <span className="text-base font-black text-white">DEINRIM Services</span>
              <span className="ml-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">System Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{currentUser.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 text-sm font-bold cursor-pointer transition-all">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </header>

        <div className="flex flex-1">
          {/* Left sidebar */}
          <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">Admin Panel</p>
            </div>
            <nav className="flex-1 px-3 space-y-0.5 py-2">
              {adminNav.map(({ id, label, icon: Icon, desc }) => (
                <button key={id} onClick={() => setAdminTab(id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm font-bold transition-all cursor-pointer ${
                    adminTab === id
                      ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300"
                      : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}>
                  <Icon className={`h-4 w-4 shrink-0 ${adminTab === id ? "text-indigo-400" : "text-slate-500"}`} />
                  <div className="min-w-0">
                    <div className="truncate leading-none">{label}</div>
                    <div className={`text-[10px] font-normal mt-0.5 truncate ${adminTab === id ? "text-indigo-400/70" : "text-slate-600"}`}>{desc}</div>
                  </div>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-800">
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <UserCog className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[9px] text-amber-400 font-mono uppercase">System Admin</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            {adminTab === "tenants" && (
              <SystemAdminView
                tenants={tenants} setTenants={setTenants}
                users={users} setUsers={setUsers}
                onSaveTenant={apiSaveTenant} onDeleteTenant={apiDeleteTenant}
                onSaveUser={apiSaveUser} onDeleteUser={apiDeleteUser}
              />
            )}
            {adminTab === "documents" && (
              <div className="p-6">
                <DocumentsView />
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // -- TENANT SHELL ------------------------------------------------------------
  if (!currentTenant) return <div className="min-h-screen flex items-center justify-center text-red-400">Tenant not found.</div>;

  // Show loading screen while fetching tenant data from MySQL
  if (!tenantDataLoaded) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col gap-4">
      <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm font-semibold">Loading your workspace…</p>
      <p className="text-slate-600 text-xs font-mono">{currentTenant.name}</p>
    </div>
  );

  const navItems: { id: AppTab; label: string; icon: React.ElementType; show: boolean }[] = ([
    { id: "dashboard" as AppTab,    label: "Dashboard",       icon: LayoutDashboard, show: true },
    { id: "clients" as AppTab,      label: "Clients",          icon: Users,           show: true },
    { id: "catalogue" as AppTab,    label: "Services",         icon: Layers,          show: true },
    { id: "appointments" as AppTab, label: "Appointments",     icon: Calendar,        show: isSalon || currentTenant.type === "general" },
    { id: "projects" as AppTab,     label: "Projects",         icon: Briefcase,       show: isAgency || currentTenant.type === "general" },
    { id: "invoicing" as AppTab,    label: "Invoicing",        icon: FileText,        show: true },
    { id: "staff" as AppTab,        label: "HR",               icon: UserCheck,       show: true },
    { id: "finance" as AppTab,      label: "Finance",          icon: DollarSign,      show: true },
    { id: "gst" as AppTab,          label: "GST",              icon: FileSpreadsheet, show: true },
    { id: "documents" as AppTab,    label: "Documents",        icon: FolderOpen,      show: true },
    { id: "settings" as AppTab,     label: "Settings",         icon: Settings,        show: currentUser?.role === UserRole.TENANT_ADMIN },
  ] as { id: AppTab; label: string; icon: React.ElementType; show: boolean }[]).filter(n => n.show);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded text-slate-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={handleLogout} className="h-9 w-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white font-black text-base shrink-0 cursor-pointer transition-all" title="Go to Home">
            {currentTenant.name.charAt(0)}
          </button>
          <div className="hidden sm:block">
            <span className="text-base font-black text-white">{currentTenant.name}</span>
            <span className="ml-2 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">{currentTenant.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(p => !p)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800 transition-colors text-slate-300"
            >
              <span className="text-sm font-semibold hidden sm:block">{currentUser.name}</span>
              <span className="text-xs text-slate-500 hidden sm:block">· {currentUser.role.replace(/_/g," ")}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 top-10 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => { setCredForm({ email: currentUser.email, newPassword: "", confirmPassword: "" }); setCredMsg(null); setShowCredModal(true); setShowProfileMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <KeyRound className="h-4 w-4 text-indigo-400" /> Change Login / Password
                </button>
                <div className="border-t border-slate-800 mt-1 pt-1">
                  <button
                    onClick={() => { handleLogout(); setShowProfileMenu(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 text-sm font-bold cursor-pointer">
            <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Change Credentials Modal */}
      {showCredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2"><KeyRound className="h-4 w-4 text-indigo-400" /> Change Login / Password</h2>
              <button onClick={() => setShowCredModal(false)} className="text-slate-500 hover:text-slate-300"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Login Email (ID)</label>
                <input type="email" value={credForm.email} onChange={e => setCredForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password <span className="text-slate-600 normal-case font-normal">(leave blank to keep current)</span></label>
                <input type="password" value={credForm.newPassword} onChange={e => setCredForm(f => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input type="password" value={credForm.confirmPassword} onChange={e => setCredForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" />
              </div>
              {credMsg && (
                <p className={`text-xs font-semibold px-3 py-2 rounded-lg ${credMsg.type === "ok" ? "bg-emerald-900/40 text-emerald-400" : "bg-red-900/40 text-red-400"}`}>
                  {credMsg.text}
                </p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCredModal(false)} className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800">Cancel</button>
              <button
                onClick={() => {
                  if (!credForm.email.trim()) { setCredMsg({ type: "err", text: "Email cannot be empty." }); return; }
                  if (credForm.newPassword && credForm.newPassword !== credForm.confirmPassword) { setCredMsg({ type: "err", text: "Passwords do not match." }); return; }
                  if (credForm.newPassword && credForm.newPassword.length < 6) { setCredMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }
                  const finalPassword = credForm.newPassword || currentUser.password || "";
                  if (!currentUser) return;
                  setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, email: credForm.email.trim(), password: finalPassword } : u));
                  setCurrentUser({ ...currentUser, email: credForm.email.trim(), password: finalPassword });
                  setCredMsg({ type: "ok", text: "Credentials updated successfully!" });
                  setTimeout(() => setShowCredModal(false), 1200);
                }}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-56 bg-slate-950 border-r border-slate-900 flex flex-col shrink-0 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}>
          {/* Mobile close */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 md:hidden">
            <span className="text-xs font-bold text-slate-400 uppercase">Navigation</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 cursor-pointer"><X className="h-4 w-4" /></button>
          </div>

          <div className="p-3 border-b border-slate-900 hidden md:block">
            <div className="px-2 py-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">DEINRIM Services</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold tracking-tight transition-all cursor-pointer ${
                  activeTab === id
                    ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}>
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${activeTab === id ? "text-indigo-400" : "text-slate-500"}`} />
                  <span>{label}</span>
                </div>
                {activeTab === id && <ChevronRight className="h-3.5 w-3.5 text-indigo-500/80" />}
              </button>
            ))}
          </nav>


          <div className="p-3 border-t border-slate-900 text-center text-slate-500 text-[10px] font-mono">
            DEINRIM Services · deinrim360.in/services
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6">
          {activeTab === "dashboard" && (
            <DashboardView
              tenant={currentTenant} clients={tenantClients} appointments={tenantAppointments}
              projects={tenantProjects} invoices={tenantInvoices} financeTx={tenantFinanceTx}
              staff={tenantStaff} onNavigate={tab => setActiveTab(tab as AppTab)}
            />
          )}
          {activeTab === "clients" && (
            <ClientsView clients={tenantClients} setClients={setClients} tenantId={tid} />
          )}
          {activeTab === "catalogue" && (
            <ServiceCatalogueView services={tenantServices} setServices={setServices} tenantId={tid} />
          )}
          {activeTab === "appointments" && (
            <AppointmentsView
              appointments={tenantAppointments} setAppointments={setAppointments}
              clients={tenantClients} services={tenantServices} staff={tenantStaff} tenantId={tid}
            />
          )}
          {activeTab === "projects" && (
            <ProjectsView
              projects={tenantProjects} setProjects={setProjects}
              clients={tenantClients} staff={tenantStaff} tenantId={tid}
            />
          )}
          {activeTab === "invoicing" && (
            <InvoicingView
              invoices={tenantInvoices} setInvoices={setInvoices}
              payments={tenantPayments} setPayments={setPayments}
              clients={tenantClients} services={tenantServices} projects={tenantProjects}
              tenant={currentTenant} tenantId={tid} onFinanceTx={handleFinanceTx}
            />
          )}
          {activeTab === "staff" && (
            <HRView
              staff={tenantStaff} setStaff={setStaff}
              attendance={tenantAttendance} setAttendance={setAttendance}
              leaveRequests={tenantLeaves} setLeaveRequests={setLeaveRequests}
              payrollRecords={tenantPayroll} setPayrollRecords={setPayrollRecords}
              tenantId={tid}
            />
          )}
          {activeTab === "finance" && (
            <FinanceView transactions={tenantFinanceTx} setTransactions={setFinanceTx} tenantId={tid} />
          )}
          {activeTab === "gst" && (
            <GSTView
              invoices={tenantInvoices} clients={tenantClients} payments={tenantPayments}
              tenant={currentTenant} tenantId={tid}
              gstSettings={gstSettings} setGSTSettings={setGSTSettings}
              gstReturns={gstReturns} setGSTReturns={setGSTReturns}
            />
          )}
          {activeTab === "documents" && <DocumentsView />}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto py-6 space-y-6">
              <div>
                <h2 className="text-lg font-black text-white">Company Profile</h2>
                <p className="text-xs text-slate-500 mt-0.5">This information appears on your GST invoices and documents.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">Basic Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Company Name</label>
                    <input type="text" value={currentTenant.name}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, name: e.target.value } : t))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">GSTIN</label>
                    <input type="text" value={currentTenant.gstin || ""}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, gstin: e.target.value } : t))}
                      placeholder="e.g. 19AABCB1234A1ZX"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">State</label>
                    <input type="text" value={currentTenant.state || ""}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, state: e.target.value } : t))}
                      placeholder="e.g. West Bengal"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</label>
                    <input type="text" value={currentTenant.phone || ""}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, phone: e.target.value } : t))}
                      placeholder="+91 98361-30393"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                    <input type="email" value={currentTenant.email || ""}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, email: e.target.value } : t))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Owner / Contact Name</label>
                    <input type="text" value={currentTenant.ownerName || ""}
                      onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, ownerName: e.target.value } : t))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Office / Billing Address</label>
                  <textarea value={currentTenant.address || ""}
                    onChange={e => setTenants(prev => prev.map(t => t.id === tid ? { ...t, address: e.target.value } : t))}
                    rows={3} placeholder="Full office address (appears on GST invoices)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none" />
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => apiSaveTenant(currentTenant, false)}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 text-xs font-bold cursor-pointer transition-all">
                    Save Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
