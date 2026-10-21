export interface RevenuePoint {
  day: string;
  value: number;
}

export const revenueData: RevenuePoint[] = [
  {
    day: "Mon",
    value: 62000,
  },
  {
    day: "Tue",
    value: 74000,
  },
  {
    day: "Wed",
    value: 68000,
  },
  {
    day: "Thu",
    value: 91000,
  },
  {
    day: "Fri",
    value: 84000,
  },
  {
    day: "Sat",
    value: 102000,
  },
  {
    day: "Sun",
    value: 76000,
  },
];

export const maxRevenue = Math.max(...revenueData.map((item) => item.value));
