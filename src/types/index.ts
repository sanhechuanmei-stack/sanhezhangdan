export interface Partner {
  id: string;
  name: string;
  status: 'active' | 'disabled';
  type: 'main' | 'special';
}

export interface SharingRatios {
  [partnerId: string]: number; // 0-100, must sum to 100
}

export interface PrioritySharing {
  partnerId: string;
  percentage: number;
}

export interface Project {
  id: string;
  name: string;
  type: 'internal' | 'cooperation';
  status: 'active' | 'ended' | 'disabled';
  partnerIds: string[];
  sharingRatios: SharingRatios;
  prioritySharing?: PrioritySharing;
  periods?: string[]; // 期次列表，如 ['广州站', '第6期', '2026春季班']
  excludedPeriods?: string[]; // 不参与年终彩蛋的期次
  notes?: string;
  extraFields?: string[]; // 额外字段，如 ['customerName', 'customerPhone']
}

export interface BillRecord {
  id: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  income?: number;
  incomeNote?: string;
  expenseCategory?: string;
  expense?: number;
  expenseNote?: string;
  period?: string; // for offline-course: e.g. "第5期"
  attachment?: string; // base64 data URL
  customerName?: string;
  customerPhone?: string;
}

export interface SharingRecord {
  id: string;
  date: string;
  projectId: string;
  partnerId: string;
  amount: number;
  period?: string;
  note?: string;
  attachment?: string;
  isYearEnd?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

// Derived types used in UI
export interface ProjectFinancials {
  projectId: string;
  totalIncome: number;
  totalExpense: number;
  grossProfit: number;
  priorityAmount: number;    // amount for priority partner (0 if none)
  instantShareable: number;  // (grossProfit - priorityAmount) * 0.85
  yearEndRetained: number;   // (grossProfit - priorityAmount) * 0.15
}

export interface PartnerProjectSummary {
  projectId: string;
  expected: number;
  paid: number;
  unpaid: number;
}

export interface PartnerTotalSummary {
  partnerId: string;
  expected: number;
  paid: number;
  unpaid: number;
  byProject: PartnerProjectSummary[];
}

export interface YearEndBonusData {
  total: number;
  byPartner: {
    partnerId: string;
    amount: number;
    paid: number;
    unpaid: number;
    byProject: { projectId: string; amount: number }[];
  }[];
  byProject: { projectId: string; amount: number }[];
}

export interface ParsedEntry {
  projectId?: string;
  date: string;
  type: 'income' | 'expense';
  amount?: number;
  incomeNote?: string;
  expenseCategory?: string;
  expenseNote?: string;
  period?: string;
}
