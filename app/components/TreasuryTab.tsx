"use client";
import React, { useState, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Plus,
  Calendar,
  UserCheck,
  Check,
  X,
  Pencil,
  Trash2,
  Filter,
  Building2,
  BarChart3,
} from "lucide-react";
import { NurseryId, TreasuryTransaction } from "../types";

interface TreasuryTabProps {
  selectedNursery: NurseryId;
  transactions: TreasuryTransaction[];
  staffList: string[];
  targetList: string[];
  onAddStaff: (name: string) => void;
  onAddTarget: (target: string) => void;
  onAddManualTransaction: (tx: Omit<TreasuryTransaction, "id">) => void;
  onUpdateTransaction: (tx: TreasuryTransaction) => void;
  onDeleteTransaction: (id: number) => void;
}

const formatTargetLabel = (val: string) => {
  if (val === "main") return "المشتل الرئيسي";
  if (val === "well") return "مشتل على البير";
  if (val === "general") return "مصروفات عامة";
  return val;
};

const formatMonthLabel = (ym: string) => {
  const parts = ym.split("-");
  if (parts.length !== 2) return ym;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!year || !month) return ym;
  return new Date(year, month - 1, 1).toLocaleDateString("ar-EG", {
    month: "long",
    year: "numeric",
  });
};

