export interface Technician {
  id: string;
  name: string;
  initials: string;
  role: string;
  status: string;
  zone: string;
  jobs: number;
  rating: number;
  color: string;
}

export const technicians: Technician[] = [
  {
    id: "tech-01",
    name: "Rahul Mehta",
    initials: "RM",
    role: "Senior HVAC Technician",
    status: "Working",
    zone: "Rajpur Road",
    jobs: 4,
    rating: 4.9,
    color: "gold",
  },
  {
    id: "tech-02",
    name: "Aman Rawat",
    initials: "AR",
    role: "Appliance Technician",
    status: "En Route",
    zone: "Ballupur",
    jobs: 3,
    rating: 4.8,
    color: "blue",
  },
  {
    id: "tech-03",
    name: "Priya Joshi",
    initials: "PJ",
    role: "Solar Specialist",
    status: "Available",
    zone: "Clement Town",
    jobs: 2,
    rating: 5.0,
    color: "green",
  },
  {
    id: "tech-04",
    name: "Neeraj Kumar",
    initials: "NK",
    role: "Appliance Technician",
    status: "Available",
    zone: "Vasant Vihar",
    jobs: 2,
    rating: 4.7,
    color: "purple",
  },
];
