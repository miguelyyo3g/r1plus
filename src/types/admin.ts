export interface AdminStat {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

export interface SupplierRecord {
  id: string;
  name: string;
  cif: string;
  category: string;
  email: string;
  phone: string;
  activeSheetsCount: number;
  status: 'active' | 'pending' | 'suspended';
}

export interface ClientRecord {
  id: string;
  name: string;
  company: string;
  cif: string;
  email: string;
  assignedRep: string;
  ordersCount: number;
  totalSpent: number;
}