import {
  workOrders as initialWorkOrders,
  type WorkOrder,
} from "../../data/serviq/workOrders";

import {
  technicians as initialTechnicians,
  type Technician,
} from "../../data/serviq/technicians";

import {
  customers as initialCustomers,
  type Customer,
} from "../../data/serviq/customers";

import {
  inventory as initialInventory,
  type InventoryItem,
} from "../../data/serviq/inventory";

import {
  invoices as initialInvoices,
  type Invoice,
} from "../../data/serviq/invoices";

import {
  revenueData as initialRevenueData,
  type RevenuePoint,
} from "../../data/serviq/analytics";

const STORAGE_KEY = "serviq_app_data_v1";
const CHANGE_EVENT = "serviq:data-changed";

export interface ServiqActivity {
  id: string;
  message: string;
  createdAt: string;
  type: "work-order" | "customer" | "inventory" | "invoice" | "system";
}

export interface ServiqState {
  version: 1;
  updatedAt: string;
  workOrders: WorkOrder[];
  technicians: Technician[];
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: Invoice[];
  revenueData: RevenuePoint[];
  activities: ServiqActivity[];
}

type Identified<T> = T & { id?: string };

type NewWorkOrder = Omit<WorkOrder, "id"> & { id?: string };
type NewTechnician = Omit<Technician, "id"> & { id?: string };

export type CustomerInput = Customer;
export type InventoryInput = Omit<InventoryItem, "state"> & {
  state: InventoryItem["state"];
};
export type InvoiceInput = Invoice;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const makeId = (prefix: string): string => {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
};

const createInitialState = (): ServiqState => ({
  version: 1,
  updatedAt: new Date().toISOString(),
  workOrders: clone(initialWorkOrders),
  technicians: clone(initialTechnicians),
  customers: clone(initialCustomers),
  inventory: clone(initialInventory),
  invoices: clone(initialInvoices),
  revenueData: clone(initialRevenueData),
  activities: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normaliseState = (value: unknown): ServiqState => {
  const defaults = createInitialState();

  if (!isRecord(value) || value.version !== 1) {
    return defaults;
  }

  return {
    version: 1,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : defaults.updatedAt,

    workOrders: Array.isArray(value.workOrders)
      ? (value.workOrders as WorkOrder[])
      : defaults.workOrders,

    technicians: Array.isArray(value.technicians)
      ? (value.technicians as Technician[])
      : defaults.technicians,

    customers: Array.isArray(value.customers)
      ? (value.customers as Customer[])
      : defaults.customers,

    inventory: Array.isArray(value.inventory)
      ? (value.inventory as InventoryItem[])
      : defaults.inventory,

    invoices: Array.isArray(value.invoices)
      ? (value.invoices as Invoice[])
      : defaults.invoices,

    revenueData: Array.isArray(value.revenueData)
      ? (value.revenueData as RevenuePoint[])
      : defaults.revenueData,

    activities: Array.isArray(value.activities)
      ? (value.activities as ServiqActivity[])
      : [],
  };
};

const readStoredState = (): ServiqState => {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return createInitialState();
    }

    return normaliseState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
};

let cachedState: ServiqState | null = null;

export const getState = (): ServiqState => {
  if (!cachedState) {
    cachedState = readStoredState();
  }

  return clone(cachedState);
};

const notifyStateChange = (state: ServiqState): void => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ServiqState>(CHANGE_EVENT, {
      detail: clone(state),
    }),
  );
};

const commit = <T>(mutation: (state: ServiqState) => T): T => {
  const state = getState();
  const result = mutation(state);

  state.updatedAt = new Date().toISOString();
  cachedState = clone(state);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      throw new Error(
        "SERVIQ could not save the changes in this browser. Check available storage and try again.",
      );
    }
  }

  notifyStateChange(state);

  return clone(result);
};

export const subscribe = (
  callback: (state: ServiqState) => void,
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event): void => {
    const customEvent = event as CustomEvent<ServiqState>;
    callback(clone(customEvent.detail));
  };

  window.addEventListener(CHANGE_EVENT, listener);

  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
  };
};

export const createWorkOrder = (input: NewWorkOrder): WorkOrder =>
  commit((state) => {
    const order: WorkOrder = {
      ...input,
      id: input.id || makeId("WO"),
    };

    if (state.workOrders.some((item) => item.id === order.id)) {
      throw new Error(`Work order ${order.id} already exists.`);
    }

    state.workOrders.unshift(order);

    addActivityToState(state, `Work order ${order.id} created`, "work-order");

    return order;
  });

export const updateWorkOrder = (
  id: string,
  changes: Partial<Omit<WorkOrder, "id">>,
): WorkOrder | null =>
  commit((state) => {
    const order = state.workOrders.find((item) => item.id === id);

    if (!order) return null;

    Object.assign(order, changes, { id });

    addActivityToState(state, `Work order ${id} updated`, "work-order");

    return order;
  });

export const deleteWorkOrder = (id: string): boolean =>
  commit((state) => {
    const previousLength = state.workOrders.length;

    state.workOrders = state.workOrders.filter((item) => item.id !== id);

    const deleted = state.workOrders.length !== previousLength;

    if (deleted) {
      addActivityToState(state, `Work order ${id} deleted`, "work-order");
    }

    return deleted;
  });

