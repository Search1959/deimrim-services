import React, { useState } from "react";
import { FileText, Plus, X, Eye, Printer, Check, Trash2, DollarSign } from "lucide-react";
import { Invoice, InvoiceStatus, InvoiceLineItem, Client, ServiceItem, Project, Payment, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  clients: Client[];
  services: ServiceItem[];
  projects: Project[];
  tenantId: string;
  onFinanceTx?: (type: "income", amount: number, desc: string, ref: string) => void;
}

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft:     "bg-slate-700/50 text-slate-400 border-slate-700",
  sent:      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  paid:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  overdue:   "bg-red-500/10 text-red-400 border-red-500/20",
  cancelled: "bg-slate-700/50 text-slate-500 border-slate-700",
};

export default function InvoicingView({ invoices, setInvoices, payments, setPayments, clients, services, projects, tenantId, onFinanceTx }: Props) {
  const [tab, setTab] = useState<"invoice" | "quote">("invoice");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [viewInv, setViewInv] = useState<Invoice | null>(null);
  const [showPayModal, setShowPayModal] = useState<Invoice | null>(null);
  const [payForm, setPayForm] = useState({ method: "bank" as Payment["method"], reference: "", notes: "" });

  const [form, setForm] = useState({
    type: "invoice" as "invoice" | "quote",
    clientId: "", projectId: "", issueDate: new Date().toISOString().split("T")[0],
    dueDate: "", notes: "", lineItems: [] as Omit<InvoiceLineItem, "id">[],
  });
  const [lineForm, setLineForm] = useState({ serviceId: "", description: "", qty: 1, rate: 0, taxPct: 18 });

  const calcLine = (l: typeof lineForm) => ({ total: l.qty * l.rate * (1 + l.taxPct / 100) });

  const addLine = () => {
    if (!lineForm.description) { toast.error("Enter a description"); return; }
    setForm(f => ({ ...f, lineItems: [...f.lineItems, { ...lineForm, total: lineForm.qty * lineForm.rate * (1 + lineForm.taxPct / 100) }] }));
    setLineForm({ serviceId: "", description: "", qty: 1, rate: 0, taxPct: 18 });
  };

  const pickService = (id: string) => {
    const s = services.find(x => x.id === id);
    if (!s) return;
    setLineForm(f => ({ ...f, serviceId: id, description: s.name, rate: s.price, taxPct: s.taxPct }));
  };

  const calcTotals = (items: typeof form.lineItems) => {
    const subtotal = items.reduce((s, l) => s + l.qty * l.rate, 0);
    const taxTotal = items.reduce((s, l) => s + l.qty * l.rate * (l.taxPct / 100), 0);
    return { subtotal, taxTotal, grandTotal: subtotal + taxTotal };
  };

  const filtered = invoices.filter(i => i.type === tab && (statusFilter === "all" || i.status === statusFilter));

  const getNextNum = () => {
    const prefix = tab === "invoice" ? "INV" : "QUO";
    const max = invoices.filter(i => i.type === tab && i.number.startsWith(prefix)).length + 1;
    return `${prefix}-${new Date().getFullYear()}-${String(max).padStart(3, "0")}`;
  };

  const openNew = () => {
    setForm({ type: tab, clientId: "", projectId: "", issueDate: new Date().toISOString().split("T")[0], dueDate: "", notes: "", lineItems: [] });
    setLineForm({ serviceId: "", description: "", qty: 1, rate: 0, taxPct: 18 });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { toast.error("Select a client"); return; }
    if (!form.lineItems.length) { toast.error("Add at least one line item"); return; }
    const { subtotal, taxTotal, grandTotal } = calcTotals(form.lineItems);
    const items: InvoiceLineItem[] = form.lineItems.map((l, i) => ({ ...l, id: `li-${Date.now()}-${i}` }));
    const inv: Invoice = {
      ...form, id: `inv-${Date.now()}`, tenantId, number: getNextNum(),
      lineItems: items, subtotal, taxTotal, grandTotal, status: "draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setInvoices(prev => [inv, ...prev]);
    toast.success(tab === "invoice" ? "Invoice Created" : "Quote Created", inv.number);
    setShowModal(false);
  };

  const updateStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    toast.success("Status Updated", status);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    const pay: Payment = {
      id: `pay-${Date.now()}`, tenantId, invoiceId: showPayModal.id,
      clientId: showPayModal.clientId, amount: showPayModal.grandTotal,
      method: payForm.method, date: new Date().toISOString().split("T")[0],
      reference: payForm.reference, notes: payForm.notes,
    };
    setPayments(prev => [pay, ...prev]);
    updateStatus(showPayModal.id, "paid");
    if (onFinanceTx) {
      const client = clients.find(c => c.id === showPayModal.clientId);
      onFinanceTx("income", showPayModal.grandTotal, `Payment received - ${showPayModal.number} from ${client?.name}`, showPayModal.id);
    }
    toast.success("Payment Recorded", formatINR(showPayModal.grandTotal));
    setShowPayModal(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    setInvoices(prev => prev.filter(i => i.id !== id));
    toast.warning("Invoice Deleted");
  };

  return (
    <div className="space-y-5 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><FileText className="h-5 w-5 text-amber-400" /> Invoicing</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.grandTotal, 0) > 0
              ? `${formatINR(invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.grandTotal, 0))} collected`
              : "Create quotes & invoices for your clients"}
          </p>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> {tab === "invoice" ? "New Invoice" : "New Quote"}
        </button>
      </div>

      {/* Tabs + Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex rounded-lg border border-slate-800 overflow-hidden">
          {(["invoice", "quote"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 text-xs font-bold cursor-pointer transition-all ${tab === t ? "bg-amber-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}>
              {t === "invoice" ? "Invoices" : "Quotes"}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {["all","draft","sent","paid","overdue"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded text-[10px] font-bold cursor-pointer border transition-all ${statusFilter === s ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 && <p className="text-center py-12 text-slate-500 text-xs">No {tab}s found.</p>}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm divide-y divide-slate-800/60">
          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold font-mono">
            <tr>
              <th className="px-5 py-3 text-left">Number</th>
              <th className="px-5 py-3 text-left">Client</th>
              <th className="px-5 py-3 text-left">Date</th>
              <th className="px-5 py-3 text-left">Amount</th>
              <th className="px-5 py-3 text-left">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40 text-slate-300">
            {filtered.map(inv => {
              const client = clients.find(c => c.id === inv.clientId);
              return (
                <tr key={inv.id} className="hover:bg-slate-900/20">
                  <td className="px-5 py-3 font-mono font-bold text-white text-xs">{inv.number}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">{client?.name || "—"}</p>
                    <p className="text-[10px] text-slate-500">{inv.issueDate}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">Due: {inv.dueDate || "—"}</td>
                  <td className="px-5 py-3 font-mono font-bold text-emerald-400">{formatINR(inv.grandTotal)}</td>
                  <td className="px-5 py-3">
                    <select value={inv.status} onChange={e => updateStatus(inv.id, e.target.value as InvoiceStatus)}
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border cursor-pointer bg-transparent ${STATUS_COLORS[inv.status]}`}>
                      {(["draft","sent","paid","overdue","cancelled"] as InvoiceStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setViewInv(inv)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer" title="View"><Eye className="h-3.5 w-3.5" /></button>
                      {inv.status !== "paid" && (
                        <button onClick={() => { setShowPayModal(inv); setPayForm({ method: "bank", reference: "", notes: "" }); }}
                          className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer border border-emerald-500/20" title="Record Payment">
                          <DollarSign className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewInv && (() => {
        const client = clients.find(c => c.id === viewInv.clientId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-sm text-amber-400 font-mono">{viewInv.number}</span>
                <button onClick={() => setViewInv(null)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
              </div>
              <div className="bg-white text-slate-900 rounded-xl p-6 space-y-4">
                <div className="flex justify-between border-b pb-3">
                  <div><h2 className="text-lg font-black">DEINRIM Services</h2><p className="text-xs text-slate-500">deinrim360.in/services</p></div>
                  <div className="text-right">
                    <h3 className="font-extrabold text-amber-600">{viewInv.type.toUpperCase()}</h3>
                    <p className="text-xs font-mono font-bold">{viewInv.number}</p>
                    <p className="text-xs text-slate-500">Issued: {viewInv.issueDate}</p>
                  </div>
                </div>
                <div className="text-sm"><p className="font-bold">{client?.name}</p><p className="text-slate-500">{client?.email} · {client?.phone}</p></div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b text-slate-600 font-bold"><th className="text-left py-1">Item</th><th className="text-right py-1">Qty</th><th className="text-right py-1">Rate</th><th className="text-right py-1">GST</th><th className="text-right py-1">Total</th></tr></thead>
                  <tbody>
                    {viewInv.lineItems.map(l => (
                      <tr key={l.id} className="border-b border-slate-100"><td className="py-1.5">{l.description}</td><td className="text-right">{l.qty}</td><td className="text-right font-mono">{formatINR(l.rate)}</td><td className="text-right">{l.taxPct}%</td><td className="text-right font-mono font-bold">{formatINR(l.total)}</td></tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-mono">{formatINR(viewInv.subtotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>GST</span><span className="font-mono">{formatINR(viewInv.taxTotal)}</span></div>
                  <div className="flex justify-between font-black text-base border-t pt-2"><span>Total</span><span className="font-mono text-indigo-700">{formatINR(viewInv.grandTotal)}</span></div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 cursor-pointer"><Printer className="h-4 w-4" /> Print</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRecordPayment} className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Record Payment</h3>
              <button type="button" onClick={() => setShowPayModal(null)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-black text-emerald-400 font-mono">{formatINR(showPayModal.grandTotal)}</p>
              <p className="text-xs text-slate-400">{showPayModal.number}</p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Payment Method</label>
                <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value as any }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                  <option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank Transfer</option><option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Reference / UTR</label>
                <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowPayModal(null)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Confirm Payment</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">New {tab}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Client *</label>
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                    <option value="">— Select Client —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              {/* Line Items */}
              <div>
                <label className="block text-slate-400 mb-2 font-bold uppercase text-[10px]">Line Items</label>
                <div className="space-y-1 mb-2">
                  {form.lineItems.map((l, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-2.5 py-1.5">
                      <span className="text-slate-300">{l.description}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-mono text-[10px]">{l.qty} × {formatINR(l.rate)}</span>
                        <span className="text-emerald-400 font-mono text-[10px]">{formatINR(l.total)}</span>
                        <button type="button" onClick={() => setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, j) => j !== i) }))} className="text-red-400 cursor-pointer">×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 space-y-2">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[10px]">Pick from catalogue (optional)</label>
                    <select value={lineForm.serviceId} onChange={e => pickService(e.target.value)}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500">
                      <option value="">— Or type below —</option>
                      {services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} ({formatINR(s.price)})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <input placeholder="Description *" value={lineForm.description} onChange={e => setLineForm(f => ({ ...f, description: e.target.value }))}
                      className="col-span-4 rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                    <input type="number" min="1" placeholder="Qty" value={lineForm.qty} onChange={e => setLineForm(f => ({ ...f, qty: parseInt(e.target.value) || 1 }))}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                    <input type="number" min="0" placeholder="Rate ₹" value={lineForm.rate} onChange={e => setLineForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                    <input type="number" min="0" max="100" placeholder="GST%" value={lineForm.taxPct} onChange={e => setLineForm(f => ({ ...f, taxPct: parseFloat(e.target.value) || 0 }))}
                      className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-white focus:outline-none focus:border-indigo-500" />
                    <button type="button" onClick={addLine} className="rounded bg-amber-600 hover:bg-amber-500 text-white font-bold cursor-pointer">+ Add</button>
                  </div>
                </div>
                {form.lineItems.length > 0 && (
                  <div className="mt-2 text-right text-xs font-mono text-emerald-400 font-bold">
                    Grand Total: {formatINR(calcTotals(form.lineItems).grandTotal)}
                  </div>
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
              <button type="submit" className="rounded bg-amber-600 hover:bg-amber-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Create {tab}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
