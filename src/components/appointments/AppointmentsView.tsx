import React, { useState } from "react";
import { Calendar, Plus, X, Clock, User, Edit3, Trash2, CheckCircle } from "lucide-react";
import { Appointment, AppointmentStatus, Client, ServiceItem, StaffMember, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  clients: Client[];
  services: ServiceItem[];
  staff: StaffMember[];
  tenantId: string;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  confirmed:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  completed:   "bg-slate-700/50 text-slate-400 border-slate-700",
  cancelled:   "bg-red-500/10 text-red-400 border-red-500/20",
  no_show:     "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function AppointmentsView({ appointments, setAppointments, clients, services, staff, tenantId }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [form, setForm] = useState({ clientId: "", staffId: "", serviceIds: [] as string[], date: today, time: "10:00", notes: "" });

  const calcTotal = (svcIds: string[]) => {
    const subtotal = svcIds.reduce((s, id) => {
      const svc = services.find(x => x.id === id);
      return s + (svc?.price || 0);
    }, 0);
    const tax = svcIds.reduce((s, id) => {
      const svc = services.find(x => x.id === id);
      return s + (svc?.taxable ? (svc.price * svc.taxPct / 100) : 0);
    }, 0);
    return subtotal + tax;
  };

  const calcDuration = (svcIds: string[]) =>
    svcIds.reduce((s, id) => s + (services.find(x => x.id === id)?.duration || 0), 0);

  const filtered = appointments
    .filter(a => (!dateFilter || a.date === dateFilter) && (statusFilter === "all" || a.status === statusFilter))
    .sort((a, b) => a.time.localeCompare(b.time));

  const openNew = () => {
    setEditing(null);
    setForm({ clientId: "", staffId: "", serviceIds: [], date: today, time: "10:00", notes: "" });
    setShowModal(true);
  };

  const openEdit = (a: Appointment) => {
    setEditing(a);
    setForm({ clientId: a.clientId, staffId: a.staffId, serviceIds: [...a.serviceIds], date: a.date, time: a.time, notes: a.notes });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId || !form.serviceIds.length) { toast.error("Select a client and at least one service"); return; }
    const total = calcTotal(form.serviceIds);
    const duration = calcDuration(form.serviceIds);
    if (editing) {
      setAppointments(prev => prev.map(a => a.id === editing.id ? { ...a, ...form, totalAmount: total, durationMins: duration } : a));
      toast.success("Appointment Updated");
    } else {
      setAppointments(prev => [...prev, {
        id: `apt-${Date.now()}`, tenantId, ...form,
        status: "scheduled", totalAmount: total, durationMins: duration, createdAt: new Date().toISOString().split("T")[0],
      }]);
      toast.success("Appointment Booked");
    }
    setShowModal(false);
  };

  const updateStatus = (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    toast.success("Status Updated", status);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this appointment?")) return;
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.warning("Appointment Removed");
  };

  const toggleService = (id: string) =>
    setForm(f => ({ ...f, serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(x => x !== id) : [...f.serviceIds, id] }));

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Calendar className="h-5 w-5 text-pink-400" /> Appointments</h2>
          <p className="text-xs text-slate-500 mt-0.5">{appointments.filter(a => a.date === today).length} today · {appointments.filter(a => a.status === "scheduled").length} scheduled</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> Book Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="text-[10px] text-slate-500 uppercase font-bold mr-2">Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-1">
          {["all", "scheduled", "confirmed", "in_progress", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer border transition-all ${statusFilter === s ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <button onClick={() => setDateFilter("")} className="text-[10px] text-slate-500 hover:text-indigo-400 cursor-pointer underline">All dates</button>
      </div>

      {/* List */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">No appointments for this filter.</div>
      )}
      <div className="space-y-3">
        {filtered.map(a => {
          const client = clients.find(c => c.id === a.clientId);
          const staffMember = staff.find(s => s.id === a.staffId);
          const svcNames = a.serviceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean);
          return (
            <div key={a.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="bg-pink-500/10 rounded-lg p-2.5 shrink-0">
                    <Clock className="h-4 w-4 text-pink-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-white">{client?.name || "Unknown Client"}</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[a.status]}`}>{a.status.replace("_", " ")}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{a.date} at {a.time} · {a.durationMins} min</p>
                    <p className="text-xs text-slate-500 mt-0.5">{svcNames.join(" + ")}</p>
                    {staffMember && <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1"><User className="h-3 w-3" />{staffMember.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatINR(a.totalAmount)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                <div className="flex gap-1 flex-wrap">
                  {(["scheduled","confirmed","in_progress","completed","cancelled","no_show"] as AppointmentStatus[]).map(s => (
                    <button key={s} onClick={() => updateStatus(a.id, s)}
                      className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer border transition-all ${a.status === s ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-500 hover:text-white"}`}>
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(a)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{editing ? "Edit Appointment" : "Book Appointment"}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Client *</label>
                <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">— Select Client —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Staff Member</label>
                <select value={form.staffId} onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">— Any Available —</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Time *</label>
                  <input type="time" required value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Services * (select multiple)</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-700 rounded p-2">
                  {services.filter(s => s.active).map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-900 rounded p-1">
                      <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} className="accent-indigo-500" />
                      <span className="text-slate-300">{s.name}</span>
                      <span className="text-slate-500 font-mono ml-auto">{formatINR(s.price)}</span>
                    </label>
                  ))}
                </div>
                {form.serviceIds.length > 0 && (
                  <p className="text-xs text-emerald-400 font-mono mt-1">
                    Total: {formatINR(calcTotal(form.serviceIds))} · {calcDuration(form.serviceIds)} min
                  </p>
                )}
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-pink-600 hover:bg-pink-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