export default function TreasuryTab({
  selectedNursery,
  transactions,
  staffList,
  targetList,
  onAddStaff,
  onAddTarget,
  onAddManualTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: TreasuryTabProps) {
  const today = new Date().toISOString().split("T")[0];
  const currentMonth = today.slice(0, 7);

  // حقول إضافة حركة جديدة
  const [type, setType] = useState<"income" | "expense">("expense");
  const [handledBy, setHandledBy] = useState<string>(staffList[0] || "مصطفي موسي");
  const [date, setDate] = useState<string>(today);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [nursery, setNursery] = useState<string>(selectedNursery);

  // إضافة مسؤول جديد بزر (+)
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");

  // إضافة جهة صرف جديدة بزر (+)
  const [addingTarget, setAddingTarget] = useState(false);
  const [newTargetName, setNewTargetName] = useState("");

  // التبويب الداخلي: صادر فقط | وارد فقط | ملخص الشهور
  const [viewMode, setViewMode] = useState<"expense" | "income" | "monthly">("expense");

  // الفلاتر (الشهر + اسم المسؤول + جهة الصرف)
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterStaff, setFilterStaff] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<string>("all");

  // نافذة تعديل بند
  const [editingTx, setEditingTx] = useState<TreasuryTransaction | null>(null);

  // استخراج الشهور المتاحة تلقائياً من الحركات + الشهر الحالي
  const availableMonths = useMemo(() => {
    const set = new Set<string>([currentMonth]);
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        set.add(tx.date.slice(0, 7));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentMonth]);

  // الحركات بعد تطبيق الفلاتر (الشهر + المسؤول + الجهة)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchMonth =
        filterMonth === "all" || (tx.date && tx.date.startsWith(filterMonth));
      const matchStaff =
        filterStaff === "all" || tx.handledBy === filterStaff;
      const matchTarget =
        filterTarget === "all" || tx.nursery === filterTarget;
      return matchMonth && matchStaff && matchTarget;
    });
  }, [transactions, filterMonth, filterStaff, filterTarget]);

  const expenseList = useMemo(
    () => filteredTransactions.filter((t) => t.type === "expense"),
    [filteredTransactions]
  );

  const incomeList = useMemo(
    () => filteredTransactions.filter((t) => t.type === "income"),
    [filteredTransactions]
  );

  const totalIncome = incomeList.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // ملخص الشهور (يتأثر بفلتر المسؤول والجهة إن وجد)
  const monthlySummary = useMemo(() => {
    const map: Record<
      string,
      { month: string; income: number; expense: number; count: number }
    > = {};

    transactions.forEach((tx) => {
      const matchStaff =
        filterStaff === "all" || tx.handledBy === filterStaff;
      const matchTarget =
        filterTarget === "all" || tx.nursery === filterTarget;
      if (!matchStaff || !matchTarget) return;

      const ym = tx.date && tx.date.length >= 7 ? tx.date.slice(0, 7) : "غير محدد";
      if (!map[ym]) {
        map[ym] = { month: ym, income: 0, expense: 0, count: 0 };
      }
      if (tx.type === "income") {
        map[ym].income += tx.amount;
      } else {
        map[ym].expense += tx.amount;
      }
      map[ym].count += 1;
    });

    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions, filterStaff, filterTarget]);

  const handleSaveNewStaff = () => {
    const trimmed = newStaffName.trim();
    if (!trimmed) return;
    onAddStaff(trimmed);
    setHandledBy(trimmed);
    setNewStaffName("");
    setAddingStaff(false);
  };

  const handleSaveNewTarget = () => {
    const trimmed = newTargetName.trim();
    if (!trimmed) return;
    onAddTarget(trimmed);
    setNursery(trimmed);
    setNewTargetName("");
    setAddingTarget(false);
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
    setViewMode(type);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    onUpdateTransaction(editingTx);
    setEditingTx(null);
  };

  const handleDeleteClick = (tx: TreasuryTransaction) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف بند (" +
        tx.category +
        " - " +
        tx.amount.toLocaleString("en-US") +
        " ج.م) من الخزينة؟"
    );
    if (confirmed) {
      onDeleteTransaction(tx.id);
    }
  };

  const activeList = viewMode === "income" ? incomeList : expenseList;

  return (
    <div className="space-y-5">
      {/* 1. بطاقات ملخص الخزينة (تتحدث حسب الفلاتر المختارة) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-500 font-bold">
              إجمالي الوارد {filterMonth !== "all" ? "(" + formatMonthLabel(filterMonth) + ")" : ""}
            </p>
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
            <p className="text-xs text-stone-500 font-bold">
              إجمالي الصادر {filterMonth !== "all" ? "(" + formatMonthLabel(filterMonth) + ")" : ""}
            </p>
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
            <p className="text-xs text-emerald-200 font-bold">صافي الرصيد</p>
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

      {/* 2. نموذج تسجيل حركة جديدة */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm md:text-base font-extrabold text-stone-800">
            تسجيل حركة خزينة جديدة
          </h2>

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
          {/* اسم المسؤول + زر (+) */}
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
                  title="إضافة مسؤول جديد"
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
                  title="حفظ"
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

          {/* المشتل / جهة الصرف + زر (+) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <Building2 size={13} className="text-amber-600" />
              <span>المشتل / جهة الصرف</span>
            </label>
            {!addingTarget ? (
              <div className="flex gap-1.5">
                <select
                  value={nursery}
                  onChange={(e) => setNursery(e.target.value)}
                  className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
                >
                  {targetList.map((target) => (
                    <option key={target} value={target}>
                      {formatTargetLabel(target)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingTarget(true)}
                  title="إضافة جهة صرف أخرى"
                  className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="مثلاً: المكتب، سيارة النقل..."
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  className="flex-1 min-w-0 border border-amber-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNewTarget}
                  className="px-2.5 rounded-xl bg-amber-500 text-white cursor-pointer shrink-0"
                  title="حفظ"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTarget(false);
                    setNewTargetName("");
                  }}
                  className="px-2.5 rounded-xl bg-stone-100 text-stone-600 cursor-pointer shrink-0"
                  title="إلغاء"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* التاريخ */}
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
              placeholder={type === "expense" ? "مثلاً: سولار، سماد، صيانة..." : "مثلاً: دفعة، مبيعات..."}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* البيان */}
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

      {/* 3. شريط الفلاتر (الشهر + اسم المسؤول + جهة الصرف) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-stone-700">
            <Filter size={15} className="text-emerald-700" />
            <span>تصفية الحركات:</span>
          </div>
          {(filterMonth !== "all" || filterStaff !== "all" || filterTarget !== "all") && (
            <button
              type="button"
              onClick={() => {
                setFilterMonth("all");
                setFilterStaff("all");
                setFilterTarget("all");
              }}
              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* فلتر الشهر */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-stone-50 focus:outline-none focus:border-emerald-700"
          >
            <option value="all">كل الشهور</option>
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>
                {formatMonthLabel(ym)} ({ym})
              </option>
            ))}
          </select>

          {/* فلتر اسم المسؤول */}
          <select
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-stone-50 focus:outline-none focus:border-emerald-700"
          >
            <option value="all">كل المسؤولين</option>
            {staffList.map((person) => (
              <option key={person} value={person}>
                {person}
              </option>
            ))}
          </select>

          {/* فلتر جهة الصرف */}
          <select
            value={filterTarget}
            onChange={(e) => setFilterTarget(e.target.value)}
            className="border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold bg-stone-50 focus:outline-none focus:border-emerald-700"
          >
            <option value="all">كل الجهات والمشاتل</option>
            {targetList.map((t) => (
              <option key={t} value={t}>
                {formatTargetLabel(t)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. شريط الفصل بين (الصادر) و (الوارد) و (ملخص الشهور) */}
      <div className="grid grid-cols-3 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs gap-1">
        <button
          type="button"
          onClick={() => setViewMode("expense")}
          className={
            "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer " +
            (viewMode === "expense"
              ? "bg-red-600 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100")
          }
        >
          <ArrowUpRight size={15} />
          <span>الصادر ({expenseList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("income")}
          className={
            "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer " +
            (viewMode === "income"
              ? "bg-emerald-700 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100")
          }
        >
          <ArrowDownLeft size={15} />
          <span>الوارد ({incomeList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("monthly")}
          className={
            "py-2.5 px-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer " +
            (viewMode === "monthly"
              ? "bg-[#122b22] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100")
          }
        >
          <BarChart3 size={15} />
          <span>تقرير الشهور</span>
        </button>
      </div>

      {/* 5. عرض السجل المنفصل (صادر فقط أو وارد فقط) */}
      {viewMode !== "monthly" ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-stone-800">
              {viewMode === "expense" ? "سجل المصاريف (الصادر)" : "سجل التحصيلات (الوارد)"}
            </h3>
            <span
              className={
                "text-xs font-black px-3 py-1 rounded-full " +
                (viewMode === "expense"
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-800")
              }
            >
              الإجمالي:{" "}
              {(viewMode === "expense" ? totalExpense : totalIncome).toLocaleString("en-US")} ج.م
            </span>
          </div>

          {/* بطاقات للموبايل */}
          <div className="md:hidden divide-y divide-stone-100">
            {activeList.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400 font-bold">
                لا توجد حركات مطابقة في هذا القسم
              </div>
            ) : (
              activeList.map((tx) => (
                <div key={tx.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-extrabold text-stone-900 text-sm truncate">
                        {tx.category}
                      </p>
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

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 font-semibold">
                    <span className="inline-flex items-center gap-1 bg-stone-100 px-2 py-0.5 rounded-md">
                      <Calendar size={11} /> {tx.date}
                    </span>
                    {tx.handledBy && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                        <UserCheck size={11} /> {tx.handledBy}
                      </span>
                    )}
                    <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                      {formatTargetLabel(tx.nursery)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setEditingTx(tx)}
                      className="flex-1 py-1.5 rounded-xl bg-stone-100 active:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Pencil size={13} /> تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(tx)}
                      className="flex-1 py-1.5 rounded-xl bg-red-50 active:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Trash2 size={13} /> حذف
                    </button>
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
                  <th className="p-4">البند والبيان</th>
                  <th className="p-4">المسؤول</th>
                  <th className="p-4">جهة الصرف / المشتل</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {activeList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400 text-xs font-bold">
                      لا توجد حركات مطابقة في هذا القسم
                    </td>
                  </tr>
                ) : (
                  activeList.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50">
                      <td className="p-4 text-xs font-semibold text-stone-500">{tx.date}</td>
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
                      <td className="p-4 text-xs font-bold text-stone-700">
                        {formatTargetLabel(tx.nursery)}
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
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx)}
                            title="تعديل البند"
                            className="p-2 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 transition cursor-pointer"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(tx)}
                            title="حذف البند"
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 6. تقرير الشهور المنفصل */
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200">
            <h3 className="text-sm font-extrabold text-stone-800">
              ملخص الوارد والصادر حسب الشهر
              {filterStaff !== "all" ? " — (" + filterStaff + ")" : ""}
            </h3>
          </div>

          {monthlySummary.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 font-bold">
              لا توجد بيانات شهرية لعرضها حالياً
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {monthlySummary.map((row) => {
                const net = row.income - row.expense;
                return (
                  <div
                    key={row.month}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50"
                  >
                    <div>
                      <p className="text-base font-extrabold text-stone-900">
                        {formatMonthLabel(row.month)}
                      </p>
                      <p className="text-xs text-stone-400 font-semibold">
                        {row.month} • {row.count} حركة مسجلة
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-5 text-center">
                      <div className="bg-emerald-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-emerald-700 font-bold">الوارد</p>
                        <p className="text-xs sm:text-sm font-black text-emerald-800">
                          {row.income.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-red-600 font-bold">الصادر</p>
                        <p className="text-xs sm:text-sm font-black text-red-700">
                          {row.expense.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div className="bg-stone-100 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-stone-600 font-bold">الصافي</p>
                        <p
                          className={
                            "text-xs sm:text-sm font-black " +
                            (net >= 0 ? "text-[#122b22]" : "text-red-700")
                          }
                        >
                          {net.toLocaleString("en-US")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterMonth(row.month);
                        setViewMode("expense");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#122b22] hover:bg-[#1b4033] text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      عرض تفاصيل الشهر
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 7. نافذة تعديل البند */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="bg-[#122b22] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold">تعديل حركة الخزينة</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditingTx({ ...editingTx, type: "expense" })
                  }
                  className={
                    "py-2 rounded-xl text-xs font-extrabold cursor-pointer " +
                    (editingTx.type === "expense"
                      ? "bg-red-600 text-white"
                      : "bg-stone-100 text-stone-600")
                  }
                >
                  صادر (مصروف)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEditingTx({ ...editingTx, type: "income" })
                  }
                  className={
                    "py-2 rounded-xl text-xs font-extrabold cursor-pointer " +
                    (editingTx.type === "income"
                      ? "bg-emerald-700 text-white"
                      : "bg-stone-100 text-stone-600")
                  }
                >
                  وارد (تحصيل)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">التاريخ</label>
                  <input
                    type="date"
                    value={editingTx.date}
                    onChange={(e) =>
                      setEditingTx({ ...editingTx, date: e.target.value })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">المبلغ (ج.م)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTx.amount}
                    onChange={(e) =>
                      setEditingTx({ ...editingTx, amount: Number(e.target.value) })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">المسؤول</label>
                  <select
                    value={editingTx.handledBy || ""}
                    onChange={(e) =>
                      setEditingTx({ ...editingTx, handledBy: e.target.value })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    <option value="">— غير محدد —</option>
                    {editingTx.handledBy && !staffList.includes(editingTx.handledBy) && (
                      <option value={editingTx.handledBy}>{editingTx.handledBy}</option>
                    )}
                    {staffList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">جهة الصرف</label>
                  <select
                    value={editingTx.nursery}
                    onChange={(e) =>
                      setEditingTx({ ...editingTx, nursery: e.target.value })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white"
                  >
                    {!targetList.includes(editingTx.nursery) && (
                      <option value={editingTx.nursery}>
                        {formatTargetLabel(editingTx.nursery)}
                      </option>
                    )}
                    {targetList.map((t) => (
                      <option key={t} value={t}>
                        {formatTargetLabel(t)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">البند</label>
                <input
                  type="text"
                  value={editingTx.category}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, category: e.target.value })
                  }
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600 block">البيان</label>
                <input
                  type="text"
                  value={editingTx.description}
                  onChange={(e) =>
                    setEditingTx({ ...editingTx, description: e.target.value })
                  }
                  className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#122b22] hover:bg-[#1b4033] text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}