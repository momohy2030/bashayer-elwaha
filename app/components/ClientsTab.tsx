"use client";
import React, { useState } from "react";
import {
  Users,
  FileText,
  Plus,
  Truck,
  Wallet,
  Printer,
  Phone,
  MapPin,
  Search,
  X,
} from "lucide-react";
import {
  Client,
  InventoryItem,
  NurseryId,
  Shipment,
  TreasuryTransaction,
} from "../types";

interface ClientsTabProps {
  selectedNursery: NurseryId;
  inventory: InventoryItem[];
  clients: Client[];
  shipments: Shipment[];
  transactions: TreasuryTransaction[];
  onAddClient: (client: Omit<Client, "id">) => void;
  onCreateShipment: (data: Omit<Shipment, "id" | "total">) => boolean;
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
  const today = new Date().toISOString().split("T")[0];

  // التبويب الداخلي: العملاء والتحميل | المستخلصات والطباعة
  const [subTab, setSubTab] = useState<"clients" | "statements">("clients");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number>(
    clients[0]?.id || 0
  );

  // حقول إضافة عميل جديد
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  // حقول إصدار إذن تحميل
  const [shipClientId, setShipClientId] = useState<string>(
    clients[0] ? String(clients[0].id) : ""
  );
  const [shipInventoryId, setShipInventoryId] = useState<string>("");
  const [shipQty, setShipQty] = useState("");
  const [shipPrice, setShipPrice] = useState("");
  const [shipDate, setShipDate] = useState(today);
  const [shipNotes, setShipNotes] = useState("");

  // نافذة تحصيل دفعة من عميل
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // حساب إجماليات أي عميل
  const getClientSummary = (clientId: number) => {
    const clientShipments = shipments.filter((s) => s.clientId === clientId);
    const clientPayments = transactions.filter(
      (tx) => tx.type === "income" && tx.category === "دفعة عميل #" + clientId
    );
    const totalBilled = clientShipments.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = clientPayments.reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = totalBilled - totalPaid;
    return {
      clientShipments,
      clientPayments,
      totalBilled,
      totalPaid,
      remaining,
    };
  };

