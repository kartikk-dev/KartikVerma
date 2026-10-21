export interface InventoryItem {
  name: string;
  sku: string;
  stock: number;
  min: number;
  unit: string;
  state: "Healthy" | "Low" | "Critical";
}

export const inventory: InventoryItem[] = [
  {
    name: "AC Filter 1.5T",
    sku: "HV-FLT-15",
    stock: 24,
    min: 10,
    unit: "pcs",
    state: "Healthy",
  },
  {
    name: "R32 Refrigerant",
    sku: "HV-GAS-R32",
    stock: 6,
    min: 8,
    unit: "cyl",
    state: "Low",
  },
  {
    name: "Universal Relay",
    sku: "EL-REL-01",
    stock: 18,
    min: 6,
    unit: "pcs",
    state: "Healthy",
  },
  {
    name: "Heating Element 2KW",
    sku: "WH-ELM-2K",
    stock: 3,
    min: 5,
    unit: "pcs",
    state: "Critical",
  },
  {
    name: "MCB 20A",
    sku: "EL-MCB-20",
    stock: 36,
    min: 12,
    unit: "pcs",
    state: "Healthy",
  },
  {
    name: "Copper Cable 4mm",
    sku: "EL-CBL-4M",
    stock: 84,
    min: 30,
    unit: "m",
    state: "Healthy",
  },
];
