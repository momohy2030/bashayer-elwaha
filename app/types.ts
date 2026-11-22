export type NurseryId = "main" | "well";

export interface InventoryItem {
  id: number;
  nursery: NurseryId;
  variety: string;
  type: string;
  available: number;
  issued: number;
  date?: string;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  address: string;
}

export interface Shipment {
  id: number;
  date: string;
  clientId: number;
  nursery: NurseryId;
  inventoryId: number;
  variety: string;
  type: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Worker {
  id: number;
  name: string;
  role: string;
  wageType: "daily" | "monthly"; // يومية أو ثابتة
  rate: number;
}

export interface TreasuryTransaction {
  id: number;
  date: string;
  type: "income" | "expense"; // وارد أو صادر
  category: string;
  amount: number;
  description: string;
  nursery: NurseryId | "general";
}