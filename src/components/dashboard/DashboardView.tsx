import React, { useState } from "react";
import { TrendingUp, Users, Calendar, Briefcase, FileText, DollarSign, Brain, Activity, Send } from "lucide-react";
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

// -- AI Business Assistant (rules-based, no API) ------------------------------
function aiAnswer(query: string, data: {
  clients: Client[]; invoices: Invoice[]; financeTx: FinanceTx[];
  appointments: Appointment[]; projects: Project[]; staff: StaffMember[];
  tenant: Tenant;
}): string {
  const q = query.toLowerCase();
  const { clients, invoices, financeTx, appointments, projects, staff, tenant } = data;

  const totalRevenue = financeTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = financeTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = totalRevenue - totalExpense;
  const pendingAmt = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.grandTotal, 0);
  const unpaidClients = [...new Set(invoices.filter(i => i.status === "sent").map(i => i.clientId))]
    .map(id => clients.find(c => c.id === id)?.name).filter(Boolean);
  const today = new Date().toISOString().split("T")[0];
  const todayApts = appointments.filter(a => a.date === today);
  const activeProjects = projects.filter(p => p.status === "active");

  if (q.includes("profit") || q.includes("how much") && q.includes("earn"))
    return `Your net profit is **${formatINR(profit)}**. Total income: ${formatINR(totalRevenue)}, total expenses: ${formatINR(totalExpense)}.`;

  if (q.includes("revenue") || q.includes("income"))
    return `Total revenue recorded: **${formatINR(totalRevenue)}** across ${financeTx.filter(t => t.type === "income").length} income transactions.`;

  if (q.includes("expense") || q.includes("spend") || q.includes("cost"))
    return `Total expenses: **${formatINR(totalExpense)}** - ${financeTx.filter(t => t.type === "expense").length} expense entries recorded. Net profit stands at ${formatINR(profit)}.`;

  if (q.includes("who") && (q.includes("pay") || q.includes("paid") || q.includes("pending")))
    return unpaidClients.length
      ? `**${unpaidClients.length} clients** have pending invoices totalling ${formatINR(pendingAmt)}:\n${unpaidClients.map(n => `• ${n}`).join("\n")}`
      : "All invoices are paid. Great cash flow!";

  if (q.includes("invoice") || q.includes("outstanding") || q.includes("receivable"))
    return `**${invoices.filter(i => i.status === "sent").length} invoices** are pending collection worth **${formatINR(pendingAmt)}**. ${invoices.filter(i => i.status === "paid").length} invoices have been paid.`;

  if (q.includes("appointment") || q.includes("today") || q.includes("schedule"))
    return todayApts.length
      ? `**${todayApts.length} appointment(s) today**. Next: ${todayApts[0] ? `${todayApts[0].time} - ${clients.find(c => c.id === todayApts[0].clientId)?.name}` : "-"}`
      : "No appointments scheduled for today.";

  if (q.includes("client") || q.includes("customer"))
    return `You have **${clients.length} clients** in your CRM. ${clients.filter(c => c.type === "business").length} are business clients, ${clients.filter(c => c.type === "individual").length} are individual clients.`;

  if (q.includes("project") || q.includes("milestone"))
    return `**${activeProjects.length} active project(s)**. ${projects.filter(p => p.status === "completed").length} completed. Total pipeline value: ${formatINR(activeProjects.reduce((s, p) => s + p.totalValue, 0))}.`;

  if (q.includes("staff") || q.includes("team") || q.includes("employee"))
    return `Your team has **${staff.length} member(s)**. ${staff.filter(s => s.active).length} are currently active.`;

  if (q.includes("gst") || q.includes("tax"))
    return `Total GST collected across invoices: **${formatINR(invoices.reduce((s, i) => s + i.taxTotal, 0))}**. CGST: ${formatINR(invoices.reduce((s, i) => s + i.cgstTotal, 0))}, SGST: ${formatINR(invoices.reduce((s, i) => s + i.sgstTotal, 0))}, IGST: ${formatINR(invoices.reduce((s, i) => s + i.igstTotal, 0))}.`;

  if (q.includes("health") || q.includes("score") || q.includes("status"))
    return `Business Health Score: see the Health Score widget above for your real-time 0-100 score and improvement tips.`;

  return `I can answer questions about your **revenue, expenses, profit, pending invoices, clients, projects, appointments, staff, and GST**. Try: "Who hasn't paid?" or "What is my profit this month?"`;
}

