import React, { useState } from "react";
import { Building2, Plus, X, Users, ToggleLeft, ToggleRight, ShieldCheck, Edit3 } from "lucide-react";
import { Tenant, AppUser, TenantType, TENANT_TYPE_LABELS, UserRole } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const BLANK_TENANT: Omit<Tenant, "id" | "createdAt"> = {
  name: "", type: "salon", ownerName: "", email: "", phone: "", address: "", active: true, plan: "free",
};

export default function SystemAdminView({ tenants, setTenants, users, setUsers }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ ...BLANK_TENANT });

  const openNew = () => { setEditing(null); setForm({ ...BLANK_TENANT }); setShowModal(true); };
  const openEdit = (t: Tenant) => { setEditing(t); setForm({ name: t.name, type: t.type, ownerName: t.ownerName, email: t.email, phone: t.phone, address: t.address, active: t.active, plan: t.plan }); setShowModal(true); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setTenants(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t));
      toast.success("Tenant Updated", form.name);
    } else {
      const newTenant: Tenant = { ...form, id: `t-${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] };
      setTenants(prev => [...prev, newTenant]);
      // auto-create admin user
      const newUser: AppUser = {
        id: `u-${Date.now()}`,
        tenantId: newTenant.id,
        name: form.ownerName,
        email: form.email,
        password: "demo123",
        role: UserRole.TENANT_ADMIN,
      };
      setUsers(prev => [...prev, newUser]);
      toast.success("Tenant Created", `${form.name} — login: ${form.email} / demo123`);
    }
    setShowModal(false);
  };

  const toggleActive = (id: string) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const typeColor: Record<TenantType, string> = {
    salon:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
    agency:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    general: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-400" /> System Administration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage all service business tenants on this platform</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> New Tenant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tenants", value: tenants.length, color: "indigo" },
          { label: "Active", value: tenants.filter(t => t.active).length, color: "emerald" },
          { label: "Salon / Clinic", value: tenants.filter(t => t.type === "salon").length, color: "pink" },
          { label: "Agency / Studio", value: tenants.filter(t => t.type === "agency").length, color: "purple" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{s.label}</p>
            <p className={`text-2xl font-black text-${s.color}-400 mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tenant Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">All Tenants</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-800/60">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Staff</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {tenants.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-500 text-xs">No tenants yet. Create the first one.</td></tr>
              )}
              {tenants.map(t => {
                const staffCount = users.filter(u => u.tenantId === t.id).length;
                return (
                  <tr key={t.id} className="hover:bg-slate-900/20 transition-all">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{t.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${typeColor[t.type]}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-300">{t.ownerName}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs">{t.email}</div>
                      <div className="text-[10px] text-slate-500">{t.phone}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Users className="h-3 w-3" /> {staffCount}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => toggleActive(t.id)} className="cursor-pointer">
                        {t.active
                          ? <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><ToggleRight className="h-4 w-4" /> Active</span>
                          : <span className="flex items-center gap-1 text-slate-500 text-xs font-bold"><ToggleLeft className="h-4 w-4" /> Inactive</span>
                        }
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => openEdit(t)} className="rounded bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 p-1.5 cursor-pointer">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">All Platform Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-800/60">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Tenant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/20">
                  <td className="px-5 py-3 font-semibold">{u.name}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      u.role === UserRole.SYSTEM_ADMIN ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      u.role === UserRole.TENANT_ADMIN ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                      "bg-slate-700/50 text-slate-400 border-slate-700"
                    }`}>{u.role.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">{u.tenantId === "SYSTEM" ? "— Platform —" : tenants.find(t => t.id === u.tenantId)?.name || u.tenantId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                {editing ? "Edit Tenant" : "Create New Tenant"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Business Name *", "name", "text", "Glamour Studio"],
                ["Owner Name *", "ownerName", "text", "Priya Sharma"],
                ["Email *", "email", "email", "owner@business.in"],
                ["Phone", "phone", "tel", "9876543210"],
                ["Address", "address", "text", "City, State"],
              ].map(([label, key, type, ph]) => (
                <div key={key as string} className={key === "address" ? "col-span-2" : ""}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">{label as string}</label>
                  <input
                    type={type as string}
                    placeholder={ph as string}
                    required={["name","ownerName","email"].includes(key as string)}
                    value={(form as any)[key as string]}
                    onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">Business Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as TenantType }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                  {(Object.entries(TENANT_TYPE_LABELS) as [TenantType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {!editing && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-[11px] text-indigo-300">
                A Tenant Admin account will be auto-created with email above and password <strong>demo123</strong>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">
                {editing ? "Save Changes" : "Create Tenant"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
