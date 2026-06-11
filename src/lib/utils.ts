import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parsePrice(price: string | number) {
  const value = typeof price === "number" ? price : Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}
