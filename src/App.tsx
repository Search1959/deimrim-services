import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Layers, Calendar, Briefcase, FileText,
  UserCheck, DollarSign, LogOut, ShieldCheck, ChevronRight, Building2, Menu, X
} from "lucide-react";

import { AppUser, Tenant, Client, ServiceItem, Appointment, Project, Invoice, Payment, StaffMember, AttendanceRecord, FinanceTx, UserRole } from "./types";
import { demoTenants, demoUsers, demoClients, demoServices, demoAppointments, demoProjects, demoInvoices, demoPayments, demoStaff, demoFinanceTx } from "./mockData";

import SystemAdminView from "./components/admin/SystemAdminView";
import DashboardView from "./components/dashboard/DashboardView";
import ClientsView from "./components/clients/ClientsView";
import ServiceCatalogueView from "./components/catalogue/ServiceCatalogueView";
import AppointmentsView from "./components/appointments/AppointmentsView";
import ProjectsView from "./components/projects/ProjectsView";
import InvoicingView from "./components/invoicing/InvoicingView";
import StaffView from "./components/staff/StaffView";
import FinanceView from "./components/finance/FinanceView";

// ── localStorage helpers ──────────────────────────────────────────────────────
const LS_KEY = "deinrim_services_v1";

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveState(state: object) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

type AppTab = "dashboard" | "clients" | "catalogue" | "appointments" | "projects" | "invoicing" | "staff" | "finance";

