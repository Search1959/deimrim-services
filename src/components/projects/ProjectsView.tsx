import React, { useState } from "react";
import { Briefcase, Plus, X, Edit3, Trash2, CheckCircle, Circle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Project, ProjectStatus, Milestone, MilestoneStatus, Client, StaffMember, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  clients: Client[];
  staff: StaffMember[];
  tenantId: string;
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  on_hold:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed: "bg-slate-700/50 text-slate-400 border-slate-700",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

const MS_COLORS: Record<MilestoneStatus, string> = {
  pending:     "text-slate-500",
  in_progress: "text-amber-400",
  done:        "text-emerald-400",
};

export default function ProjectsView({ projects, setProjects, clients, staff, tenantId }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    code: "", title: "", clientId: "", assignedStaffIds: [] as string[],
    status: "planning" as ProjectStatus, startDate: "", endDate: "", totalValue: 0, notes: "",
    milestones: [] as Omit<Milestone, "id">[],
  });
  const [msForm, setMsForm] = useState({ title: "", dueDate: "", amount: 0 });

  const filtered = projects.filter(p => statusFilter === "all" || p.status === statusFilter);

  const toggleExpand = (id: string) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openNew = () => {
    setEditing(null);
    setForm({
      code: `PRJ-${String(projects.length + 1).padStart(3, "0")}`, title: "", clientId: "",
      assignedStaffIds: [], status: "planning", startDate: "", endDate: "", totalValue: 0, notes: "", milestones: [],
    });
    setShowModal(true);
  };

  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      code: p.code, title: p.title, clientId: p.clientId, assignedStaffIds: [...p.assignedStaffIds],
      status: p.status, startDate: p.startDate, endDate: p.endDate, totalValue: p.totalValue, notes: p.notes,
      milestones: p.milestones.map(m => ({ title: m.title, dueDate: m.dueDate, status: m.status, amount: m.amount })),
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const milestones: Milestone[] = form.milestones.map((m, i) => ({ ...m, id: `ms-${Date.now()}-${i}`, status: m.status || "pending" as MilestoneStatus }));
    if (editing) {
      setProjects(prev => prev.map(p => p.id === editing.id ? { ...p, ...form, milestones } : p));
      toast.success("Project Updated", form.title);
    } else {
      setProjects(prev => [...prev, { ...form, milestones, id: `prj-${Date.now()}`, tenantId, createdAt: new Date().toISOString().split("T")[0] }]);
      toast.success("Project Created", form.title);
    }
    setShowModal(false);
  };

  const addMilestone = () => {
    if (!msForm.title) return;
    setForm(f => ({ ...f, milestones: [...f.milestones, { title: msForm.title, dueDate: msForm.dueDate, status: "pending" as MilestoneStatus, amount: msForm.amount }] }));
    setMsForm({ title: "", dueDate: "", amount: 0 });
  };

  const updateMilestoneStatus = (projId: string, msId: string, status: MilestoneStatus) => {
    setProjects(prev => prev.map(p => p.id === projId
      ? { ...p, milestones: p.milestones.map(m => m.id === msId ? { ...m, status } : m) }
      : p
    ));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this project?")) return;
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.warning("Project Deleted");
  };

  const toggleStaff = (id: string) =>
    setForm(f => ({ ...f, assignedStaffIds: f.assignedStaffIds.includes(id) ? f.assignedStaffIds.filter(x => x !== id) : [...f.assignedStaffIds, id] }));

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Briefcase className="h-5 w-5 text-purple-400" /> Projects</h2>
          <p className="text-xs text-slate-500 mt-0.5">{projects.filter(p => p.status === "active").length} active · {projects.length} total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {["all","planning","active","on_hold","completed","cancelled"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer border transition-all ${statusFilter === s ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-center py-12 text-slate-500 text-xs">No projects found.</p>}

      <div className="space-y-4">
        {filtered.map(p => {
          const client = clients.find(c => c.id === p.clientId);
          const done = p.milestones.filter(m => m.status === "done").length;
          const pct = p.milestones.length ? Math.round((done / p.milestones.length) * 100) : 0;
          const isExpanded = expanded.includes(p.id);
          const earned = p.milestones.filter(m => m.status === "done").reduce((s, m) => s + m.amount, 0);

          return (
            <div key={p.id} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-white">{p.title}</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[p.status]}`}>{p.status.replace("_", " ")}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{p.code}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{client?.name} · {p.startDate} → {p.endDate}</p>

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1">
                        <div className="w-full bg-slate-800 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{done}/{p.milestones.length} milestones · {pct}% complete</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-emerald-400 font-mono">{formatINR(earned)}</p>
                        <p className="text-[10px] text-slate-500">of {formatINR(p.totalValue)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleExpand(p.id)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-800 p-4 bg-slate-950/30 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-2">Milestones</p>
                  {p.milestones.length === 0 && <p className="text-xs text-slate-600">No milestones defined.</p>}
                  {p.milestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => updateMilestoneStatus(p.id, m.id, m.status === "done" ? "pending" : m.status === "pending" ? "in_progress" : "done")} className="cursor-pointer">
                          {m.status === "done" ? <CheckCircle className="h-4 w-4 text-emerald-400" /> :
                           m.status === "in_progress" ? <Clock className="h-4 w-4 text-amber-400" /> :
                           <Circle className="h-4 w-4 text-slate-600" />}
                        </button>
                        <div>
                          <p className={`text-xs font-semibold ${MS_COLORS[m.status]}`}>{m.title}</p>
                          <p className="text-[10px] text-slate-600">Due: {m.dueDate}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-slate-400">{formatINR(m.amount)}</span>
                    </div>
                  ))}
                  {p.notes && <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800">📝 {p.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{editing ? "Edit Project" : "New Project"}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Project Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Code</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                    {(["planning","active","on_hold","completed","cancelled"] as ProjectStatus[]).map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Client *</label>
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                    <option value="">— Select —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Total Value (₹)</label>
                  <input type="number" min="0" value={form.totalValue} onChange={e => setForm(f => ({ ...f, totalValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Assigned Staff */}
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Assign Staff</label>
                <div className="flex flex-wrap gap-1.5 border border-slate-700 rounded p-2">
                  {staff.map(s => (
                    <button type="button" key={s.id} onClick={() => toggleStaff(s.id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer border transition-all ${form.assignedStaffIds.includes(s.id) ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-700 text-slate-400"}`}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milestones */}
              <div>
                <label className="block text-slate-400 mb-2 font-bold uppercase text-[10px]">Milestones</label>
                <div className="space-y-1 mb-2">
                  {form.milestones.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-2.5 py-1.5">
                      <span className="text-slate-300">{m.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px]">{formatINR(m.amount)} · {m.dueDate}</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, milestones: f.milestones.filter((_, j) => j !== i) }))} className="text-red-400 cursor-pointer">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Milestone title" value={msForm.title} onChange={e => setMsForm(f => ({ ...f, title: e.target.value }))}
                    className="col-span-3 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                  <input type="date" value={msForm.dueDate} onChange={e => setMsForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                  <input type="number" placeholder="Amount ₹" min="0" value={msForm.amount} onChange={e => setMsForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                  <button type="button" onClick={addMilestone} className="rounded bg-slate-700 hover:bg-slate-600 text-white px-2 py-1.5 font-bold cursor-pointer">+ Add</button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save Project</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
