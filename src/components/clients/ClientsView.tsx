import React, { useState } from "react";
import { Users, Plus, X, Search, Edit3, Phone, Mail, Tag, Trash2, Upload, Download } from "lucide-react";
import { Client, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  tenantId: string;
}

const BLANK: Omit<Client, "id" | "tenantId" | "createdAt" | "totalSpend"> = {
  code: "", name: "", email: "", phone: "", address: "", type: "individual", tags: [], notes: "",
};

export default function ClientsView({ clients, setClients, tenantId }: Props) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [tagInput, setTagInput] = useState("");

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = clients.map(c => ({
      "Client Code":  c.code,
      "Client Name":  c.name,
      "Type":         c.type,
      "Email":        c.email,
      "Phone":        c.phone,
      "Address":      c.address,
      "Tags":         (c.tags || []).join(", "),
      "Notes":        c.notes || "",
      "Total Spend":  c.totalSpend || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "Clients_Export.xlsx");
    toast.success("Exported", `${rows.length} clients downloaded as Excel`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const XLSX = await import("xlsx");
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let added = 0;
    rows.forEach(row => {
      const name = row["Client Name"] || row["name"] || "";
      if (!name) return;
      const tagsRaw = row["Tags"] || row["tags"] || "";
      const newClient: Client = {
        id:         `clt-${Date.now()}-${added}`,
        tenantId,
        code:       row["Client Code"] || row["code"] || `CLT-${String(clients.length + added + 1).padStart(3, "0")}`,
        name,
        type:       (row["Type"] || row["type"] || "business") as Client["type"],
        email:      row["Email"] || row["email"] || "",
        phone:      row["Phone"] || row["phone"] || "",
        address:    row["Address"] || row["address"] || "",
        tags:       tagsRaw ? tagsRaw.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        notes:      row["Notes"] || row["notes"] || "",
        totalSpend: Number(row["Total Spend"] || 0),
        createdAt:  new Date().toISOString().slice(0, 10),
      };
      setClients(prev => [newClient, ...prev]);
      added++;
    });
    toast.success("Import Complete", `${added} clients added`);
    e.target.value = "";
  };

  const openNew = () => {
    const nextCode = `CLT-${String(clients.length + 1).padStart(3, "0")}`;
    setEditing(null);
    setForm({ ...BLANK, code: nextCode });
    setTagInput("");
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ code: c.code, name: c.name, email: c.email, phone: c.phone, address: c.address, type: c.type, tags: [...c.tags], notes: c.notes });
    setTagInput("");
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setClients(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
      toast.success("Client Updated", form.name);
    } else {
      setClients(prev => [...prev, { ...form, id: `cl-${Date.now()}`, tenantId, createdAt: new Date().toISOString().split("T")[0], totalSpend: 0 }]);
      toast.success("Client Added", form.name);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"?`)) return;
    setClients(prev => prev.filter(c => c.id !== id));
    toast.warning("Client Removed", name);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput("");
  };

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><Users className="h-5 w-5 text-indigo-400" /> Clients</h2>
          <p className="text-xs text-slate-500 mt-0.5">{clients.length} clients in your CRM</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="pl-8 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 w-48" />
          </div>
          <button onClick={handleExport} className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-300 cursor-pointer transition-all">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <label className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-300 cursor-pointer transition-all">
            <Upload className="h-3.5 w-3.5" /> Import
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
            <Plus className="h-4 w-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">
          {search ? "No clients match your search." : "No clients yet. Add your first client."}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-sm shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{c.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{c.code}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1 rounded hover:bg-slate-800 text-slate-400 cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => handleDelete(c.id, c.name)} className="p-1 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" />{c.email || "-"}</div>
              <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" />{c.phone || "-"}</div>
            </div>

            {c.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {c.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Tag className="h-2.5 w-2.5" />{t}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-600 uppercase font-bold">{c.type}</span>
              <span className="text-xs font-bold text-emerald-400 font-mono">{formatINR(c.totalSpend)} spent</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">{editing ? "Edit Client" : "Add New Client"}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Client Name *", "name", "text"],
                ["Code", "code", "text"],
                ["Email", "email", "email"],
                ["Phone", "phone", "tel"],
                ["Address", "address", "text"],
              ].map(([label, key, type]) => (
                <div key={key as string} className={["name","address"].includes(key as string) ? "col-span-2" : ""}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">{label as string}</label>
                  <input type={type as string} required={key === "name"}
                    value={(form as any)[key as string]}
                    onChange={e => setForm(f => ({ ...f, [key as string]: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Tags</label>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                    placeholder="Type tag + Enter"
                    className="flex-1 rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                  <button type="button" onClick={addTag} className="px-3 rounded bg-indigo-600 text-white font-bold cursor-pointer">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {form.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {t}<button type="button" onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))} className="cursor-pointer">Ã-</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save Client</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
