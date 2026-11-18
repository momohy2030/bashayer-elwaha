"use client";
import React, { useState } from "react";
import { UserPlus, Truck, FileText, Banknote, Printer } from "lucide-react";
import { Client, InventoryItem, NurseryId, Shipment, TreasuryTransaction } from "../types";

interface ClientsTabProps {
  selectedNursery: NurseryId;
  inventory: InventoryItem[];
  clients: Client[];
  shipments: Shipment[];
  transactions: TreasuryTransaction[];
  onAddClient: (client: Omit<Client, "id">) => void;
  onCreateShipment: (shipment: Omit<Shipment, "id" | "total">) => boolean;
  onReceivePayment: (clientId: number, amount: number, notes: string) => void;
}

export default function ClientsTab({
  selectedNursery,
  inventory,
  clients,
  shipments,
  transactions,
  onAddClient,
  onCreateShipment,
  onReceivePayment,
}: ClientsTabProps) {
  const [selectedClientId, setSelectedClientId] = useState<number>(clients[0]?.id || 0);

  // فورم عميل جديد
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // فورم إذن تحميل
  const [invId, setInvId] = useState<number>(0);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // فورم دفعة مالية
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const nurseryStock = inventory.filter((i) => i.nursery === selectedNursery && i.available > 0);
  const activeClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddClient({ name, phone, address });
    setName("");
    setPhone("");
    setAddress("");
  };

  const handleLoadOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const item = nurseryStock.find((i) => i.id === Number(invId));
    if (!activeClient || !item || !qty || !price) return;

    const success = onCreateShipment({
      date: new Date().toISOString().split("T")[0],
      clientId: activeClient.id,
      nursery: selectedNursery,
      inventoryId: item.id,
      variety: item.variety,
      type: item.type,
      quantity: Number(qty),
      unitPrice: Number(price),
      notes,
    });

    if (success) {
      setQty("");
      setPrice("");
      setNotes("");
    }
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient || !payAmount) return;
    onReceivePayment(activeClient.id, Number(payAmount), payNotes);
    setPayAmount("");
    setPayNotes("");
  };

  // حسابات مستخلص العميل النشط
  const clientShipments = shipments.filter((s) => s.clientId === activeClient?.id);
  const clientPayments = transactions.filter(
    (t) => t.type === "income" && t.category === `دفعة عميل #${activeClient?.id}`
  );

  const totalBilled = clientShipments.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = clientPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = totalBilled - totalPaid;

  return (
    <div className="space-y-6">
      {/* إضافة عميل جديد + اختيار العميل */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleNewClient}
          className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3"
        >
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <UserPlus size={18} className="text-emerald-700" /> إضافة عميل جديد
          </h3>
          <input
            type="text"
            placeholder="اسم العميل أو الشركة"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="الموقع / المزرعة"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2 rounded-lg text-sm font-bold"
          >
            حفظ العميل
          </button>
        </form>

        {/* تسجيل إذن تحميل للعميل من المشتل النشط */}
        <form
          onSubmit={handleLoadOrder}
          className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3"
        >
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-bold text-stone-800 flex items-center gap-2">
              <Truck size={18} className="text-amber-600" /> إذن تحميل وصادر من (
              {selectedNursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"})
            </h3>
            <select
              value={activeClient?.id || ""}
              onChange={(e) => setSelectedClientId(Number(e.target.value))}
              className="border-2 border-emerald-600 rounded-lg px-3 py-1.5 text-sm font-bold bg-emerald-50 text-emerald-950"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  العميل: {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <select
              value={invId}
              onChange={(e) => setInvId(Number(e.target.value))}
              className="sm:col-span-2 border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
              required
            >
              <option value={0}>-- اختر الصنف المتاح بالمشتل --</option>
              {nurseryStock.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.variety} ({item.type}) - متاح: {item.available}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="العدد المُحمّل"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <input
              type="number"
              placeholder="سعر الفسيلة"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ملاحظات التحميل (رقم السيارة / السائق...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-bold"
            >
              تأكيد التحميل والخصم
            </button>
          </div>
        </form>
      </div>

      {/* مستخلص العميل التفصيلي */}
      {activeClient && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-stone-50 border-b border-stone-200 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-extrabold text-stone-800 flex items-center gap-2">
                <FileText className="text-emerald-700" /> مستخلص حساب العميل: {activeClient.name}
              </h2>
              <p className="text-xs text-stone-500">
                الهاتف: {activeClient.phone || "-"} | الموقع: {activeClient.address || "-"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-stone-700"
              >
                <Printer size={15} /> طباعة المستخلص
              </button>
            </div>
          </div>

          {/* ملخص مالي للعميل + تحصيل دفعة */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-stone-200">
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
              <p className="text-xs text-stone-500">إجمالي المسحوبات</p>
              <p className="text-xl font-extrabold text-stone-800 mt-1">
                {totalBilled.toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700">إجمالي المدفوع</p>
              <p className="text-xl font-extrabold text-emerald-800 mt-1">
                {totalPaid.toLocaleString()} ج.م
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-800">المتبقي على العميل</p>
              <p className="text-xl font-extrabold text-amber-900 mt-1">
                {remainingBalance.toLocaleString()} ج.م
              </p>
            </div>

            {/* تحصيل دفعة */}
            <form onSubmit={handlePayment} className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <input
                  type="number"
                  placeholder="مبلغ الدفعة"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-2.5 py-1.5 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <Banknote size={14} /> تحصيل
                </button>
              </div>
              <input
                type="text"
                placeholder="بيان الدفعة (نقدي / تحويل)"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-2.5 py-1 text-xs"
              />
            </form>
          </div>

          {/* جدول الأصناف الصادرة للعميل */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-stone-100 text-stone-600 border-b border-stone-200">
                <tr>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">جهة التحميل</th>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">العدد</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3">الإجمالي</th>
                  <th className="p-3">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {clientShipments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-stone-400">
                      لا توجد حركات تحميل مسجلة لهذا العميل حتى الآن.
                    </td>
                  </tr>
                ) : (
                  clientShipments.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50">
                      <td className="p-3">{s.date}</td>
                      <td className="p-3 font-semibold">
                        {s.nursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
                      </td>
                      <td className="p-3 font-bold">{s.variety}</td>
                      <td className="p-3">{s.type}</td>
                      <td className="p-3 font-bold text-emerald-700">{s.quantity}</td>
                      <td className="p-3">{s.unitPrice.toLocaleString()}</td>
                      <td className="p-3 font-extrabold">{s.total.toLocaleString()} ج.م</td>
                      <td className="p-3 text-stone-500 text-xs">{s.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}