"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Sprout,
  Users,
  HardHat,
  Wallet,
  Plus,
  MapPin,
  Search,
  LogOut,
} from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { db, auth } from "./lib/firebase";
import {
  Client,
  InventoryItem,
  NurseryId,
  Shipment,
  TreasuryTransaction,
  Worker,
} from "./types";
import AuthScreen from "./components/AuthScreen";
import DashboardOverview from "./components/DashboardOverview";
import ClientsTab from "./components/ClientsTab";
import { LaborTab, TreasuryTab } from "./components/LaborAndTreasury";

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, nursery: "main", variety: "برحي", type: "بنت جورة", available: 150, issued: 0 },
  { id: 2, nursery: "main", variety: "مجدول", type: "مجدوع", available: 85, issued: 0 },
  { id: 3, nursery: "well", variety: "سيوي (صعيدي)", type: "بنت جورة", available: 300, issued: 0 },
  { id: 4, nursery: "well", variety: "برحي", type: "مجدوع", available: 60, issued: 0 },
];

const INITIAL_CLIENTS: Client[] = [
  { id: 1, name: "مزرعة الوادي الأخضر", phone: "01000000000", address: "طريق الواحات" },
];

const INITIAL_WORKERS: Worker[] = [
  { id: 1, name: "أحمد محمود", role: "فني تقليع وتكريب", wageType: "daily", rate: 300 },
  { id: 2, name: "سعيد عبد الله", role: "مشرف ري المشتل", wageType: "monthly", rate: 5500 },
];