export const createTechnician = (input: NewTechnician): Technician =>
  commit((state) => {
    const technician: Technician = {
      ...input,
      id: input.id || makeId("TECH"),
    };

    if (state.technicians.some((item) => item.id === technician.id)) {
      throw new Error(`Technician ${technician.id} already exists.`);
    }

    state.technicians.push(technician);

    addActivityToState(state, `${technician.name} added to the team`, "system");

    return technician;
  });

export const updateTechnician = (
  id: string,
  changes: Partial<Omit<Technician, "id">>,
): Technician | null =>
  commit((state) => {
    const technician = state.technicians.find((item) => item.id === id);

    if (!technician) return null;

    Object.assign(technician, changes, { id });

    addActivityToState(state, `${technician.name} updated`, "system");

    return technician;
  });

export const deleteTechnician = (id: string): boolean =>
  commit((state) => {
    const technician = state.technicians.find((item) => item.id === id);

    if (!technician) return false;

    state.technicians = state.technicians.filter((item) => item.id !== id);

    addActivityToState(
      state,
      `${technician.name} removed from the team`,
      "system",
    );

    return true;
  });

export const createCustomer = (input: CustomerInput): Customer =>
  commit((state) => {
    const exists = state.customers.some(
      (item) =>
        item.name.trim().toLowerCase() === input.name.trim().toLowerCase(),
    );

    if (exists) {
      throw new Error(`Customer "${input.name}" already exists.`);
    }

    state.customers.unshift(input);

    addActivityToState(state, `Customer ${input.name} added`, "customer");

    return input;
  });

export const updateCustomer = (
  currentName: string,
  changes: Partial<Customer>,
): Customer | null =>
  commit((state) => {
    const customer = state.customers.find((item) => item.name === currentName);

    if (!customer) return null;

    const updatedName = changes.name?.trim();

    if (
      updatedName &&
      state.customers.some(
        (item) =>
          item !== customer &&
          item.name.toLowerCase() === updatedName.toLowerCase(),
      )
    ) {
      throw new Error(`Customer "${updatedName}" already exists.`);
    }

    Object.assign(customer, changes);

    return customer;
  });

export const deleteCustomer = (name: string): boolean =>
  commit((state) => {
    const previousLength = state.customers.length;

    state.customers = state.customers.filter((item) => item.name !== name);

    const deleted = state.customers.length !== previousLength;

    if (deleted) {
      addActivityToState(state, `Customer ${name} deleted`, "customer");
    }

    return deleted;
  });

export const createInventoryItem = (input: InventoryInput): InventoryItem =>
  commit((state) => {
    if (state.inventory.some((item) => item.sku === input.sku)) {
      throw new Error(`Inventory SKU "${input.sku}" already exists.`);
    }

    const item: InventoryItem = { ...input };

    state.inventory.push(item);

    addActivityToState(state, `Inventory item ${item.name} added`, "inventory");

    return item;
  });

export const updateInventoryItem = (
  sku: string,
  changes: Partial<InventoryItem>,
): InventoryItem | null =>
  commit((state) => {
    const item = state.inventory.find((entry) => entry.sku === sku);

    if (!item) return null;

    Object.assign(item, changes, { sku });

    return item;
  });

export const deleteInventoryItem = (sku: string): boolean =>
  commit((state) => {
    const previousLength = state.inventory.length;

    state.inventory = state.inventory.filter((item) => item.sku !== sku);

    return state.inventory.length !== previousLength;
  });

export const createInvoice = (input: InvoiceInput): Invoice =>
  commit((state) => {
    if (state.invoices.some((item) => item.id === input.id)) {
      throw new Error(`Invoice "${input.id}" already exists.`);
    }

    state.invoices.unshift(input);

    addActivityToState(state, `Invoice ${input.id} created`, "invoice");

    return input;
  });

export const updateInvoice = (
  id: string,
  changes: Partial<Omit<Invoice, "id">>,
): Invoice | null =>
  commit((state) => {
    const invoice = state.invoices.find((item) => item.id === id);

    if (!invoice) return null;

    Object.assign(invoice, changes, { id });

    addActivityToState(state, `Invoice ${id} updated`, "invoice");

    return invoice;
  });

export const deleteInvoice = (id: string): boolean =>
  commit((state) => {
    const previousLength = state.invoices.length;

    state.invoices = state.invoices.filter((item) => item.id !== id);

    return state.invoices.length !== previousLength;
  });

export const setRevenueData = (revenueData: RevenuePoint[]): RevenuePoint[] =>
  commit((state) => {
    state.revenueData = clone(revenueData);
    return state.revenueData;
  });

export const addActivity = (
  message: string,
  type: ServiqActivity["type"] = "system",
): ServiqActivity =>
  commit((state) => addActivityToState(state, message, type));

const addActivityToState = (
  state: ServiqState,
  message: string,
  type: ServiqActivity["type"],
): ServiqActivity => {
  const activity: ServiqActivity = {
    id: makeId("ACT"),
    message,
    createdAt: new Date().toISOString(),
    type,
  };

  state.activities.unshift(activity);
  state.activities = state.activities.slice(0, 100);

  return activity;
};

export const resetDemoData = (): ServiqState => {
  const state = createInitialState();

  cachedState = clone(state);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      throw new Error(
        "SERVIQ could not reset data because browser storage is unavailable.",
      );
    }
  }

  notifyStateChange(state);

  return clone(state);
};
