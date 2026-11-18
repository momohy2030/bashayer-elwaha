"use client";
import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Sprout,
  Users,
  Wallet,
  HardHat,
  ArrowUpLeft,
  Calendar,
} from "lucide-react";
import {
  Client,
  InventoryItem,
  NurseryId,
  Shipment,
  TreasuryTransaction,
  Worker,
} from "../types";

interface DashboardOverviewProps {
  inventory: InventoryItem[];
  clients: Client[];
  shipments: Shipment[];
  workers: Worker[];
  transactions: TreasuryTransaction[];
  onNavigate: (tab: string) => void;
}

export default function DashboardOverview({
  inventory,
  clients,
  shipments,
  workers,
  transactions,
  onNavigate,
}: DashboardOverviewProps) {
  const [filterScope, setFilterScope] = useState<"all" | NurseryId>("all");

  // تصفية البيانات حسب الفلتر المختار في لوحة التحكم (الكل / الرئيسي / على البير)
  const filteredInv =
    filterScope === "all" ? inventory : inventory.filter((i) => i.nursery === filterScope);
  const filteredShipments =
    filterScope === "all" ? shipments : shipments.filter((s) => s.nursery === filterScope);
  const filteredTx =
    filterScope === "all"
      ? transactions
      : transactions.filter((t) => t.nursery === filterScope || t.nursery === "general");

  // الحسابات الإجمالية
  const totalAvailable = filteredInv.reduce((acc, i) => acc + i.available, 0);
  const totalIssued = filteredInv.reduce((acc, i) => acc + i.issued, 0);
  const totalIncome = filteredTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // مقارنة المشتلين للرسم البياني
  const mainStock = inventory
    .filter((i) => i.nursery === "main")
    .reduce((a, b) => a + b.available, 0);
  const mainIssued = inventory
    .filter((i) => i.nursery === "main")
    .reduce((a, b) => a + b.issued, 0);
  const wellStock = inventory
    .filter((i) => i.nursery === "well")
    .reduce((a, b) => a + b.available, 0);
  const wellIssued = inventory
    .filter((i) => i.nursery === "well")
    .reduce((a, b) => a + b.issued, 0);

  // تقسيم بنت جورة ومجدوع
  const bentGouraCount = filteredInv
    .filter((i) => i.type === "بنت جورة")
    .reduce((a, b) => a + b.available, 0);
  const magdouCount = filteredInv
    .filter((i) => i.type === "مجدوع")
    .reduce((a, b) => a + b.available, 0);

  // بيانات أعمدة مصغرة للكروت (نفس ستايل الصورة)
  const sparkBars1 = [35, 55, 40, 70, 50, 85, 60, 95, 75, 65, 90, 100];
  const sparkBars2 = [25, 45, 60, 40, 75, 55, 80, 65, 90, 70, 85, 95];
  const sparkBars3 = [50, 40, 65, 55, 80, 70, 60, 85, 95, 75, 88, 92];
  const sparkBars4 = [60, 50, 45, 70, 65, 55, 75, 60, 80, 70, 85, 90];

  const maxChartVal = Math.max(mainStock, mainIssued, wellStock, wellIssued, 10);

  return (
    <div className="space-y-6">
      {/* الهيدر الداخلي للوحة التحكم مع أزرار الفلترة */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
            <Calendar size={14} />
            <span>ملخص الأداء العام لمشاتل بشاير الواحة</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">لوحة التحكم والتحليلات</h1>
        </div>

        {/* أزرار التصفية السريعة (نفس ستايل 7 days / 30 days في الصورة) */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-stone-200 shadow-xs">
          <button
            onClick={() => setFilterScope("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterScope === "all"
                ? "bg-[#122b22] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            كل المشاتل
          </button>
          <button
            onClick={() => setFilterScope("main")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterScope === "main"
                ? "bg-[#122b22] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            المشتل الرئيسي
          </button>
          <button
            onClick={() => setFilterScope("well")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
              filterScope === "well"
                ? "bg-[#122b22] text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            مشتل على البير
          </button>
        </div>
      </div>

      {/* 4 كروت رئيسية مع رسم بياني شريطي مصغر أسفل كل كارت (نفس الصورة) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* كارت 1: صافي الخزينة */}
        <div
          onClick={() => onNavigate("treasury")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/40 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Wallet size={15} className="text-emerald-700" /> صافي الخزينة
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-0.5">
                <TrendingUp size={12} /> نشط
              </span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 mt-3">
              {netBalance.toLocaleString("en-US")} <span className="text-xs font-semibold text-stone-500">ج.م</span>
            </p>
          </div>
          {/* أعمدة مصغرة */}
          <div className="flex items-end gap-1 h-8 mt-4 pt-2 border-t border-stone-100">
            {sparkBars1.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="flex-1 bg-emerald-600/75 rounded-t-xs"
              />
            ))}
          </div>
        </div>

        {/* كارت 2: المتاح بالمخزون */}
        <div
          onClick={() => onNavigate("inventory")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/40 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Sprout size={15} className="text-emerald-700" /> الرصيد المتاح
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[11px]">
                {filteredInv.length} أصناف
              </span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 mt-3">
              {totalAvailable.toLocaleString("en-US")}{" "}
              <span className="text-xs font-semibold text-stone-500">فسيلة</span>
            </p>
          </div>
          <div className="flex items-end gap-1 h-8 mt-4 pt-2 border-t border-stone-100">
            {sparkBars2.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="flex-1 bg-teal-600/75 rounded-t-xs"
              />
            ))}
          </div>
        </div>

        {/* كارت 3: إجمالي الصادر للعملاء */}
        <div
          onClick={() => onNavigate("clients")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/40 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-amber-600" /> الصادر المُحمّل
              </span>
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full text-[11px]">
                {clients.length} عملاء
              </span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 mt-3">
              {totalIssued.toLocaleString("en-US")}{" "}
              <span className="text-xs font-semibold text-stone-500">فسيلة</span>
            </p>
          </div>
          <div className="flex items-end gap-1 h-8 mt-4 pt-2 border-t border-stone-100">
            {sparkBars3.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="flex-1 bg-amber-500/80 rounded-t-xs"
              />
            ))}
          </div>
        </div>

        {/* كارت 4: المصروفات والعمالة */}
        <div
          onClick={() => onNavigate("labor")}
          className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs hover:border-emerald-600/40 transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <HardHat size={15} className="text-rose-600" /> صادر الخزينة
              </span>
              <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px] flex items-center gap-0.5">
                <TrendingDown size={12} /> {workers.length} عمال
              </span>
            </div>
            <p className="text-2xl font-extrabold text-stone-900 mt-3">
              {totalExpense.toLocaleString("en-US")}{" "}
              <span className="text-xs font-semibold text-stone-500">ج.م</span>
            </p>
          </div>
          <div className="flex items-end gap-1 h-8 mt-4 pt-2 border-t border-stone-100">
            {sparkBars4.map((h, idx) => (
              <div
                key={idx}
                style={{ height: `${h}%` }}
                className="flex-1 bg-rose-400/80 rounded-t-xs"
              />
            ))}
          </div>
        </div>
      </div>

      {/* شريط التنقل السريع بين الأقسام (نفس شريط Overview / Revenue / Traffic في الصورة) */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200/80 flex flex-wrap items-center gap-2">
        <span className="px-4 py-2 rounded-xl bg-[#122b22] text-white text-xs font-bold">
          نظرة عامة شاملة
        </span>
        <button
          onClick={() => onNavigate("inventory")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
        >
          إدارة المخزون ({totalAvailable})
        </button>
        <button
          onClick={() => onNavigate("clients")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
        >
          العملاء والمستخلصات ({clients.length})
        </button>
        <button
          onClick={() => onNavigate("labor")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
        >
          العمالة ({workers.length})
        </button>
        <button
          onClick={() => onNavigate("treasury")}
          className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
        >
          دفتر الخزينة ({transactions.length} حركة)
        </button>
      </div>

      {/* القسم السفلي: رسم بياني مقارن على اليمين + كارت "أبرز المؤشرات" على الشمال (نفس تقسيمة الصورة) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* الرسم البياني الرئيسي (2/3 المساحة) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base">
                مقارنة المخزون والتحميل بين المشتلين
              </h3>
              <p className="text-xs text-stone-500">
                توزيع الفسائل المتاحة والصادرة بين (المشتل الرئيسي) و(مشتل على البير)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-3 h-3 rounded-xs bg-[#1b4332] inline-block" /> المتاح بالمشتل
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" /> الصادر المُحمّل
              </span>
            </div>
          </div>

          {/* الأعمدة البيانية */}
          <div className="grid grid-cols-2 gap-8 items-end h-52 px-6 pt-6 pb-2 border-b border-stone-200 bg-stone-50/50 rounded-xl">
            {/* المشتل الرئيسي */}
            <div className="flex flex-col items-center h-full justify-end">
              <div className="flex items-end gap-3 h-40 w-full justify-center">
                <div className="flex flex-col items-center gap-1 w-14 h-full justify-end">
                  <span className="text-xs font-extrabold text-emerald-900">{mainStock}</span>
                  <div
                    style={{ height: `${Math.max((mainStock / maxChartVal) * 100, 8)}%` }}
                    className="w-full bg-[#1b4332] rounded-t-lg transition-all duration-500"
                  />
                </div>
                <div className="flex flex-col items-center gap-1 w-14 h-full justify-end">
                  <span className="text-xs font-extrabold text-amber-700">{mainIssued}</span>
                  <div
                    style={{ height: `${Math.max((mainIssued / maxChartVal) * 100, 8)}%` }}
                    className="w-full bg-amber-500 rounded-t-lg transition-all duration-500"
                  />
                </div>
              </div>
              <span className="text-xs font-extrabold text-stone-700 mt-3">المشتل الرئيسي</span>
            </div>

            {/* مشتل على البير */}
            <div className="flex flex-col items-center h-full justify-end">
              <div className="flex items-end gap-3 h-40 w-full justify-center">
                <div className="flex flex-col items-center gap-1 w-14 h-full justify-end">
                  <span className="text-xs font-extrabold text-emerald-900">{wellStock}</span>
                  <div
                    style={{ height: `${Math.max((wellStock / maxChartVal) * 100, 8)}%` }}
                    className="w-full bg-[#1b4332] rounded-t-lg transition-all duration-500"
                  />
                </div>
                <div className="flex flex-col items-center gap-1 w-14 h-full justify-end">
                  <span className="text-xs font-extrabold text-amber-700">{wellIssued}</span>
                  <div
                    style={{ height: `${Math.max((wellIssued / maxChartVal) * 100, 8)}%` }}
                    className="w-full bg-amber-500 rounded-t-lg transition-all duration-500"
                  />
                </div>
              </div>
              <span className="text-xs font-extrabold text-stone-700 mt-3">مشتل على البير</span>
            </div>
          </div>

          {/* شريط تفاصيل بنت جورة vs مجدوع */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold">
                بنت جورة: {bentGouraCount} فسيلة
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 font-bold">
                مجدوع: {magdouCount} فسيلة
              </span>
            </div>
            <span className="text-stone-400">يتم التحديث تلقائياً مع كل إذن تحميل</span>
          </div>
        </div>

        {/* كارت "أبرز المؤشرات" (What stands out - 1/3 المساحة) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-stone-900 text-base mb-4">أبرز المؤشرات</h3>
            <div className="divide-y divide-stone-100 text-sm">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400">وارد الخزينة (تحصيلات)</p>
                  <p className="font-extrabold text-emerald-700 mt-0.5">
                    +{totalIncome.toLocaleString("en-US")} ج.م
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("treasury")}
                  className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600"
                >
                  <ArrowUpLeft size={16} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400">إجمالي أذونات التحميل</p>
                  <p className="font-extrabold text-stone-800 mt-0.5">
                    {filteredShipments.length} شحنة صادرة
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("clients")}
                  className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600"
                >
                  <ArrowUpLeft size={16} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400">قوة العمالة المسجلة</p>
                  <p className="font-extrabold text-stone-800 mt-0.5">
                    {workers.filter((w) => w.wageType === "daily").length} يومية •{" "}
                    {workers.filter((w) => w.wageType === "monthly").length} ثابتة
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("labor")}
                  className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600"
                >
                  <ArrowUpLeft size={16} />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-stone-400">أعلى صنف متاح حالياً</p>
                  <p className="font-extrabold text-stone-800 mt-0.5">
                    {[...filteredInv].sort((a, b) => b.available - a.available)[0]?.variety || "-"} (
                    {[...filteredInv].sort((a, b) => b.available - a.available)[0]?.available || 0})
                  </p>
                </div>
                <button
                  onClick={() => onNavigate("inventory")}
                  className="p-2 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-600"
                >
                  <ArrowUpLeft size={16} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate("clients")}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#122b22] hover:bg-[#1a3d31] text-white text-xs font-bold transition"
          >
            إصدار إذن تحميل جديد +
          </button>
        </div>
      </div>
    </div>
  );
}