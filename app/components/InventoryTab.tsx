"use client";
import React, { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Search,
  X,
  Check,
} from "lucide-react";
import { InventoryItem, NurseryId } from "../types";

interface InventoryTabProps {
  selectedNursery: NurseryId;
  inventory: InventoryItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  varieties: string[];
  types: string[];
  onAddVariety: (v: string) => void;
  onAddType: (t: string) => void;
  onAddItem: (item: Omit<InventoryItem, "id" | "issued">) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: number) => void;
}

export default function InventoryTab({
  selectedNursery,
  inventory,
  searchQuery,
  onSearchChange,
  varieties,
  types,
  onAddVariety,
  onAddType,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: InventoryTabProps) {
  const today = new Date().toISOString().split("T")[0];

  // حقول إضافة صنف جديد
  const [selectedVariety, setSelectedVariety] = useState(varieties[0] || "برحي");
  const [selectedType, setSelectedType] = useState(types[0] || "بنت جورة");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(today);

  // حقول زر (+) لإضافة صنف أو نوع جديد للقائمة
  const [addingVariety, setAddingVariety] = useState(false);
  const [customVariety, setCustomVariety] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [customType, setCustomType] = useState("");

  // نافذة تعديل صنف موجود
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleSaveNewVariety = () => {
    const trimmed = customVariety.trim();
    if (!trimmed) return;
    onAddVariety(trimmed);
    setSelectedVariety(trimmed);
    setCustomVariety("");
    setAddingVariety(false);
  };

  const handleSaveNewType = () => {
    const trimmed = customType.trim();
    if (!trimmed) return;
    onAddType(trimmed);
    setSelectedType(trimmed);
    setCustomType("");
    setAddingType(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariety || !selectedType || !quantity) return;
    onAddItem({
      nursery: selectedNursery,
      variety: selectedVariety,
      type: selectedType,
      available: Number(quantity),
      date: date || today,
    });
    setQuantity("");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateItem(editingItem);
    setEditingItem(null);
  };

  const handleDeleteClick = (item: InventoryItem) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف الصنف (" + item.variety + " - " + item.type + ") من المخزون؟"
    );
    if (confirmed) {
      onDeleteItem(item.id);
    }
  };

  const getTypeBadgeClass = (type: string) => {
    if (type === "بنت جورة") return "bg-emerald-100 text-emerald-800";
    if (type === "مجدوع") return "bg-amber-100 text-amber-800";
    return "bg-sky-100 text-sky-800";
  };

  const currentInventory = inventory
    .filter((item) => item.nursery === selectedNursery)
    .filter(
      (item) =>
        item.variety.includes(searchQuery) || item.type.includes(searchQuery)
    );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-stone-900">
          إدارة المخزون - {selectedNursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          إضافة وتعديل وحذف الأصناف والأنواع بمرونة كاملة مع تسجيل التاريخ لكل مشتل
        </p>
      </div>

      {/* بحث الأصناف على الموبايل */}
      <div className="md:hidden relative">
        <Search
          size={16}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          type="text"
          placeholder="ابحث باسم الصنف أو النوع..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-2xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
        />
      </div>

      {/* بطاقة إضافة صنف للمخزون */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 md:p-5 space-y-4">
        <h2 className="text-sm md:text-base font-extrabold text-stone-800">
          إضافة صنف جديد للمخزون
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* اختيار الصنف + زر (+) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">الصنف</label>
            {!addingVariety ? (
              <div className="flex gap-1.5">
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
                >
                  {varieties.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingVariety(true)}
                  title="إضافة صنف جديد للقائمة"
                  className="px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="اسم الصنف الجديد..."
                  value={customVariety}
                  onChange={(e) => setCustomVariety(e.target.value)}
                  className="flex-1 min-w-0 border border-emerald-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNewVariety}
                  className="px-2.5 rounded-xl bg-emerald-600 text-white cursor-pointer shrink-0"
                  title="حفظ الصنف"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingVariety(false);
                    setCustomVariety("");
                  }}
                  className="px-2.5 rounded-xl bg-stone-100 text-stone-600 cursor-pointer shrink-0"
                  title="إلغاء"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* اختيار النوع + زر (+) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">النوع</label>
            {!addingType ? (
              <div className="flex gap-1.5">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setAddingType(true)}
                  title="إضافة نوع جديد للقائمة"
                  className="px-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer shrink-0"
                >
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="اسم النوع الجديد..."
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="flex-1 min-w-0 border border-amber-500 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveNewType}
                  className="px-2.5 rounded-xl bg-amber-500 text-white cursor-pointer shrink-0"
                  title="حفظ النوع"
                >
                  <Check size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingType(false);
                    setCustomType("");
                  }}
                  className="px-2.5 rounded-xl bg-stone-100 text-stone-600 cursor-pointer shrink-0"
                  title="إلغاء"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* العدد */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 block">العدد (فسيلة)</label>
            <input
              type="number"
              min="1"
              placeholder="الكمية"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* التقويم لاختيار التاريخ */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 flex items-center gap-1">
              <Calendar size={13} className="text-emerald-700" />
              <span>تاريخ الإضافة</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-700"
              required
            />
          </div>

          {/* زر الإضافة */}
          <button
            type="submit"
            className="w-full bg-[#122b22] hover:bg-[#1b4033] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer h-[42px]"
          >
            <Plus size={16} /> إضافة للمخزون
          </button>
        </form>
      </div>

      {/* قائمة المخزون (بطاقات للموبايل + جدول للكمبيوتر) */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* عرض البطاقات للموبايل */}
        <div className="md:hidden divide-y divide-stone-100">
          {currentInventory.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400 font-semibold">
              لا توجد أصناف مطابقة في هذا المشتل
            </div>
          ) : (
            currentInventory.map((item) => (
              <div key={item.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <p className="font-extrabold text-stone-900 text-base truncate">
                      {item.variety}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold " +
                          getTypeBadgeClass(item.type)
                        }
                      >
                        {item.type}
                      </span>
                      {item.date && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 font-semibold">
                          <Calendar size={11} />
                          {item.date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-center">
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold">متاح</p>
                      <p className="text-lg font-black text-emerald-700">{item.available}</p>
                    </div>
                    <div className="h-7 w-px bg-stone-200" />
                    <div>
                      <p className="text-[10px] text-stone-400 font-bold">صادر</p>
                      <p className="text-base font-bold text-stone-600">{item.issued}</p>
                    </div>
                  </div>
                </div>

                {/* أزرار التعديل والحذف للموبايل */}
                <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="flex-1 py-2 rounded-xl bg-stone-100 active:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Pencil size={13} /> تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(item)}
                    className="flex-1 py-2 rounded-xl bg-red-50 active:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} /> حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* عرض الجدول للكمبيوتر */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-600 text-xs uppercase border-b border-stone-200">
                <th className="p-4">الصنف</th>
                <th className="p-4">النوع</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الرصيد المتاح</th>
                <th className="p-4">إجمالي الصادر</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-sm">
              {currentInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 text-xs font-bold">
                    لا توجد أصناف مطابقة في هذا المشتل
                  </td>
                </tr>
              ) : (
                currentInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-stone-50">
                    <td className="p-4 font-bold text-stone-800">{item.variety}</td>
                    <td className="p-4">
                      <span
                        className={
                          "px-3 py-1 rounded-full text-xs font-bold " +
                          getTypeBadgeClass(item.type)
                        }
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-stone-500 font-semibold">
                      {item.date || "—"}
                    </td>
                    <td className="p-4 font-extrabold text-emerald-700">{item.available}</td>
                    <td className="p-4 font-bold text-stone-600">{item.issued}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          title="تعديل الصنف"
                          className="p-2 rounded-xl bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-800 transition cursor-pointer"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(item)}
                          title="حذف الصنف"
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

      {/* نافذة تعديل الصنف */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="bg-[#122b22] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold">تعديل بيانات الصنف</h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 block">الصنف</label>
                <select
                  value={editingItem.variety}
                  onChange={(e) =>
                    setEditingItem({
                      id: editingItem.id,
                      nursery: editingItem.nursery,
                      variety: e.target.value,
                      type: editingItem.type,
                      available: editingItem.available,
                      issued: editingItem.issued,
                      date: editingItem.date,
                    })
                  }
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                >
                  {!varieties.includes(editingItem.variety) && (
                    <option value={editingItem.variety}>{editingItem.variety}</option>
                  )}
                  {varieties.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 block">النوع</label>
                <select
                  value={editingItem.type}
                  onChange={(e) =>
                    setEditingItem({
                      id: editingItem.id,
                      nursery: editingItem.nursery,
                      variety: editingItem.variety,
                      type: e.target.value,
                      available: editingItem.available,
                      issued: editingItem.issued,
                      date: editingItem.date,
                    })
                  }
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                >
                  {!types.includes(editingItem.type) && (
                    <option value={editingItem.type}>{editingItem.type}</option>
                  )}
                  {types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 block">الرصيد المتاح</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.available}
                    onChange={(e) =>
                      setEditingItem({
                        id: editingItem.id,
                        nursery: editingItem.nursery,
                        variety: editingItem.variety,
                        type: editingItem.type,
                        available: Number(e.target.value),
                        issued: editingItem.issued,
                        date: editingItem.date,
                      })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-600 block">إجمالي الصادر</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.issued}
                    onChange={(e) =>
                      setEditingItem({
                        id: editingItem.id,
                        nursery: editingItem.nursery,
                        variety: editingItem.variety,
                        type: editingItem.type,
                        available: editingItem.available,
                        issued: Number(e.target.value),
                        date: editingItem.date,
                      })
                    }
                    className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 block">التاريخ</label>
                <input
                  type="date"
                  value={editingItem.date || today}
                  onChange={(e) =>
                    setEditingItem({
                      id: editingItem.id,
                      nursery: editingItem.nursery,
                      variety: editingItem.variety,
                      type: editingItem.type,
                      available: editingItem.available,
                      issued: editingItem.issued,
                      date: e.target.value,
                    })
                  }
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm bg-white"
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
                  onClick={() => setEditingItem(null)}
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