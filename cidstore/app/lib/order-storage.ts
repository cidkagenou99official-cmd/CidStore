import { storageKey } from "@/app/lib/mock-data";
import type { Order } from "@/app/types";

export function getStoredOrders(): Order[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawOrders = localStorage.getItem(storageKey);
    return rawOrders ? (JSON.parse(rawOrders) as Order[]) : [];
  } catch {
    return [];
  }
}

export function persistOrders(orders: Order[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(orders));
}
