export interface Organization {
  id: string;
  name: string;
  website: string;
  industry: string;
  notes: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
  deals?: Deal[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_title: string;
  organization_id: string | null;
  status: 'lead' | 'qualified' | 'customer';
  created_at: string;
  updated_at: string;
  organization_name?: string | null;
  deals?: Deal[];
  activities?: Activity[];
}

export interface Deal {
  id: string;
  name: string;
  organization_id: string | null;
  contact_id: string | null;
  stage: 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  value: number;
  close_date: string | null;
  created_at: string;
  updated_at: string;
  organization_name?: string | null;
  contact_name?: string | null;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  type: 'note' | 'call' | 'email';
  contact_id: string | null;
  deal_id: string | null;
  description: string;
  activity_date: string;
  due_date: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
  contact_name?: string | null;
  deal_name?: string | null;
}

export interface DashboardStats {
  dealsWonPerMonth: { month: string; count: number }[];
  revenuePerMonth: { month: string; total: number }[];
  recentActivity: Activity[];
  tasks: Activity[];
}

export const DEAL_STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

export const DEAL_STAGE_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export const CONTACT_STATUSES = ['lead', 'qualified', 'customer'] as const;

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  customer: 'Customer',
};

export const ACTIVITY_TYPES = ['note', 'call', 'email'] as const;
