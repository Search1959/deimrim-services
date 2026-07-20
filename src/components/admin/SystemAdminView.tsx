import React, { useState } from "react";
import {
  Building2, Plus, X, Users, ToggleLeft, ToggleRight, ShieldCheck,
  Edit3, Trash2, Eye, KeyRound, UserCog
} from "lucide-react";
import { Tenant, AppUser, TenantType, TENANT_TYPE_LABELS, UserRole } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  onSaveTenant: (t: Tenant, isNew: boolean) => Promise<void>;
  onDeleteTenant: (id: string) => Promise<void>;
  onSaveUser: (u: AppUser, isNew: boolean) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
}

const BLANK_TENANT: Omit<Tenant, "id" | "createdAt"> = {
  name: "", type: "salon", ownerName: "", email: "", phone: "", address: "", active: true, plan: "free",
};

const typeColor: Record<TenantType, string> = {
  salon:   "bg-pink-500/10 text-pink-400 border-pink-500/20",
  agency:  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  general: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function SystemAdminView({ tenants, setTenants, users, setUsers, onSaveTenant, onDeleteTenant, onSaveUser, onDeleteUser }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ ...BLANK_TENANT });
  const [newPassword, setNewPassword] = useState("demo123");
  const [showCreatedInfo, setShowCreatedInfo] = useState<{ email: string; password: string } | null>(null);

  // View tenant detail
  const [viewTenant, setViewTenant] = useState<Tenant | null>(null);

  // Edit user modal
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState({ name: "", password: "" });

  // â"€â"€ Tenant CRUD â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const openNew = () => { setEditing(null); setForm({ ...BLANK_TENANT }); setNewPassword("demo123"); setShowModal(true); };
  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({ name: t.name, type: t.type, ownerName: t.ownerName, email: t.email, phone: t.phone, address: t.address, active: t.active, plan: t.plan });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const updated = { ...editing, ...form };
      setTenants(prev => prev.map(t => t.id === editing.id ? updated : t));
      await onSaveTenant(updated, false);
      toast.success("Tenant Updated", form.name);
      setShowModal(false);
    } else {
      const newTenant: Tenant = { ...form, id: `t-${Date.now()}`, createdAt: new Date().toISOString().split("T")[0] };
      const newUser: AppUser = {
        id: `u-${Date.now()}`, tenantId: newTenant.id,
        name: form.ownerName, email: form.email,
        password: newPassword || "demo123", role: UserRole.TENANT_ADMIN,
      };
      setTenants(prev => [...prev, newTenant]);
      setUsers(prev => [...prev, newUser]);
      await onSaveTenant(newTenant, true);
      await onSaveUser(newUser, true);
      setShowModal(false);
      setShowCreatedInfo({ email: form.email, password: newPassword || "demo123" });
    }
  };

  const handleDeleteTenant = async (t: Tenant) => {
    if (!confirm(`Delete "${t.name}" and all its users? This cannot be undone.`)) return;
    setTenants(prev => prev.filter(x => x.id !== t.id));
    setUsers(prev => prev.filter(u => u.tenantId !== t.id));
    await onDeleteTenant(t.id);
    toast.warning("Tenant Deleted", t.name);
  };

  const toggleActive = async (id: string) => {
    const tenant = tenants.find(t => t.id === id);
    if (!tenant) return;
    const updated = { ...tenant, active: !tenant.active };
    setTenants(prev => prev.map(t => t.id === id ? updated : t));
    await onSaveTenant(updated, false);
  };

  // â"€â"€ User CRUD â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const openEditUser = (u: AppUser) => {
    setEditUser(u);
    setUserForm({ name: u.name, password: u.password });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    const updated = { ...editUser, name: userForm.name, password: userForm.password };
    setUsers(prev => prev.map(u => u.id === editUser.id ? updated : u));
    await onSaveUser(updated, false);
    toast.success("User Updated", userForm.name);
    setEditUser(null);
  };

  const handleDeleteUser = async (u: AppUser) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})?`)) return;
    setUsers(prev => prev.filter(x => x.id !== u.id));
    await onDeleteUser(u.id);
    toast.warning("User Deleted", u.name);
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
          { label: "Total Tenants",  value: tenants.length,                                    color: "indigo" },
          { label: "Active",         value: tenants.filter(t => t.active).length,               color: "emerald" },
          { label: "Salon / Clinic", value: tenants.filter(t => t.type === "salon").length,     color: "pink" },
          { label: "Agency / Studio",value: tenants.filter(t => t.type === "agency").length,    color: "purple" },
        ].map(s => (
          <div key={s.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">{s.label}</p>
            <p className={`text-2xl font-black text-${s.color}-400 mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* â"€â"€ Tenant Table â"€â"€ */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">All Tenants</h3>
          <span className="text-[10px] text-slate-600 font-mono">{tenants.length} tenant{tenants.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-800/60">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-5 py-3 text-left">Business</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Owner</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Users</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {tenants.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-500 text-xs">No tenants yet. Create the first one.</td></tr>
              )}
              {tenants.map(t => {
                const userCount = users.filter(u => u.tenantId === t.id).length;
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
                        <Users className="h-3 w-3" /> {userCount}
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => setViewTenant(t)}
                          className="flex items-center gap-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 px-2 py-1.5 text-[10px] font-bold cursor-pointer"
                          title="View Details">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button onClick={() => openEdit(t)}
                          className="flex items-center gap-1 rounded bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-indigo-300 px-2 py-1.5 text-[10px] font-bold cursor-pointer"
                          title="Edit">
                          <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDeleteTenant(t)}
                          className="flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-2 py-1.5 text-[10px] font-bold cursor-pointer"
                          title="Delete">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* â"€â"€ Users Table â"€â"€ */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">All Platform Users</h3>
          <span className="text-[10px] text-slate-600 font-mono">{users.length} user{users.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-800/60">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase font-bold font-mono">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Tenant</th>
                <th className="px-5 py-3 text-right">Actions</th>
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
                  <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                    {u.tenantId === "SYSTEM" ? "Platform" : tenants.find(t => t.id === u.tenantId)?.name || u.tenantId}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEditUser(u)}
                        className="flex items-center gap-1 rounded bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/40 text-indigo-300 px-2 py-1.5 text-[10px] font-bold cursor-pointer">
                        <KeyRound className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => handleDeleteUser(u)}
                        className="flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-2 py-1.5 text-[10px] font-bold cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* â"€â"€ View Tenant Modal â"€â"€ */}
      {viewTenant && (() => {
        const tenantUsers = users.filter(u => u.tenantId === viewTenant.id);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl animate-scaleUp overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                    {viewTenant.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{viewTenant.name}</h3>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${typeColor[viewTenant.type]}`}>{viewTenant.type}</span>
                  </div>
                </div>
                <button onClick={() => setViewTenant(null)} className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {[
                    ["Owner",   viewTenant.ownerName],
                    ["Email",   viewTenant.email],
                    ["Phone",   viewTenant.phone],
                    ["Address", viewTenant.address],
                    ["Plan",    viewTenant.plan?.toUpperCase() || "FREE"],
                    ["Created", viewTenant.createdAt],
                    ["Status",  viewTenant.active ? "Active" : "Inactive"],
                    ["Tenant ID", viewTenant.id],
                  ].map(([label, val]) => (
                    <div key={label} className={label === "Tenant ID" || label === "Address" ? "col-span-2" : ""}>
                      <p className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-wider mb-0.5">{label}</p>
                      <p className="text-slate-200 font-semibold">{val || "-"}</p>
                    </div>
                  ))}
                </div>

                {tenantUsers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-wider mb-2">Users ({tenantUsers.length})</p>
                    <div className="space-y-1.5">
                      {tenantUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-500">{u.email}</p>
                          </div>
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                            u.role === UserRole.TENANT_ADMIN ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-slate-700/50 text-slate-400 border-slate-700"
                          }`}>{u.role.replace("_", " ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button onClick={() => { setViewTenant(null); openEdit(viewTenant); }}
                    className="flex items-center gap-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">
                    <Edit3 className="h-3.5 w-3.5" /> Edit Tenant
                  </button>
                  <button onClick={() => setViewTenant(null)}
                    className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* â"€â"€ Edit User Modal â"€â"€ */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveUser} className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <UserCog className="h-4 w-4 text-indigo-400" /> Edit User
              </h3>
              <button type="button" onClick={() => setEditUser(null)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400">
              <span className="font-bold text-slate-200">{editUser.email}</span>
              <span className="ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{editUser.role.replace("_"," ")}</span>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Display Name</label>
                <input required value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Password</label>
                <input required value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setEditUser(null)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* â"€â"€ Tenant Create/Edit Modal â"€â"€ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                {editing ? "Edit Tenant" : "Create New Tenant"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Business Name *", "name",      "text",  "Glamour Studio"],
                ["Owner Name *",    "ownerName",  "text",  "Priya Sharma"],
                ["Email *",         "email",      "email", "owner@business.in"],
                ["Phone",           "phone",      "tel",   "9876543210"],
                ["Address",         "address",    "text",  "City, State"],
              ].map(([label, key, type, ph]) => (
                <div key={key as string} className={key === "address" ? "col-span-2" : ""}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">{label as string}</label>
                  <input
                    type={type as string} placeholder={ph as string}
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
              <div className="space-y-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px] tracking-wider">Login Password *</label>
                  <input type="text" required placeholder="Set a password"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
                  />
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-[11px] text-indigo-300">
                  A Tenant Admin login will be created using the email and password above.
                </div>
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

      {/* â"€â"€ Created credentials popup â"€â"€ */}
      {showCreatedInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 text-center">
            <div className="text-4xl text-emerald-400">✓</div>
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Tenant Created!</h3>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-left space-y-2">
              <p className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-wider mb-2">Login Credentials</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Email</span>
                <span className="font-mono text-white font-bold">{showCreatedInfo.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Password</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">{showCreatedInfo.password}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">Save these credentials before closing.</p>
            <button onClick={() => setShowCreatedInfo(null)}
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-2 text-xs font-bold cursor-pointer">
              Got it - Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