export default function App() {
  const saved = loadState();

  const [tenants, setTenants]           = useState<Tenant[]>(saved?.tenants ?? demoTenants);
  const [users, setUsers]               = useState<AppUser[]>(saved?.users ?? demoUsers);
  const [clients, setClients]           = useState<Client[]>(saved?.clients ?? demoClients);
  const [services, setServices]         = useState<ServiceItem[]>(saved?.services ?? demoServices);
  const [appointments, setAppointments] = useState<Appointment[]>(saved?.appointments ?? demoAppointments);
  const [projects, setProjects]         = useState<Project[]>(saved?.projects ?? demoProjects);
  const [invoices, setInvoices]         = useState<Invoice[]>(saved?.invoices ?? demoInvoices);
  const [payments, setPayments]         = useState<Payment[]>(saved?.payments ?? demoPayments);
  const [staff, setStaff]               = useState<StaffMember[]>(saved?.staff ?? demoStaff);
  const [attendance, setAttendance]     = useState<AttendanceRecord[]>(saved?.attendance ?? []);
  const [financeTx, setFinanceTx]       = useState<FinanceTx[]>(saved?.financeTx ?? demoFinanceTx);

  // Auth
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginEmail, setLoginEmail]   = useState("");
  const [loginPass, setLoginPass]     = useState("");
  const [loginError, setLoginError]   = useState("");

  // Navigation
  const [activeTab, setActiveTab]     = useState<AppTab>("dashboard");
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist on change
  useEffect(() => {
    saveState({ tenants, users, clients, services, appointments, projects, invoices, payments, staff, attendance, financeTx });
  }, [tenants, users, clients, services, appointments, projects, invoices, payments, staff, attendance, financeTx]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginEmail.trim() && u.password === loginPass);
    if (!user) { setLoginError("Invalid email or password"); return; }
    setCurrentUser(user);
    setLoginError("");
    if (user.role === UserRole.SYSTEM_ADMIN) {
      setActiveTenantId(null);
    } else {
      setActiveTenantId(user.tenantId);
    }
    setActiveTab("dashboard");
  };

  const handleLogout = () => { setCurrentUser(null); setActiveTenantId(null); setLoginEmail(""); setLoginPass(""); };

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

  // ── LOGIN PAGE ──────────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-indigo-600 items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-xl">DS</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">DEINRIM Services</h1>
            <p className="text-slate-500 text-sm mt-1">Service Business Management Platform</p>
          </div>

          <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-300 text-center uppercase tracking-wider font-mono">Sign In</h2>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 text-center">{loginError}</div>
            )}

            <div>
              <label className="block text-slate-400 mb-1.5 text-[10px] font-bold uppercase tracking-wider">Email</label>
              <input type="email" required autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 text-[10px] font-bold uppercase tracking-wider">Password</label>
              <input type="password" required autoComplete="current-password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>

            <button type="submit" className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 text-sm cursor-pointer transition-all">
              Sign In
            </button>
          </form>

          <div className="mt-5 bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">Demo Credentials</p>
            {[
              { label: "System Admin", email: "admin@deinrim360.in", pass: "admin123" },
              { label: "Glamour Studio (Salon)", email: "priya@glamourstudio.in", pass: "demo123" },
              { label: "Pixel Craft (Agency)", email: "rahul@pixelcraft.in", pass: "demo123" },
            ].map(d => (
              <button key={d.email} type="button" onClick={() => { setLoginEmail(d.email); setLoginPass(d.pass); }}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-xs cursor-pointer transition-all">
                <span className="font-bold text-indigo-400">{d.label}</span>
                <span className="text-slate-500 ml-2">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMIN SHELL ──────────────────────────────────────────────────────
  if (isSysAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">DS</div>
            <div>
              <span className="text-sm font-black text-white">DEINRIM Services</span>
              <span className="ml-2 text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">System Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{currentUser.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 text-xs font-bold cursor-pointer">
              <LogOut className="h-3.5 w-3.5" /> Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <SystemAdminView tenants={tenants} setTenants={setTenants} users={users} setUsers={setUsers} />
        </main>
      </div>
    );
  }

  // ── TENANT SHELL ────────────────────────────────────────────────────────────
  if (!currentTenant) return <div className="min-h-screen flex items-center justify-center text-red-400">Tenant not found.</div>;

  const navItems: { id: AppTab; label: string; icon: React.ElementType; show: boolean }[] = ([
    { id: "dashboard" as AppTab,    label: "Dashboard",       icon: LayoutDashboard, show: true },
    { id: "clients" as AppTab,      label: "Clients",          icon: Users,           show: true },
    { id: "catalogue" as AppTab,    label: "Services",         icon: Layers,          show: true },
    { id: "appointments" as AppTab, label: "Appointments",     icon: Calendar,        show: isSalon || currentTenant.type === "general" },
    { id: "projects" as AppTab,     label: "Projects",         icon: Briefcase,       show: isAgency || currentTenant.type === "general" },
    { id: "invoicing" as AppTab,    label: "Invoicing",        icon: FileText,        show: true },
    { id: "staff" as AppTab,        label: "Staff",            icon: UserCheck,       show: true },
    { id: "finance" as AppTab,      label: "Finance",          icon: DollarSign,      show: true },
  ] as { id: AppTab; label: string; icon: React.ElementType; show: boolean }[]).filter(n => n.show);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-800 bg-slate-900/60 shrink-0">
        <div className="flex items-center gap-3">
          <button className="md:hidden p-1.5 rounded text-slate-400 hover:text-white cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {currentTenant.name.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <span className="text-sm font-black text-white">{currentTenant.name}</span>
            <span className="ml-2 text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded uppercase">{currentTenant.type}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:block">{currentUser.name} · {currentUser.role.replace("_"," ")}</span>
          <button onClick={handleLogout} className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 text-xs font-bold cursor-pointer">
            <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
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
              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-mono">DEINRIM Services</span>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setActiveTab(id); setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all cursor-pointer ${
                  activeTab === id
                    ? "bg-indigo-600/10 border border-indigo-500/30 text-indigo-300"
                    : "border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${activeTab === id ? "text-indigo-400" : "text-slate-500"}`} />
                  <span>{label}</span>
                </div>
                {activeTab === id && <ChevronRight className="h-3 w-3 text-indigo-500/80" />}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-900 text-center text-slate-600 text-[9px] font-mono">
            DEINRIM Services · deinrim360.in/services
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
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
              tenantId={tid} onFinanceTx={handleFinanceTx}
            />
          )}
          {activeTab === "staff" && (
            <StaffView
              staff={tenantStaff} setStaff={setStaff}
              attendance={tenantAttendance} setAttendance={setAttendance} tenantId={tid}
            />
          )}
          {activeTab === "finance" && (
            <FinanceView transactions={tenantFinanceTx} setTransactions={setFinanceTx} tenantId={tid} />
          )}
        </main>
      </div>
    </div>
  );
}
