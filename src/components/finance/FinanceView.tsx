import React, { useState } from "react";
import { TrendingUp, TrendingDown, Plus, X, DollarSign } from "lucide-react";
import { FinanceTx, formatINR } from "../../types";
import { toast } from "../../utils/toast";

interface Props {
  transactions: FinanceTx[];
  setTransactions: React.Dispatch<React.SetStateAction<FinanceTx[]>>;
  tenantId: string;
}

const INCOME_CATS = ["Service Revenue", "Project Revenue", "Consultation Fee", "Retainer", "Other Income"];
const EXPENSE_CATS = ["Salary", "Supplies", "Rent", "Utilities", "Marketing", "Software", "Travel", "Miscellaneous"];

export default function FinanceView({ transactions, setTransactions, tenantId }: Props) {
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ type: "income" as "income" | "expense", category: INCOME_CATS[0], amount: 0, date: new Date().toISOString().split("T")[0], description: "", method: "bank" as FinanceTx["method"] });

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const filtered = [...transactions]
    .filter(t => typeFilter === "all" || t.type === typeFilter)
    .sort((a, b) => b.date.localeCompare(a.date));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) { toast.error("Fill all required fields"); return; }
    setTransactions(prev => [{ ...form, id: `ftx-${Date.now()}`, tenantId }, ...prev]);
    toast.success(form.type === "income" ? "Income Recorded" : "Expense Recorded", formatINR(form.amount));
    setShowModal(false);
  };

  // Category breakdown
  const incomeCats = INCOME_CATS.map(cat => ({
    cat, total: transactions.filter(t => t.type === "income" && t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter(x => x.total > 0);

  const expenseCats = EXPENSE_CATS.map(cat => ({
    cat, total: transactions.filter(t => t.type === "expense" && t.category === cat).reduce((s, t) => s + t.amount, 0),
  })).filter(x => x.total > 0);

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-400" /> Finance</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track income & expenses for your business</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer transition-all">
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: totalIncome, color: "emerald", icon: TrendingUp },
          { label: "Total Expenses", value: totalExpense, color: "red", icon: TrendingDown },
          { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "indigo" : "red", icon: DollarSign },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2.5 bg-${color}-500/10 text-${color}-400 rounded-lg shrink-0`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">{label}</p>
              <p className={`text-xl font-black text-${color}-400 font-mono`}>{formatINR(value)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Income by Category", cats: incomeCats, total: totalIncome, color: "emerald" },
          { title: "Expenses by Category", cats: expenseCats, total: totalExpense, color: "red" },
        ].map(({ title, cats, total, color }) => (
          <div key={title} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-3">{title}</h3>
            {cats.length === 0 && <p className="text-xs text-slate-600">No data</p>}
            <div className="space-y-2">
              {cats.map(({ cat, total: catTotal }) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{cat}</span>
                    <span className={`font-mono font-bold text-${color}-400`}>{formatINR(catTotal)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1">
                    <div className={`bg-${color}-500 h-1 rounded-full`} style={{ width: `${total > 0 ? (catTotal / total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Transaction List */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Transactions</h3>
          <div className="flex gap-1 ml-auto">
            {(["all","income","expense"] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer border transition-all ${typeFilter === t ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-slate-800/60">
            <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold font-mono">
              <tr>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Category</th>
                <th className="px-5 py-3 text-left">Method</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500 text-xs">No transactions found.</td></tr>}
              {filtered.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-900/20">
                  <td className="px-5 py-3 text-slate-400 text-xs font-mono">{tx.date}</td>
                  <td className="px-5 py-3 text-slate-300 text-xs">{tx.description}</td>
                  <td className="px-5 py-3 text-slate-400 text-xs">{tx.category}</td>
                  <td className="px-5 py-3">
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{tx.method}</span>
                  </td>
                  <td className={`px-5 py-3 text-right font-mono font-bold text-sm ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "−"}{formatINR(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleSave} className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider font-mono">Add Transaction</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-white rounded bg-slate-900 border border-slate-800 cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-2">
                {(["income","expense"] as const).map(t => (
                  <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t, category: t === "income" ? INCOME_CATS[0] : EXPENSE_CATS[0] }))}
                    className={`flex-1 py-2 rounded font-bold cursor-pointer border transition-all capitalize ${form.type === t ? (t === "income" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-red-600 border-red-500 text-white") : "bg-slate-900 border-slate-700 text-slate-400"}`}>
                    {t}
                  </button>
                ))}
              </div>
              {[
                ["Description *", "description", "text"],
                ["Amount (Rs.) *", "amount", "number"],
                ["Date", "date", "date"],
              ].map(([l, k, t]) => (
                <div key={k as string}>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">{l as string}</label>
                  <input type={t as string} min={t === "number" ? "0" : undefined} required={["description","amount"].includes(k as string)}
                    value={(form as any)[k as string]} onChange={e => setForm(f => ({ ...f, [k as string]: t === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                    {(form.type === "income" ? INCOME_CATS : EXPENSE_CATS).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold uppercase text-[10px]">Method</label>
                  <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as any }))}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500">
                    <option value="cash">Cash</option><option value="upi">UPI</option><option value="bank">Bank</option><option value="card">Card</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setShowModal(false)} className="rounded bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1.5 text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="rounded bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 text-xs font-bold cursor-pointer">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