// -- Business Health Score -----------------------------------------------------
function computeHealthScore(invoices: Invoice[], clients: Client[], financeTx: FinanceTx[], staff: StaffMember[], appointments: Appointment[], projects: Project[]) {
  const scores: { label: string; score: number; max: number; tip: string }[] = [];

  // Revenue score (up to 25)
  const revenue = financeTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const revScore = Math.min(25, revenue > 0 ? 25 : 0);
  scores.push({ label: "Revenue Activity", score: revScore, max: 25, tip: revenue > 0 ? "Active revenue recorded" : "No income entries yet - add finance transactions" });

  // Invoice collection rate (up to 25)
  const totalInv = invoices.length;
  const paidInv = invoices.filter(i => i.status === "paid").length;
  const collRate = totalInv > 0 ? paidInv / totalInv : 0;
  const invScore = Math.round(collRate * 25);
  scores.push({ label: "Invoice Collection", score: invScore, max: 25, tip: totalInv > 0 ? `${paidInv}/${totalInv} invoices collected (${Math.round(collRate * 100)}%)` : "No invoices yet - start billing clients" });

  // Client base (up to 25)
  const clientScore = Math.min(25, clients.length * 5);
  scores.push({ label: "Client Base", score: clientScore, max: 25, tip: clients.length > 0 ? `${clients.length} clients in CRM` : "Add clients to grow your score" });

  // Operations (up to 25) - appointments or projects
  const opsCount = appointments.filter(a => a.status === "completed").length + projects.filter(p => p.status === "completed").length;
  const opsScore = Math.min(25, opsCount * 5);
  scores.push({ label: "Operations Activity", score: opsScore, max: 25, tip: opsCount > 0 ? `${opsCount} completed appointments/projects` : "Complete appointments or projects to raise this" });

  const total = scores.reduce((s, x) => s + x.score, 0);
  return { total, scores };
}

export default function DashboardView({ tenant, clients, appointments, projects, invoices, financeTx, staff, onNavigate }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const isSalon = tenant.type === "salon";
  const isAgency = tenant.type === "agency";

  const [aiInput, setAiInput] = useState("");
  const [aiHistory, setAiHistory] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI Business Assistant. Ask me anything about your business - revenue, unpaid invoices, clients, staff, or GST." }
  ]);

  const totalRevenue = financeTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = financeTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === "paid").length;
  const pendingInvoices = invoices.filter(i => i.status === "sent").length;
  const todayApts = appointments.filter(a => a.date === today);
  const activeProjects = projects.filter(p => p.status === "active");

  const { total: healthScore, scores: healthScores } = computeHealthScore(invoices, clients, financeTx, staff, appointments, projects);

  const healthColor = healthScore >= 75 ? "emerald" : healthScore >= 50 ? "amber" : healthScore >= 25 ? "orange" : "red";
  const healthLabel = healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Good" : healthScore >= 25 ? "Fair" : "Needs Attention";

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

  const handleAiSend = () => {
    const q = aiInput.trim();
    if (!q) return;
    const answer = aiAnswer(q, { clients, invoices, financeTx, appointments, projects, staff, tenant });
    setAiHistory(h => [...h, { role: "user", text: q }, { role: "ai", text: answer }]);
    setAiInput("");
  };

  const QUICK_PROMPTS = [
    "What is my profit?",
    "Who hasn't paid?",
    "How many clients do I have?",
    "Show my GST collected",
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

      {/* Business Health Score + AI Assistant (side by side on large) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Health Score */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Activity className={`h-4 w-4 text-${healthColor}-400`} />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">Business Health Score</h3>
          </div>

          <div className="flex items-center gap-5">
            {/* Score circle */}
            <div className="relative shrink-0 w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none"
                  stroke={healthScore >= 75 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : healthScore >= 25 ? "#f97316" : "#ef4444"}
                  strokeWidth="3" strokeDasharray={`${healthScore} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black text-${healthColor}-400`}>{healthScore}</span>
                <span className="text-[9px] text-slate-500 font-mono">/100</span>
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div>
                <span className={`text-sm font-extrabold text-${healthColor}-400`}>{healthLabel}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Composite across revenue, clients, invoices & operations</p>
              </div>
              <div className="space-y-1.5">
                {healthScores.map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[9px] text-slate-400 font-mono">{s.label}</span>
                      <span className="text-[9px] text-slate-500">{s.score}/{s.max}</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full">
                      <div className={`h-1 rounded-full bg-${s.score === s.max ? "emerald" : s.score > s.max / 2 ? "indigo" : "amber"}-500`}
                        style={{ width: `${(s.score / s.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tip */}
          {healthScores.find(s => s.score < s.max) && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300">
              💡 {healthScores.find(s => s.score < s.max)?.tip}
            </div>
          )}
        </div>

        {/* AI Business Assistant */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "280px" }}>
          <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-2 shrink-0">
            <Brain className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono">AI Business Assistant</h3>
            <span className="ml-auto text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">Live</span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-48">
            {aiHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-200"
                }`}>
                  {msg.text.replace(/\*\*(.*?)\*\*/g, "$1")}
                </div>
              </div>
            ))}
          </div>

          {/* Quick prompts */}
          <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => { setAiInput(p); }}
                className="text-[9px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-full cursor-pointer transition-all">
                {p}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 flex gap-2 shrink-0">
            <input value={aiInput} onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAiSend()}
              placeholder="Ask anything about your business..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors" />
            <button onClick={handleAiSend}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer transition-all">
              <Send className="h-3.5 w-3.5" />
            </button>
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
        {isSalon && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-pink-400" /> Today's Schedule
              </h3>
              <button onClick={() => onNavigate("appointments")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All &rsaquo;</button>
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
              <button onClick={() => onNavigate("projects")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All &rsaquo;</button>
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
            <button onClick={() => onNavigate("invoicing")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All &rsaquo;</button>
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
            <button onClick={() => onNavigate("finance")} className="text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer">View All &rsaquo;</button>
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