export default function BashayerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedNursery, setSelectedNursery] = useState<NurseryId>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);

  const lastSyncedRef = useRef<string>("");

  // 0. مراقبة حالة تسجيل الدخول
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
      if (!currentUser) {
        setLoaded(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 1. قراءة ومزامنة البيانات لحظياً من Firebase Firestore
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "bashayer_erp", "main_data");

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const payload = {
            inventory: data.inventory || INITIAL_INVENTORY,
            clients: data.clients || INITIAL_CLIENTS,
            shipments: data.shipments || [],
            workers: data.workers || INITIAL_WORKERS,
            transactions: data.transactions || [],
          };
          lastSyncedRef.current = JSON.stringify(payload);
          setInventory(payload.inventory);
          setClients(payload.clients);
          setShipments(payload.shipments);
          setWorkers(payload.workers);
          setTransactions(payload.transactions);
        } else {
          const initialPayload = {
            inventory: INITIAL_INVENTORY,
            clients: INITIAL_CLIENTS,
            shipments: [],
            workers: INITIAL_WORKERS,
            transactions: [],
          };
          lastSyncedRef.current = JSON.stringify(initialPayload);
          setDoc(docRef, initialPayload).catch((err) =>
            console.error("خطأ في تهيئة البيانات على Firebase:", err)
          );
        }
        setLoaded(true);
      },
      (error) => {
        console.error("خطأ في الاتصال بـ Firebase:", error);
        setLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 2. حفظ أي تغيير تلقائياً على Firebase Firestore
  useEffect(() => {
    if (!loaded || !user) return;
    const currentPayload = { inventory, clients, shipments, workers, transactions };
    const serialized = JSON.stringify(currentPayload);

    if (serialized === lastSyncedRef.current) return;
    lastSyncedRef.current = serialized;

    setDoc(doc(db, "bashayer_erp", "main_data"), currentPayload).catch((err) =>
      console.error("خطأ في الحفظ على Firebase:", err)
    );
  }, [inventory, clients, shipments, workers, transactions, loaded, user]);

  // إضافة صنف للمخزون
  const [newVariety, setNewVariety] = useState("");
  const [newType, setNewType] = useState<"بنت جورة" | "مجدوع">("بنت جورة");
  const [newQty, setNewQty] = useState("");

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVariety || !newQty) return;
    const newItem: InventoryItem = {
      id: Date.now(),
      nursery: selectedNursery,
      variety: newVariety,
      type: newType,
      available: Number(newQty),
      issued: 0,
    };
    setInventory(inventory.concat([newItem]));
    setNewVariety("");
    setNewQty("");
  };

  // إضافة عميل جديد
  const handleAddClient = (c: Omit<Client, "id">) => {
    const newClient: Client = {
      id: Date.now(),
      name: c.name,
      phone: c.phone,
      address: c.address,
    };
    setClients(clients.concat([newClient]));
  };

  // تحميل شحنة لعميل + خصم من المخزون
  const handleCreateShipment = (data: Omit<Shipment, "id" | "total">): boolean => {
    const targetItem = inventory.find((i) => i.id === data.inventoryId);
    if (!targetItem || targetItem.available < data.quantity) {
      alert("الكمية المطلوبة أكبر من الرصيد المتاح في هذا المشتل!");
      return false;
    }

    const updatedInventory: InventoryItem[] = inventory.map((item) => {
      if (item.id === data.inventoryId) {
        return {
          id: item.id,
          nursery: item.nursery,
          variety: item.variety,
          type: item.type,
          available: item.available - data.quantity,
          issued: item.issued + data.quantity,
        };
      }
      return item;
    });

    setInventory(updatedInventory);

    const newShipment: Shipment = {
      id: Date.now(),
      date: data.date,
      clientId: data.clientId,
      nursery: data.nursery,
      inventoryId: data.inventoryId,
      variety: data.variety,
      type: data.type,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      total: data.quantity * data.unitPrice,
      notes: data.notes,
    };
    setShipments([newShipment].concat(shipments));
    alert("تم تأكيد التحميل وخصم الكمية من رصيد المشتل وإضافتها لمستخلص العميل.");
    return true;
  };

  // استلام دفعة من عميل + إضافتها لوارد الخزينة
  const handleReceivePayment = (clientId: number, amount: number, notes: string) => {
    const client = clients.find((c) => c.id === clientId);
    const noteText = notes ? " (" + notes + ")" : "";
    const tx: TreasuryTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: "income",
      category: "دفعة عميل #" + clientId,
      amount: amount,
      description: "تحصيل دفعة من العميل: " + (client?.name || "") + noteText,
      nursery: selectedNursery,
    };
    setTransactions([tx].concat(transactions));
  };

  // إضافة عامل جديد
  const handleAddWorker = (w: Omit<Worker, "id">) => {
    const newWorker: Worker = {
      id: Date.now(),
      name: w.name,
      role: w.role,
      wageType: w.wageType,
      rate: w.rate,
    };
    setWorkers(workers.concat([newWorker]));
  };

  // صرف مستحقات عامل + خصمها من صادر الخزينة
  const handlePayWorker = (worker: Worker, units: number, nursery: NurseryId) => {
    const total = worker.rate * units;
    const unitLabel = worker.wageType === "daily" ? units + " يوم" : units + " شهر";
    const tx: TreasuryTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: "expense",
      category: "أجور عمالة",
      amount: total,
      description: "صرف مستحقات (" + worker.name + ") - " + unitLabel,
      nursery: nursery,
    };
    setTransactions([tx].concat(transactions));
    alert("تم صرف " + total.toLocaleString("en-US") + " ج.م وتسجيلها في صادر الخزينة.");
  };

  // تسجيل حركة خزينة يدوية
  const handleAddManualTransaction = (tx: Omit<TreasuryTransaction, "id" | "date">) => {
    const newTx: TreasuryTransaction = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      type: tx.type,
      category: tx.category,
      amount: tx.amount,
      description: tx.description,
      nursery: tx.nursery,
    };
    setTransactions([newTx].concat(transactions));
  };

  const currentInventory = inventory
    .filter((item) => item.nursery === selectedNursery)
    .filter((item) => item.variety.includes(searchQuery));

  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", shortLabel: "الرئيسية", icon: LayoutDashboard },
    { id: "inventory", label: "المخزون والتحميل", shortLabel: "المخزون", icon: Sprout },
    { id: "clients", label: "العملاء والمستخلصات", shortLabel: "العملاء", icon: Users },
    { id: "labor", label: "إدارة العمالة", shortLabel: "العمالة", icon: HardHat },
    { id: "treasury", label: "الخزينة (وارد وصادر)", shortLabel: "الخزينة", icon: Wallet },
  ];

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0d211a] flex flex-col items-center justify-center gap-3 text-emerald-200 font-bold">
        <img
          src="/logo.png"
          alt="بشاير الواحة"
          className="w-20 h-20 rounded-2xl bg-white p-1.5 object-contain animate-pulse"
        />
        <span>جاري التحقق من الحساب...</span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#0d211a] flex flex-col items-center justify-center gap-3 text-emerald-200 font-bold">
        <img
          src="/logo.png"
          alt="بشاير الواحة"
          className="w-20 h-20 rounded-2xl bg-white p-1.5 object-contain animate-pulse"
        />
        <span>جاري تحميل ومزامنة بيانات بشاير الواحة...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d211a] text-stone-800 flex flex-col md:flex-row md:p-3 md:gap-3">
      {/* 1. القائمة الجانبية الداكنة — للكمبيوتر والتابلت فقط */}
      <aside className="hidden md:flex md:w-64 text-emerald-100 flex-col justify-between px-3 py-4 print:hidden shrink-0">
        <div>
          <div className="flex items-center gap-3 px-2 pb-6 border-b border-emerald-900/60">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-xs overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="بشاير الواحة للإستثمار الزراعي"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold text-white tracking-wide truncate">
                بشاير الواحة
              </h1>
              <p className="text-[11px] text-emerald-300/90 truncate">
                للإستثمار الزراعي
              </p>
            </div>
          </div>

          <nav className="mt-6 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer " +
                    (isActive
                      ? "bg-[#234e3f] text-white shadow-sm border border-emerald-500/30"
                      : "text-emerald-200/75 hover:bg-[#153328] hover:text-white")
                  }
                >
                  <Icon size={18} className={isActive ? "text-emerald-300" : "text-emerald-400/70"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* ملخص المخزون + بيانات الحساب */}
        <div className="mt-6 space-y-3">
          <div className="bg-[#153328] border border-emerald-800/60 rounded-2xl p-4">
            <p className="text-xs text-emerald-300 font-bold">إجمالي مخزون المشاتل</p>
            <p className="text-xl font-extrabold text-white mt-1">
              {inventory.reduce((a, b) => a + b.available, 0).toLocaleString("en-US")}{" "}
              <span className="text-xs font-normal text-emerald-300">فسيلة</span>
            </p>
            <div className="w-full bg-emerald-950 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-400 h-full w-3/4 rounded-full" />
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-900/60 flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user.displayName || "مستخدم بشاير"}
              </p>
              <p className="text-[11px] text-emerald-400/70 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut(auth)}
              title="تسجيل الخروج"
              className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/30 text-red-300 transition cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. الشريط العلوي المخصص للموبايل فقط */}
      <div className="md:hidden sticky top-0 z-30 bg-[#0d211a]/95 backdrop-blur-md px-4 pt-3 pb-3 space-y-2.5 border-b border-emerald-900/50 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 shadow-xs overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="بشاير الواحة"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-white leading-tight truncate">
                بشاير الواحة
              </h1>
              <p className="text-[10px] text-emerald-300/80 truncate">
                {inventory.reduce((a, b) => a + b.available, 0).toLocaleString("en-US")} فسيلة متاحة
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut(auth)}
            title="تسجيل الخروج"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-500/15 active:bg-red-500/30 text-red-300 text-xs font-bold shrink-0"
          >
            <LogOut size={14} />
            <span>خروج</span>
          </button>
        </div>

        {/* مُبدل المشتل النشط على الموبايل بعرض كامل */}
        <div className="grid grid-cols-2 bg-[#153328] p-1 rounded-xl border border-emerald-800/60">
          <button
            onClick={() => setSelectedNursery("main")}
            className={
              "py-2 rounded-lg text-xs font-extrabold transition " +
              (selectedNursery === "main"
                ? "bg-emerald-500 text-emerald-950 shadow-xs"
                : "text-emerald-200")
            }
          >
            المشتل الرئيسي
          </button>
          <button
            onClick={() => setSelectedNursery("well")}
            className={
              "py-2 rounded-lg text-xs font-extrabold transition " +
              (selectedNursery === "well"
                ? "bg-amber-400 text-stone-950 shadow-xs"
                : "text-emerald-200")
            }
          >
            مشتل على البير
          </button>
        </div>
      </div>

      {/* 3. العمود الرئيسي */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* الشريط العلوي للكمبيوتر فقط */}
        <header className="hidden md:flex px-3 py-2.5 flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-300/60"
            />
            <input
              type="text"
              placeholder="بحث في الأصناف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#153328] border border-emerald-800/60 text-white placeholder:text-emerald-300/50 rounded-full pr-10 pl-4 py-2 text-xs focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-300/80 flex items-center gap-1 font-semibold">
              <MapPin size={14} /> المشتل النشط للعمليات:
            </span>
            <div className="flex bg-[#153328] p-1 rounded-full border border-emerald-800/60">
              <button
                onClick={() => setSelectedNursery("main")}
                className={
                  "px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer " +
                  (selectedNursery === "main"
                    ? "bg-emerald-500 text-emerald-950 shadow"
                    : "text-emerald-200 hover:text-white")
                }
              >
                المشتل الرئيسي
              </button>
              <button
                onClick={() => setSelectedNursery("well")}
                className={
                  "px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer " +
                  (selectedNursery === "well"
                    ? "bg-amber-400 text-stone-950 shadow"
                    : "text-emerald-200 hover:text-white")
                }
              >
                مشتل على البير
              </button>
            </div>
          </div>
        </header>

        {/* مساحة العمل الرئيسية */}
        <main className="flex-1 bg-[#f4f6f5] rounded-t-3xl md:rounded-3xl p-4 pb-24 md:p-7 md:pb-7 shadow-xl overflow-y-auto">
          {activeTab === "dashboard" && (
            <DashboardOverview
              inventory={inventory}
              clients={clients}
              shipments={shipments}
              workers={workers}
              transactions={transactions}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "inventory" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-stone-900">
                  إدارة المخزون - {selectedNursery === "main" ? "المشتل الرئيسي" : "مشتل على البير"}
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  إضافة أصناف جديدة ومتابعة الرصيد المتاح والصادر لكل مشتل
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
                  placeholder="ابحث باسم الصنف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 md:p-5 border-b border-stone-200 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
                  <h2 className="text-sm md:text-base font-bold text-stone-800">
                    إضافة صنف جديد للمخزون
                  </h2>

                  <form
                    onSubmit={handleAddStock}
                    className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2"
                  >
                    <input
                      type="text"
                      placeholder="اسم الصنف (مثلاً: برحي)"
                      value={newVariety}
                      onChange={(e) => setNewVariety(e.target.value)}
                      className="col-span-2 sm:w-auto border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm"
                      required
                    />
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as "بنت جورة" | "مجدوع")}
                      className="border border-stone-300 rounded-xl px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="بنت جورة">بنت جورة</option>
                      <option value="مجدوع">مجدوع</option>
                    </select>
                    <input
                      type="number"
                      placeholder="العدد"
                      value={newQty}
                      onChange={(e) => setNewQty(e.target.value)}
                      className="border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm sm:w-28"
                      required
                    />
                    <button
                      type="submit"
                      className="col-span-2 sm:col-span-1 bg-[#122b22] hover:bg-[#1b4033] active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus size={16} /> إضافة للمخزون
                    </button>
                  </form>
                </div>

                {/* عرض البطاقات الاحترافي للموبايل */}
                <div className="md:hidden divide-y divide-stone-100">
                  {currentInventory.length === 0 ? (
                    <div className="p-6 text-center text-xs text-stone-400 font-semibold">
                      لا توجد أصناف مطابقة في هذا المشتل
                    </div>
                  ) : (
                    currentInventory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <p className="font-extrabold text-stone-900 text-base truncate">
                            {item.variety}
                          </p>
                          <span
                            className={
                              "inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold " +
                              (item.type === "بنت جورة"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800")
                            }
                          >
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-center">
                          <div>
                            <p className="text-[10px] text-stone-400 font-bold">متاح</p>
                            <p className="text-lg font-black text-emerald-700">
                              {item.available}
                            </p>
                          </div>
                          <div className="h-8 w-px bg-stone-200" />
                          <div>
                            <p className="text-[10px] text-stone-400 font-bold">صادر</p>
                            <p className="text-base font-bold text-stone-600">
                              {item.issued}
                            </p>
                          </div>
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
                        <th className="p-4">الرصيد المتاح</th>
                        <th className="p-4">إجمالي الصادر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-sm">
                      {currentInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50">
                          <td className="p-4 font-bold text-stone-800">{item.variety}</td>
                          <td className="p-4">
                            <span
                              className={
                                "px-3 py-1 rounded-full text-xs font-bold " +
                                (item.type === "بنت جورة"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800")
                              }
                            >
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 font-extrabold text-emerald-700">{item.available}</td>
                          <td className="p-4 font-bold text-stone-600">{item.issued}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clients" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-stone-900">
                  العملاء والمستخلصات
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  إصدار أذونات التحميل من المشتل النشط، متابعة حسابات العملاء، وطباعة المستخلصات
                </p>
              </div>
              <ClientsTab
                selectedNursery={selectedNursery}
                inventory={inventory}
                clients={clients}
                shipments={shipments}
                transactions={transactions}
                onAddClient={handleAddClient}
                onCreateShipment={handleCreateShipment}
                onReceivePayment={handleReceivePayment}
              />
            </div>
          )}

          {activeTab === "labor" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-stone-900">
                  إدارة العمالة والأجور
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  تسجيل العمالة باليومية والعمالة الثابتة وصرف المستحقات مباشرة من الخزينة
                </p>
              </div>
              <LaborTab
                selectedNursery={selectedNursery}
                workers={workers}
                onAddWorker={handleAddWorker}
                onPayWorker={handlePayWorker}
              />
            </div>
          )}

          {activeTab === "treasury" && (
            <div className="space-y-5">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-stone-900">
                  الخزينة (وارد وصادر)
                </h1>
                <p className="text-xs text-stone-500 mt-1">
                  متابعة التدفقات النقدية، تحصيلات العملاء، ومصروفات التشغيل والعمالة
                </p>
              </div>
              <TreasuryTab
                transactions={transactions}
                onAddManualTransaction={handleAddManualTransaction}
              />
            </div>
          )}
        </main>
      </div>

      {/* 4. شريط التنقل السفلي الاحترافي للموبايل فقط */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d211a]/95 backdrop-blur-lg border-t border-emerald-900/70 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] print:hidden">
        <div className="grid grid-cols-5 gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={
                  "flex flex-col items-center justify-center gap-1 py-1.5 rounded-2xl transition-all " +
                  (isActive
                    ? "bg-[#234e3f] text-white"
                    : "text-emerald-200/65 active:bg-[#153328]")
                }
              >
                <Icon
                  size={20}
                  className={isActive ? "text-emerald-300" : "text-emerald-300/60"}
                />
                <span className="text-[10px] font-bold leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}