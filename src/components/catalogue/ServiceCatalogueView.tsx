import React, { useState } from "react";
import { Layers, Plus, X, Edit3, Trash2, Clock } from "lucide-react";
import { ServiceItem, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  services: ServiceItem[];
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  tenantId: string;
}

const BLANK: Omit<ServiceItem, "id" | "tenantId"> = {
  code: "", name: "", category: "", description: "", price: 0, duration: 60, taxable: true, taxPct: 18, active: true,
};

export default function ServiceCatalogueView({ services, setServices, tenantId }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState({ ...BLANK });

  const categories = [...new Set(services.map(s => s.category).filter(Boolean))];

  const openNew = () => {
    setEditing(null);
    setForm({ ...BLANK, code: `SVC-${String(services.length + 1).padStart(3, "0")}` });
    setShowModal(true);
  };

  const openEdit = (s: ServiceItem) => {
    setEditing(s);
    setForm({ code: s.code, name: s.name, category: s.category, description: s.description, price: s.price, duration: s.duration, taxable: s.taxable, taxPct: s.taxPct, active: s.active });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setServices(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
      toast.success("Service Updated", form.name);
    } else {
      setServices(prev => [...prev, { ...form, id: `svc-${Date.now()}`, tenantId }]);
      toast.success("Service Added", form.name);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    setServices(prev => prev.filter(s => s.id !== id));
    toast.warning("Service Removed", name);
  };

  const toggleActive = (id: string) =>
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));

  const grouped = categories.length > 0
    ? categories.map(cat => ({ cat, items: services.filter(s => s.category === cat) }))
    : [{ cat: "All Services", items: services }];

  const uncategorized = services.filter(s => !s.category);
  if (uncategorized.length > 0 && categories.length > 0) grouped.push({ cat: "Uncategorized", items: uncategorized });

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Layers className="h-5 w-5 text-indigo-400" /> Service Catalogue</h2>
          <p className="text-xs text-slate-500 mt-0.5">{services.length} services · {categories.length} categories</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> Add Service
        </button>
      </div>

      {services.length === 0 && <p className="text-center py-16 text-slate-500 text-xs">No services yet. Add your first service.</p>}

      {grouped.filter(g => g.items.length > 0).map(({ cat, items }) => (
        <div key={cat} className="space-y-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono px-1">{cat}</h3>
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
            <table className="min-w-full text-sm divide-y divide-slate-800/60">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold font-mono">
                <tr>
                  <th className="px-5 py-3 text-left">Service</th>
                  <th className="px-5 py-3 text-left">Price</th>
                  <th className="px-5 py-3 text-left">Duration</th>
                  <th className="px-5 py-3 text-left">Tax</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-slate-300">
                {items.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/20">
                    <td className="px-5 py-3">
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.code}</p>
                      {s.description && <p className="text-[10px] text-slate-500 mt-0.5">{s.description}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-emerald-400">{formatINR(s.price)}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {s.duration > 0 ? <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration} min</span> : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-400">
                      {s.taxable ? `${s.taxPct}% GST` : "Exempt"}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => toggleActive(s.id)} className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border cursor-pointer ${
                        s.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-700/50 text-slate-500 border-slate-700"
                      }`}>{s.active ? "Active" : "Inactive"}</button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(s.id, s.name)} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{editing ? "Edit Service" : "Add Service"}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              {[
                ["Service Name *", "name", "text"],
                ["Code", "code", "text"],
                ["Category", "category", "text"],
                ["Description", "description", "text"],
              ].map(([label, key, type]) => (
                <div key={key as string}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">{label as string}</label>
                  <input type={type as string} required={key === "name"}
                    value={(form as any)[key as string]}
                    onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Price (₹) *</label>
                  <input type="number" min="0" required value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Duration (mins)</label>
                  <input type="number" min="0" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">GST %</label>
                  <input type="number" min="0" max="100" value={form.taxPct} onChange={e => setForm(f => ({ ...f, taxPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="taxable" checked={form.taxable} onChange={e => setForm(f => ({ ...f, taxable: e.target.checked }))} className="h-4 w-4 accent-indigo-500" />
                  <label htmlFor="taxable" className="text-slate-300 text-xs font-semibold cursor-pointer">Taxable</label>
                </div>
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
