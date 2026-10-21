export interface WorkOrder {
  id: string;
  customer: string;
  service: string;
  category: string;
  location: string;
  technician: string;
  technicianId: string;
  status: string;
  priority: string;
  scheduled: string;
  amount: number;
  issue: string;
  created: string;
}

export const workOrders: WorkOrder[] = [
  {
    id: "WO-1048",
    customer: "Arun Sharma",
    service: "Split AC Repair",
    category: "HVAC",
    location: "Rajpur Road, Dehradun",
    technician: "Rahul Mehta",
    technicianId: "tech-01",
    status: "In Progress",
    priority: "High",
    scheduled: "09:30 AM",
    amount: 2180,
    issue: "AC running but room is not cooling properly.",
    created: "Today, 08:12 AM",
  },
  {
    id: "WO-1049",
    customer: "Neha Kapoor",
    service: "Washing Machine Repair",
    category: "Appliance",
    location: "Ballupur, Dehradun",
    technician: "Aman Rawat",
    technicianId: "tech-02",
    status: "En Route",
    priority: "Medium",
    scheduled: "10:45 AM",
    amount: 1450,
    issue: "Machine stops during spin cycle.",
    created: "Today, 08:26 AM",
  },
  {
    id: "WO-1050",
    customer: "Vikram Singh",
    service: "Solar Maintenance",
    category: "Solar",
    location: "Clement Town, Dehradun",
    technician: "Priya Joshi",
    technicianId: "tech-03",
    status: "Assigned",
    priority: "Low",
    scheduled: "11:15 AM",
    amount: 3200,
    issue: "Quarterly panel cleaning and inspection.",
    created: "Today, 08:44 AM",
  },
  {
    id: "WO-1051",
    customer: "Rohan Verma",
    service: "Water Heater Service",
    category: "Appliance",
    location: "Vasant Vihar, Dehradun",
    technician: "Neeraj Kumar",
    technicianId: "tech-04",
    status: "Completed",
    priority: "Medium",
    scheduled: "08:30 AM",
    amount: 1850,
    issue: "Heating performance reduced.",
    created: "Today, 07:15 AM",
  },
  {
    id: "WO-1052",
    customer: "Shreya Malhotra",
    service: "Refrigerator Repair",
    category: "Appliance",
    location: "Jakhan, Dehradun",
    technician: "Rahul Mehta",
    technicianId: "tech-01",
    status: "Waiting for Parts",
    priority: "High",
    scheduled: "01:30 PM",
    amount: 4200,
    issue: "Compressor relay needs replacement.",
    created: "Today, 09:05 AM",
  },
  {
    id: "WO-1053",
    customer: "Aditya Bansal",
    service: "Electrical Inspection",
    category: "Electrical",
    location: "Sahastradhara Road, Dehradun",
    technician: "Aman Rawat",
    technicianId: "tech-02",
    status: "New",
    priority: "High",
    scheduled: "02:15 PM",
    amount: 1100,
    issue: "Frequent circuit trips in kitchen line.",
    created: "Today, 09:22 AM",
  },
];
