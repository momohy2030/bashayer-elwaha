"use client";
import React, { useState } from "react";
import { HardHat, Plus, Wallet, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { NurseryId, TreasuryTransaction, Worker } from "../types";

interface LaborTabProps {
  selectedNursery: NurseryId;
  workers: Worker[];
  onAddWorker: (worker: Omit<Worker, "id">) => void;
  onPayWorker: (worker: Worker, units: number, nursery: NurseryId) => void;
}

export function LaborTab({ selectedNursery, workers, onAddWorker, onPayWorker }: LaborTabProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [wageType, setWageType] = useState<"daily" | "monthly">("daily");
  const [rate, setRate] = useState("");
  const [unitsMap, setUnitsMap] = useState<{ [id: number]: string }>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rate) return;
    onAddWorker({ name, role: role || "عامل مشتل", wageType, rate: Number(rate) });
    setName("");
    setRole("");
    setRate("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-4">
          <HardHat className="text-amber-600" /> تسجيل عامل جديد (يومية أو راتب ثابت)
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="اسم العامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="التخصص (مثلاً: تقليع / ري)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={wageType}
            onChange={(e) => setWageType(e.target.value as "daily" | "monthly")}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="daily">عمالة باليومية</option>
            <option value="monthly">عمالة ثابتة (شهري)</option>
          </select>
          <input
            type="number"
            placeholder="قيمة اليومية / الراتب"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg px-4 py-2 text-sm font-bold flex items-center justify-center gap-1"
          >
            <Plus size={16} /> إضافة عامل
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <h3 className="font-bold text-stone-800">
            كشف العمالة وصرف المستحقات (تُخصم مباشرة من الخزينة على:{" "}
            {selectedNursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-4">الاسم</th>
                <th className="p-4">التخصص</th>
                <th className="p-4">نظام العمل</th>
                <th className="p-4">الأجر الأساسي</th>
                <th className="p-4">صرف مستحقات (عدد الأيام / الشهور)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {workers.map((w) => (
                <tr key={w.id} className="hover:bg-stone-50">
                  <td className="p-4 font-bold">{w.name}</td>
                  <td className="p-4 text-stone-600">{w.role}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        w.wageType === "daily"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {w.wageType === "daily" ? "باليومية" : "ثابت (شهري)"}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{w.rate.toLocaleString()} ج.م</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder={w.wageType === "daily" ? "عدد الأيام" : "عدد الشهور"}
                        value={unitsMap[w.id] || ""}
                        onChange={(e) => setUnitsMap({ ...unitsMap, [w.id]: e.target.value })}
                        className="border border-stone-300 rounded-lg px-2.5 py-1.5 text-sm w-28"
                      />
                      <button
                        onClick={() => {
                          const u = Number(unitsMap[w.id] || 1);
                          onPayWorker(w, u, selectedNursery);
                          setUnitsMap({ ...unitsMap, [w.id]: "" });
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 size={14} /> صرف من الخزينة
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TreasuryTabProps {
  transactions: TreasuryTransaction[];
  onAddManualTransaction: (tx: Omit<TreasuryTransaction, "id" | "date">) => void;
}

export function TreasuryTab({ transactions, onAddManualTransaction }: TreasuryTabProps) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [nursery, setNursery] = useState<NurseryId | "general">("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;
    onAddManualTransaction({
      type,
      category: type === "income" ? "إيراد متنوع" : "مصروف تشغيل",
      amount: Number(amount),
      description,
      nursery,
    });
    setAmount("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
        <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-4">
          <Wallet className="text-emerald-700" /> تسجيل حركة خزينة يدوية (وارد / صادر تشغيل)
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white font-bold"
          >
            <option value="expense">صادر (مصروفات / سولار / نقل)</option>
            <option value="income">وارد (إيراد / تمويل)</option>
          </select>
          <select
            value={nursery}
            onChange={(e) => setNursery(e.target.value as NurseryId | "general")}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="general">عام (بشاير الواحة)</option>
            <option value="main">المشتل الرئيسي</option>
            <option value="well">مشتل على البير</option>
          </select>
          <input
            type="number"
            placeholder="المبلغ (ج.م)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <input
            type="text"
            placeholder="البيان / السبب"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            className="bg-stone-800 hover:bg-stone-900 text-white rounded-lg px-4 py-2 text-sm font-bold"
          >
            تسجيل الحركة
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-200">
          <h3 className="font-bold text-stone-800">دفتر حركة الخزينة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200">
              <tr>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الحركة</th>
                <th className="p-4">الموقع</th>
                <th className="p-4">البيان</th>
                <th className="p-4">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-stone-400">
                    لا توجد حركات مالية مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="p-4">{tx.date}</td>
                    <td className="p-4">
                      {tx.type === "income" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full text-xs">
                          <ArrowDownLeft size={14} /> وارد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full text-xs">
                          <ArrowUpRight size={14} /> صادر
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-stone-600">
                      {tx.nursery === "main"
                        ? "المشتل الرئيسي"
                        : tx.nursery === "well"
                        ? "مشتل على البير"
                        : "عام"}
                    </td>
                    <td className="p-4 font-semibold">{tx.description}</td>
                    <td
                      className={`p-4 font-extrabold ${
                        tx.type === "income" ? "text-emerald-700" : "text-red-700"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {tx.amount.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}