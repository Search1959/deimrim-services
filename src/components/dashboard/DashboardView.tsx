import React from "react";
import { TrendingUp, Users, Calendar, Briefcase, FileText, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Tenant, Client, Appointment, Project, Invoice, FinanceTx, StaffMember, formatINR } from "../../types";

interface Props {
  tenant: Tenant;
  clients: Client[];
  appointments: Appointment[];
  projects: Project[];
  invoices: Invoice[];
  financeTx: FinanceTx[];
  staff: StaffMember[];
  onNavigate: (tab: string) => void;
}

export default function DashboardView({ tenant, clients, appointments, projects, invoices, financeTx, staff, onNavigate }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const isSalon = tenant.type === "salon";
  const isAgency = tenant.type === "agency";

  const totalRevenue = financeTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = financeTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const pendingInvoices = invoices.filter(i => i.status === "sent").length;
  const todayApts = appointments.filter(a => a.date === today);
  const activeProjects = projects.filter(p => p.status === "active");

  const kpis = [
    { label: "Total Revenue", value: formatINR(totalRevenue), sub: `${paidInvoices} invoices paid`, icon: TrendingUp, color: "emerald" },
    { label: "Active Clients", value: clients.length, sub: "in your CRM", icon: Users, color: "indigo" },
    ...(isSalon ? [
      { label: "Today's Appointments", value: todayApts.length, sub: `${appointments.filter(a => a.status === "confirmed").length} confirmed`, icon: Calendar, color: "pink" },
    ] : []),
    ...(isAgency ? [
      { label: "Active Projects", value: activeProjects.length, sub: `${projects.reduce((s, p) => s + p.milestones.filter(m => m.status === "done").length, 0)} milestones done`, icon: Briefcase, color: "purple" },
    ] : []),
    { label: "Pending Invoices", value: pendingInvoices, sub: formatINR(invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.grandTotal, 0)) + " outstanding", icon: FileText, color: "amber" },
    { label: "Team Size", value: staff.length, sub: "active staff members", icon: Users, color: "slate" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-800/30 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shrink-0">
            {tenant.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">{tenant.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {tenant.type === "salon" ? "Salon / Clinic / Spa" : tenant.type === "agency" ? "Agency / Studio" : "General Services"} · {tenant.address}
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
            <div className={`p-2 bg-${color}-500/10 text-${color}-400 rounded-lg w-fit mb-3`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{label}</p>
            <p className="text-xl font-black text-white mt-0.5">{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today / Recent */}
        {isSalon && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-pink-400" /> Today's Schedule
              </h3>
              <button onClick={() => onNavigate("appointments")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All →</button>
            </div>
            <div className="divide-y divide-slate-800/50">
              {todayApts.length === 0 && <p className="px-5 py-6 text-xs text-slate-500 text-center">No appointments today</p>}
              {todayApts.map(a => {
                const client = clients.find(c => c.id === a.clientId);
                return (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{client?.name}</p>
                      <p className="text-[10px] text-slate-500">{a.time} · {a.durationMins}min</p>
                    </div>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      a.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      a.status === "completed" ? "bg-slate-700/50 text-slate-400 border-slate-700" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{a.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isAgency && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-purple-400" /> Active Projects
              </h3>
              <button onClick={() => onNavigate("projects")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All →</button>
            </div>
            <div className="divide-y divide-slate-800/50">
              {activeProjects.length === 0 && <p className="px-5 py-6 text-xs text-slate-500 text-center">No active projects</p>}
              {activeProjects.map(p => {
                const done = p.milestones.filter(m => m.status === "done").length;
                const total = p.milestones.length;
                const pct = total ? Math.round((done / total) * 100) : 0;
                const client = clients.find(c => c.id === p.clientId);
                return (
                  <div key={p.id} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-bold text-white truncate max-w-[180px]">{p.title}</p>
                      <span className="text-[10px] text-slate-500">{done}/{total} milestones</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">{client?.name} · Due {p.endDate}</p>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Invoices */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-400" /> Recent Invoices
            </h3>
            <button onClick={() => onNavigate("invoicing")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All →</button>
          </div>
          <div className="divide-y divide-slate-800/50">
            {invoices.length === 0 && <p className="px-5 py-6 text-xs text-slate-500 text-center">No invoices yet</p>}
            {invoices.slice(0, 5).map(inv => {
              const client = clients.find(c => c.id === inv.clientId);
              return (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">{inv.number}</p>
                    <p className="text-[10px] text-slate-500">{client?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-400 font-mono">{formatINR(inv.grandTotal)}</p>
                    <span className={`text-[9px] font-bold uppercase ${
                      inv.status === "paid" ? "text-emerald-400" :
                      inv.status === "sent" ? "text-amber-400" : "text-slate-500"
                    }`}>{inv.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finance summary */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Finance Snapshot
            </h3>
            <button onClick={() => onNavigate("finance")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All →</button>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: "Total Income", value: totalRevenue, color: "emerald" },
              { label: "Total Expenses", value: totalExpense, color: "red" },
              { label: "Net Profit", value: totalRevenue - totalExpense, color: totalRevenue - totalExpense >= 0 ? "indigo" : "red" },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{row.label}</span>
                <span className={`text-sm font-black font-mono text-${row.color}-400`}>{formatINR(row.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
