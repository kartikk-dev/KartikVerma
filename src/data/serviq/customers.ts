export interface Customer {
  name: string;
  company: string;
  phone: string;
  location: string;
  openJobs: number;
  lifetime: string;
}

export const customers: Customer[] = [
  {
    name: "Arun Sharma",
    company: "Home",
    phone: "+91 98••• 2148",
    location: "Rajpur Road",
    openJobs: 1,
    lifetime: "₹18,420",
  },
  {
    name: "Neha Kapoor",
    company: "Home",
    phone: "+91 97••• 6621",
    location: "Ballupur",
    openJobs: 1,
    lifetime: "₹11,850",
  },
  {
    name: "Vikram Singh",
    company: "Singh Solar",
    phone: "+91 88••• 4922",
    location: "Clement Town",
    openJobs: 1,
    lifetime: "₹34,200",
  },
  {
    name: "Rohan Verma",
    company: "Home",
    phone: "+91 99••• 7302",
    location: "Vasant Vihar",
    openJobs: 0,
    lifetime: "₹8,940",
  },
];
