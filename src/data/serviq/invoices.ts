export interface Invoice {
  id: string;
  customer: string;
  workOrder: string;
  amount: number;
  status: "Draft" | "Paid" | "Overdue";
  date: string;
}

export const invoices: Invoice[] = [
  {
    id: "INV-2026-0182",
    customer: "Arun Sharma",
    workOrder: "WO-1048",
    amount: 2180,
    status: "Draft",
    date: "08 Oct 2026",
  },
  {
    id: "INV-2026-0181",
    customer: "Rohan Verma",
    workOrder: "WO-1051",
    amount: 1850,
    status: "Paid",
    date: "08 Oct 2026",
  },
  {
    id: "INV-2026-0179",
    customer: "Vikram Singh",
    workOrder: "WO-1045",
    amount: 3200,
    status: "Paid",
    date: "07 Oct 2026",
  },
  {
    id: "INV-2026-0178",
    customer: "Meera Sethi",
    workOrder: "WO-1041",
    amount: 2750,
    status: "Overdue",
    date: "06 Oct 2026",
  },
];
