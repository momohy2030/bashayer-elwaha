"use client";
import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  Calendar,
  UserCheck,
  Check,
  X,
} from "lucide-react";
import { NurseryId, TreasuryTransaction } from "../types";

interface TreasuryTabProps {
  selectedNursery: NurseryId;
  transactions: TreasuryTransaction[];
  staffList: string[];
  onAddStaff: (name: string) => void;
  onAddManualTransaction: (tx: Omit<TreasuryTransaction, "id">) => void;
}

export default function TreasuryTab({
  selectedNursery,
  transactions,
  staffList,
  onAddStaff,
  onAddManualTransaction,
}: TreasuryTabProps) {
  const today = new Date().toISOString().split("T")[0];

  const [type, setType] = useState<"income" | "expense">("expense");
  const [handledBy, setHandledBy] = useState<string>(staffList[0] || "مصطفي موسي");
  const [date, setDate] = useState<string>(today);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [nursery, setNursery] = useState<NurseryId>(selectedNursery);

  // إضافة اسم مسؤول جديد للقائمة بزر (+)
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");

  // تصفية السجل
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const handleSaveNewStaff = () => {
    const trimmed = newStaffName.trim();
    if (!trimmed) return;
    onAddStaff(trimmed);
    setHandledBy(trimmed);
    setNewStaffName("");
    setAddingStaff(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category.trim()) return;

    onAddManualTransaction({
      date: date || today,
      type: type,
      category: category.trim(),
      amount: Number(amount),
      description: description.trim() || category.trim(),
      nursery: nursery,
      handledBy: handledBy,
    });

    setCategory("");
    setAmount("");
    setDescription("");
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter((t) =>
    filterType === "all" ? true : t.type === filterType
  );

  return (
    <div className="space-y-5">
      {/* 1. بطاقات ملخص الخزينة */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-bold">إجمالي الوارد</p>
            <p className="text-xl font-black text-emerald-700 mt-1">
              {totalIncome.toLocaleString("en-US")}{" "}
              <span className="text-xs font-semibold">ج.م</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-bold">إجمالي الصادر</p>
            <p className="text-xl font-black text-red-600 mt-1">
              {totalExpense.toLocaleString("en-US")}{" "}
              <span className="text-xs font-semibold">ج.م</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="bg-[#122b22] text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-200 font-bold">صافي رصيد الخزينة</p>
            <p className="text-xl font-black mt-1">
              {netBalance.toLocaleString("en-US")}{" "}
              <span className="text-xs font-normal text-emerald-300">ج.م</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* 2. نموذج تسجيل حركة جديدة (وارد / صادر) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm md:text-base font-extrabold text-stone-800">
            تسجيل حركة خزينة جديدة
          </h2>

          {/* أزرار التبديل بين صادر ووارد */}
          <div className="grid grid-cols-2 bg-stone-100 p-1 rounded-xl w-full sm:w-64">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={
                "py-2 rounded-lg text-xs font-extrabold transition cursor-pointer " +
                (type === "expense"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900")
              }
            >
              صادر (مصروف)
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={
                "py-2 rounded-lg text-xs font-extrabold transition cursor-pointer " +
                (type === "income"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900")
              }
            >
              وارد (تحصيل)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* القائمة المنسدلة لاسم اللي صرف / استلم + زر (+) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <UserCheck size={13} className="text-emerald-700" />
              <span>{type === "expense" ? "القائم بالصرف" : "المستلم"}</span>
            </label>
            {!addingStaff ? (
              <div className="flex gap-1.5">
                <select
                  value={handledBy}
                  onChange={(e) => setHandledBy(e.target.value)}
                  className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
                >
                  {staffList.map((person) => (
                    <option key={person} value={person}>
                      {person}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingStaff(true)}
                  title="إضافة اسم جديد"
                  className="px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="أدخل الاسم الجديد..."
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="flex-1 min-w-0 border border-emerald-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNewStaff}
                  className="px-2.5 rounded-xl bg-emerald-600 text-white cursor-pointer shrink-0"
                  title="حفظ الاسم"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingStaff(false);
                    setNewStaffName("");
                  }}
                  className="px-2.5 rounded-xl bg-stone-100 text-stone-600 cursor-pointer shrink-0"
                  title="إلغاء"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* التقويم لاختيار التاريخ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <Calendar size={13} className="text-emerald-700" />
              <span>التاريخ</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* المبلغ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">المبلغ (ج.م)</label>
            <input
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* البند */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">البند</label>
            <input
              type="text"
              placeholder={type === "expense" ? "مثلاً: سولار، سماد، نقل..." : "مثلاً: دفعة، مبيعات..."}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* المشتل */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">المشتل</label>
            <select
              value={nursery}
              onChange={(e) => setNursery(e.target.value as NurseryId)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
            >
              <option value="main">المشتل الرئيسي</option>
              <option value="well">مشتل على البير</option>
            </select>
          </div>

          {/* البيان / التفاصيل */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">البيان / ملاحظات</label>
            <input
              type="text"
              placeholder="تفاصيل إضافية (اختياري)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 pt-1">
            <button
              type="submit"
              className={
                "w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition cursor-pointer " +
                (type === "expense"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-700 hover:bg-emerald-800")
              }
            >
              <Plus size={16} />
              <span>{type === "expense" ? "تسجيل صادر في الخزينة" : "تسجيل وارد في الخزينة"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. دفتر حركات الخزينة */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm md:text-base font-extrabold text-stone-800">
            سجل الحركات ({filteredTransactions.length})
          </h2>

          <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={
                "px-3 py-1.5 rounded-lg cursor-pointer " +
                (filterType === "all" ? "bg-white text-stone-900 shadow-xs" : "text-stone-500")
              }
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setFilterType("income")}
              className={
                "px-3 py-1.5 rounded-lg cursor-pointer " +
                (filterType === "income" ? "bg-emerald-700 text-white shadow-xs" : "text-stone-500")
              }
            >
              وارد
            </button>
            <button
              type="button"
              onClick={() => setFilterType("expense")}
              className={
                "px-3 py-1.5 rounded-lg cursor-pointer " +
                (filterType === "expense" ? "bg-red-600 text-white shadow-xs" : "text-stone-500")
              }
            >
              صادر
            </button>
          </div>
        </div>

        {/* بطاقات للموبايل */}
        <div className="md:hidden divide-y divide-stone-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 font-bold">
              لا توجد حركات مسجلة في الخزينة حتى الآن
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-extrabold text-stone-900 text-sm truncate">{tx.category}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{tx.description}</p>
                  </div>
                  <span
                    className={
                      "text-sm font-black shrink-0 " +
                      (tx.type === "income" ? "text-emerald-700" : "text-red-600")
                    }
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {tx.amount.toLocaleString("en-US")} ج.م
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 font-semibold pt-1">
                  <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
                    <Calendar size={11} /> {tx.date}
                  </span>
                  {tx.handledBy && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                      <UserCheck size={11} /> {tx.handledBy}
                    </span>
                  )}
                  <span className="bg-stone-100 px-2 py-0.5 rounded-md">
                    {tx.nursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* جدول للكمبيوتر */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-600 text-xs border-b border-stone-200">
                <th className="p-4">التاريخ</th>
                <th className="p-4">النوع</th>
                <th className="p-4">البند والبيان</th>
                <th className="p-4">المسؤول</th>
                <th className="p-4">المشتل</th>
                <th className="p-4">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 text-xs font-bold">
                    لا توجد حركات مسجلة في الخزينة حتى الآن
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50">
                    <td className="p-4 text-xs font-semibold text-stone-500">{tx.date}</td>
                    <td className="p-4">
                      <span
                        className={
                          "px-2.5 py-1 rounded-full text-xs font-bold " +
                          (tx.type === "income"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700")
                        }
                      >
                        {tx.type === "income" ? "وارد" : "صادر"}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-stone-800">{tx.category}</p>
                      <p className="text-xs text-stone-500">{tx.description}</p>
                    </td>
                    <td className="p-4">
                      {tx.handledBy ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                          <UserCheck size={12} /> {tx.handledBy}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-stone-600">
                      {tx.nursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
                    </td>
                    <td
                      className={
                        "p-4 font-extrabold " +
                        (tx.type === "income" ? "text-emerald-700" : "text-red-600")
                      }
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {tx.amount.toLocaleString("en-US")} ج.م
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