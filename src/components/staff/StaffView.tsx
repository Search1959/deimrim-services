import React, { useState } from "react";
import { Users, Plus, X, Edit3, Trash2, Calendar, Award } from "lucide-react";
import { StaffMember, AttendanceRecord, AttendanceStatus, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  staff: StaffMember[];
  setStaff: React.Dispatch<React.SetStateAction<StaffMember[]>>;
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  tenantId: string;
}

const ATT_COLORS: Record<AttendanceStatus, string> = {
  present:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  absent:   "bg-red-500/10 text-red-400 border-red-500/20",
  half_day: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  leave:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const BLANK: Omit<StaffMember, "id" | "tenantId"> = {
  code: "", name: "", email: "", phone: "", role: "", salary: 0, commissionPct: 0, joiningDate: "", active: true,
};

export default function StaffView({ staff, setStaff, attendance, setAttendance, tenantId }: Props) {
  const [tab, setTab] = useState<"staff" | "attendance">("staff");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const today = new Date().toISOString().split("T")[0];
  const [attDate, setAttDate] = useState(today);

  const openNew = () => { setEditing(null); setForm({ ...BLANK, code: `STF-${String(staff.length + 1).padStart(3, "0")}`, joiningDate: today }); setShowModal(true); };
  const openEdit = (s: StaffMember) => { setEditing(s); setForm({ code: s.code, name: s.name, email: s.email, phone: s.phone, role: s.role, salary: s.salary, commissionPct: s.commissionPct, joiningDate: s.joiningDate, active: s.active }); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      toast.success("Staff Updated", form.name);
    } else {
      setStaff(prev => [...prev, { ...form, id: `st-${Date.now()}`, tenantId }]);
      toast.success("Staff Added", form.name);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    setStaff(prev => prev.filter(s => s.id !== id));
    toast.warning("Staff Removed", name);
  };

  const markAttendance = (staffId: string, status: AttendanceStatus) => {
    const existing = attendance.find(a => a.staffId === staffId && a.date === attDate);
    if (existing) {
      setAttendance(prev => prev.map(a => a.id === existing.id ? { ...a, status } : a));
    } else {
      setAttendance(prev => [...prev, { id: `att-${Date.now()}`, tenantId, staffId, date: attDate, status }]);
    }
  };

  const getStatus = (staffId: string, date: string) =>
    attendance.find(a => a.staffId === staffId && a.date === date)?.status;

  // Monthly stats
  const thisMonth = today.slice(0, 7);
  const monthAttendance = attendance.filter(a => a.date.startsWith(thisMonth));

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Users className="h-5 w-5 text-indigo-400" /> Staff Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">{staff.filter(s => s.active).length} active staff members</p>
        </div>
        {tab === "staff" && (
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
            <Plus className="h-4 w-4" /> Add Staff
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg border border-slate-800 overflow-hidden w-fit">
        {(["staff","attendance"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-bold cursor-pointer transition-all capitalize ${tab === t ? "bg-indigo-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "staff" && (
        <>
          {staff.length === 0 && <p className="text-center py-12 text-slate-500 text-xs">No staff added yet.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staff.map(s => {
              const presentDays = monthAttendance.filter(a => a.staffId === s.id && a.status === "present").length;
              const halfDays = monthAttendance.filter(a => a.staffId === s.id && a.status === "half_day").length;
              return (
                <div key={s.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-10 w-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black shrink-0">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.code} · {s.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950/50 rounded-lg py-2">
                      <p className="text-[10px] text-slate-500 font-mono">SALARY</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">{formatINR(s.salary)}</p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg py-2">
                      <p className="text-[10px] text-slate-500 font-mono">COMMISSION</p>
                      <p className="text-xs font-bold text-indigo-400">{s.commissionPct}%</p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg py-2">
                      <p className="text-[10px] text-slate-500 font-mono">PRESENT</p>
                      <p className="text-xs font-bold text-amber-400">{presentDays + halfDays * 0.5}d</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>Joined: {s.joiningDate}</span>
                    <span className={`px-1.5 py-0.5 rounded font-bold uppercase border ${s.active ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" : "text-slate-500 border-slate-700 bg-slate-700/30"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "attendance" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Date</label>
            <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-slate-800/60">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-5 py-3 text-left">Staff</th>
                  <th className="px-5 py-3 text-left">Role</th>
                  <th className="px-5 py-3 text-center">Mark Attendance</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {staff.filter(s => s.active).map(s => {
                  const status = getStatus(s.id, attDate);
                  return (
                    <tr key={s.id} className="hover:bg-slate-900/20">
                      <td className="px-5 py-3 font-bold text-white">{s.name}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs">{s.role}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-center gap-1.5 flex-wrap">
                          {(["present","half_day","absent","leave"] as AttendanceStatus[]).map(st => (
                            <button key={st} onClick={() => markAttendance(s.id, st)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold cursor-pointer border transition-all ${status === st ? ATT_COLORS[st] : "bg-slate-900 border-slate-700 text-slate-500 hover:text-white"}`}>
                              {st.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {status
                          ? <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${ATT_COLORS[status]}`}>{status.replace("_"," ")}</span>
                          : <span className="text-slate-600 text-[10px]">—</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{editing ? "Edit Staff" : "Add Staff"}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[["Name *","name","text"],["Code","code","text"],["Email","email","email"],["Phone","phone","tel"],["Role / Designation","role","text"],["Joining Date","joiningDate","date"]].map(([l,k,t]) => (
                <div key={k as string} className={l === "Name *" || l === "Role / Designation" ? "col-span-2" : ""}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">{l as string}</label>
                  <input type={t as string} required={k === "name"} value={(form as any)[k as string]} onChange={e => setForm(f => ({ ...f, [k as string]: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Monthly Salary (₹)</label>
                <input type="number" min="0" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Commission %</label>
                <input type="number" min="0" max="100" step="0.5" value={form.commissionPct} onChange={e => setForm(f => ({ ...f, commissionPct: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