  // الأصناف المتاحة حالياً في المشتل النشط
  const availableStock = inventory.filter(
    (item) => item.nursery === selectedNursery && item.available > 0
  );

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddClient({
      name: newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
    });
    setNewName("");
    setNewPhone("");
    setNewAddress("");
  };

  const handleShipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cId = Number(shipClientId || clients[0]?.id);
    const invId = Number(shipInventoryId || availableStock[0]?.id);
    const targetItem = availableStock.find((i) => i.id === invId);

    if (!cId || !targetItem || !shipQty || !shipPrice) {
      alert("تأكد من اختيار العميل والصنف وإدخال الكمية والسعر.");
      return;
    }

    const ok = onCreateShipment({
      date: shipDate || today,
      clientId: cId,
      nursery: selectedNursery,
      inventoryId: targetItem.id,
      variety: targetItem.variety,
      type: targetItem.type,
      quantity: Number(shipQty),
      unitPrice: Number(shipPrice),
      notes: shipNotes.trim(),
    });

    if (ok) {
      setShipQty("");
      setShipPrice("");
      setShipNotes("");
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentClient || !payAmount) return;
    onReceivePayment(paymentClient.id, Number(payAmount), payNotes.trim());
    setPaymentClient(null);
    setPayAmount("");
    setPayNotes("");
  };

  const openStatementForClient = (clientId: number) => {
    setSelectedClientId(clientId);
    setSubTab("statements");
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.includes(clientSearch) ||
      c.phone.includes(clientSearch) ||
      c.address.includes(clientSearch)
  );

  const activeStatementClient =
    clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  const activeSummary = activeStatementClient
    ? getClientSummary(activeStatementClient.id)
    : null;

  return (
    <div className="space-y-5">
      {/* شريط الفصل بين (العملاء والتحميل) و (المستخلصات والطباعة) */}
      <div className="grid grid-cols-2 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs print:hidden">
        <button
          type="button"
          onClick={() => setSubTab("clients")}
          className={
            "py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer " +
            (subTab === "clients"
              ? "bg-[#122b22] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100")
          }
        >
          <Users size={16} />
          <span>العملاء والتحميل</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("statements")}
          className={
            "py-2.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition cursor-pointer " +
            (subTab === "statements"
              ? "bg-[#122b22] text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100")
          }
        >
          <FileText size={16} />
          <span>المستخلصات والطباعة</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* القسم الأول: إدارة العملاء والتحميل */}
      {/* ========================================================= */}
      {subTab === "clients" && (
        <div className="space-y-5">
          {/* 1. إضافة عميل جديد */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 md:p-5 space-y-3">
            <h2 className="text-sm md:text-base font-extrabold text-stone-800">
              إضافة عميل جديد
            </h2>
            <form
              onSubmit={handleAddClientSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
            >
              <input
                type="text"
                placeholder="اسم العميل أو المزرعة"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
                required
              />
              <input
                type="text"
                placeholder="رقم الهاتف"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              />
              <input
                type="text"
                placeholder="العنوان / الموقع"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
              />
              <button
                type="submit"
                className="bg-[#122b22] hover:bg-[#1b4033] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={16} /> إضافة عميل
              </button>
            </form>
          </div>

          {/* 2. إصدار إذن تحميل شحنة من المشتل النشط */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs p-4 md:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm md:text-base font-extrabold text-stone-800 flex items-center gap-2">
                <Truck size={18} className="text-emerald-700" />
                <span>
                  إصدار إذن تحميل ({selectedNursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"})
                </span>
              </h2>
              {shipQty && shipPrice && (
                <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
                  الإجمالي: {(Number(shipQty) * Number(shipPrice)).toLocaleString("en-US")} ج.م
                </span>
              )}
            </div>

            {availableStock.length === 0 ? (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 font-bold">
                لا يوجد رصيد متاح للتحميل في هذا المشتل حالياً.
              </p>
            ) : (
              <form
                onSubmit={handleShipmentSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5"
              >
                <select
                  value={shipClientId || (clients[0] ? String(clients[0].id) : "")}
                  onChange={(e) => setShipClientId(e.target.value)}
                  className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                  required
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={shipInventoryId || (availableStock[0] ? String(availableStock[0].id) : "")}
                  onChange={(e) => setShipInventoryId(e.target.value)}
                  className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                  required
                >
                  {availableStock.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.variety} ({item.type}) - متاح: {item.available}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="العدد (فسيلة)"
                  value={shipQty}
                  onChange={(e) => setShipQty(e.target.value)}
                  className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm"
                  required
                />

                <input
                  type="number"
                  min="1"
                  placeholder="سعر الفسيلة (ج.م)"
                  value={shipPrice}
                  onChange={(e) => setShipPrice(e.target.value)}
                  className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm"
                  required
                />

                <input
                  type="date"
                  value={shipDate}
                  onChange={(e) => setShipDate(e.target.value)}
                  className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                  required
                />

                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Truck size={16} /> تأكيد التحميل
                </button>

                <input
                  type="text"
                  placeholder="ملاحظات الشحنة (اختياري)..."
                  value={shipNotes}
                  onChange={(e) => setShipNotes(e.target.value)}
                  className="sm:col-span-2 lg:col-span-6 border border-stone-200 rounded-xl px-3.5 py-2 text-xs bg-stone-50"
                />
              </form>
            )}
          </div>

          {/* 3. قائمة العملاء وملخص الحسابات */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm md:text-base font-extrabold text-stone-800">
                قائمة العملاء ({filteredClients.length})
              </h2>
              <div className="relative w-full sm:w-64">
                <Search
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                />
                <input
                  type="text"
                  placeholder="بحث عن عميل..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredClients.map((client) => {
                const summary = getClientSummary(client.id);
                return (
                  <div
                    key={client.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <h3 className="text-base font-extrabold text-stone-900">
                        {client.name}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-xs text-stone-500">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={12} /> {client.phone}
                          </span>
                        )}
                        {client.address && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {client.address}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-stone-50 rounded-xl p-2.5 text-center border border-stone-100">
                      <div>
                        <p className="text-[10px] text-stone-500 font-bold">المسحوبات</p>
                        <p className="text-xs sm:text-sm font-extrabold text-stone-800">
                          {summary.totalBilled.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-500 font-bold">المسدد</p>
                        <p className="text-xs sm:text-sm font-extrabold text-emerald-700">
                          {summary.totalPaid.toLocaleString("en-US")}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-stone-500 font-bold">المتبقي</p>
                        <p className="text-xs sm:text-sm font-extrabold text-amber-700">
                          {summary.remaining.toLocaleString("en-US")}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openStatementForClient(client.id)}
                        className="flex-1 bg-[#122b22] hover:bg-[#1b4033] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} /> عرض المستخلص
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentClient(client)}
                        className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wallet size={14} /> تحصيل دفعة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* القسم الثاني: مستخلصات العملاء والطباعة */}
      {/* ========================================================= */}
      {subTab === "statements" && (
        <div className="space-y-4">
          {/* شريط اختيار العميل والطباعة (يختفي عند الطباعة) */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
              <label className="text-xs font-extrabold text-stone-700 shrink-0">
                اختر العميل:
              </label>
              <select
                value={activeStatementClient?.id || ""}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                className="flex-1 border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-white focus:outline-none focus:border-emerald-700"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {activeStatementClient && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPaymentClient(activeStatementClient)}
                  className="flex-1 sm:flex-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Wallet size={15} /> تحصيل دفعة
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none bg-[#122b22] hover:bg-[#1b4033] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> طباعة المستخلص
                </button>
              </div>
            )}
          </div>

          {/* ورقة المستخلص الرسمي الجاهزة للطباعة */}
          {activeStatementClient && activeSummary ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
              {/* الترويسة الرسمية باللوجو */}
              <div className="flex items-center justify-between gap-4 border-b-2 border-[#122b22] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src="/logo.png"
                      alt="بشاير الواحة للإستثمار الزراعي"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-[#122b22]">
                      بشاير الواحة للإستثمار الزراعي
                    </h2>
                    <p className="text-xs text-stone-500 font-bold mt-0.5">
                      مستخلص حساب عميل رسمي — إدارة مشاتل النخيل
                    </p>
                  </div>
                </div>

                <div className="text-left text-xs text-stone-600 space-y-1 shrink-0">
                  <p className="font-extrabold text-stone-900">
                    تاريخ الإصدار: {new Date().toLocaleDateString("ar-EG")}
                  </p>
                  <p className="font-semibold">كود العميل: #{activeStatementClient.id}</p>
                </div>
              </div>

              {/* بيانات العميل */}
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 flex flex-wrap justify-between gap-3 text-sm">
                <div>
                  <span className="text-xs text-stone-500 font-bold block">اسم العميل</span>
                  <span className="font-extrabold text-stone-900">
                    {activeStatementClient.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-bold block">الهاتف</span>
                  <span className="font-bold text-stone-800">
                    {activeStatementClient.phone || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-bold block">العنوان</span>
                  <span className="font-bold text-stone-800">
                    {activeStatementClient.address || "—"}
                  </span>
                </div>
              </div>

              {/* بطاقات الملخص المالي */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#122b22] text-white rounded-2xl p-3.5">
                  <p className="text-[11px] text-emerald-200 font-bold">إجمالي المسحوبات</p>
                  <p className="text-base md:text-xl font-black mt-1">
                    {activeSummary.totalBilled.toLocaleString("en-US")}{" "}
                    <span className="text-xs font-normal">ج.م</span>
                  </p>
                </div>
                <div className="bg-emerald-700 text-white rounded-2xl p-3.5">
                  <p className="text-[11px] text-emerald-100 font-bold">إجمالي المسدد</p>
                  <p className="text-base md:text-xl font-black mt-1">
                    {activeSummary.totalPaid.toLocaleString("en-US")}{" "}
                    <span className="text-xs font-normal">ج.م</span>
                  </p>
                </div>
                <div className="bg-amber-500 text-stone-950 rounded-2xl p-3.5">
                  <p className="text-[11px] font-extrabold">صافي المتبقي</p>
                  <p className="text-base md:text-xl font-black mt-1">
                    {activeSummary.remaining.toLocaleString("en-US")}{" "}
                    <span className="text-xs font-bold">ج.م</span>
                  </p>
                </div>
              </div>

              {/* جدول حركات التحميل */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-stone-800">
                  تفاصيل الشحنات والمسحوبات ({activeSummary.clientShipments.length})
                </h3>
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-right border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-[#122b22] text-white">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">المشتل</th>
                        <th className="p-3">الصنف والنوع</th>
                        <th className="p-3">العدد</th>
                        <th className="p-3">السعر</th>
                        <th className="p-3">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activeSummary.clientShipments.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-5 text-center text-stone-400 text-xs">
                            لا توجد شحنات مسجلة لهذا العميل حتى الآن
                          </td>
                        </tr>
                      ) : (
                        activeSummary.clientShipments.map((s) => (
                          <tr key={s.id} className="hover:bg-stone-50">
                            <td className="p-3 font-semibold text-stone-600">{s.date}</td>
                            <td className="p-3 text-xs font-bold">
                              {s.nursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
                            </td>
                            <td className="p-3 font-bold text-stone-900">
                              {s.variety}{" "}
                              <span className="text-xs text-stone-500">({s.type})</span>
                            </td>
                            <td className="p-3 font-bold">{s.quantity}</td>
                            <td className="p-3">{s.unitPrice.toLocaleString("en-US")}</td>
                            <td className="p-3 font-extrabold text-emerald-800">
                              {s.total.toLocaleString("en-US")} ج.م
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* جدول الدفعات المسددة */}
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold text-stone-800">
                  سجل الدفعات المسددة ({activeSummary.clientPayments.length})
                </h3>
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-right border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-stone-100 text-stone-700 border-b border-stone-200">
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">البيان</th>
                        <th className="p-3">المبلغ المسدد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {activeSummary.clientPayments.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-5 text-center text-stone-400 text-xs">
                            لا توجد دفعات مسددة لهذا العميل حتى الآن
                          </td>
                        </tr>
                      ) : (
                        activeSummary.clientPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="p-3 font-semibold text-stone-600">{p.date}</td>
                            <td className="p-3 text-stone-800">{p.description}</td>
                            <td className="p-3 font-extrabold text-emerald-700">
                              {p.amount.toLocaleString("en-US")} ج.م
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* توقيعات الطباعة */}
              <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-center text-xs font-bold text-stone-700">
                <div>
                  <p>توقيع إدارة المشتل</p>
                  <div className="border-b border-stone-400 w-44 mx-auto mt-8" />
                </div>
                <div>
                  <p>توقيع العميل بالاستلام والمطابقة</p>
                  <div className="border-b border-stone-400 w-44 mx-auto mt-8" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-sm text-stone-400 font-bold">
              أضف عميلاً أولاً لعرض المستخلص الخاص به
            </div>
          )}
        </div>
      )}

      {/* نافذة تحصيل دفعة من العميل */}
      {paymentClient && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="bg-[#122b22] text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                تحصيل دفعة — {paymentClient.name}
              </h3>
              <button
                type="button"
                onClick={() => setPaymentClient(null)}
                className="p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 block">
                  المبلغ المحصّل (ج.م)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="أدخل المبلغ..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 block">
                  ملاحظات (نقدي / تحويل / رقم إيصال)
                </label>
                <input
                  type="text"
                  placeholder="اختياري..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-sm font-bold cursor-pointer"
                >
                  تأكيد التحصيل وإضافة للخزينة
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentClient(null)}
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