export type ConnectionStatus = "connected" | "disconnected" | "pending" | "error";

export type ConnectionInfo = {
  label: string;
  status: ConnectionStatus;
  email?: string;
  requiresUpgrade?: boolean;
};

export type ReminderStatus = "active" | "paused" | "completed" | "cancelled";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly";

export interface Reminder {
  id: string;
  auth_user_id?: string;
  title: string;
  description?: string | null;
  status: ReminderStatus;
  timezone: string;
  due_at: string;
  next_run_at: string;
  recurrence: RecurrenceType;
  channel: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskListStatus = "active" | "archived";

export interface TaskList {
  id: string;
  auth_user_id: string;
  name: string;
  description: string | null;
  status: TaskListStatus;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  auth_user_id: string;
  task_list_id: string;
  contact_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  recipient_name?: string | null;
  reminder_id?: string | null;
  reminder_due_at?: string | null;
  reminder_status?: string | null;
  reminder_channel?: string | null;
  recurrence_rule?: "none" | "daily" | "weekly" | "monthly" | null;
  recurrence_timezone?: string | null;
  next_occurrence_at?: string | null;
  list_name?: string | null;
  is_important?: boolean;
}

export type LedgerDirection = "receivable" | "payable";
export type LedgerStatus = "pending" | "partially_paid" | "paid" | "cancelled";

export interface LedgerItem {
  id: string;
  auth_user_id: string;
  contact_id: string;
  direction: LedgerDirection;
  amount: number;
  currency: string;
  title: string;
  description: string | null;
  status: LedgerStatus;
  original_amount: number;
  remaining_amount: number;
  task_id: string | null;
  reminder_id: string | null;
  due_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  contact_name?: string;
}

export interface PaymentTransaction {
  id: string;
  auth_user_id: string;
  ledger_item_id: string;
  amount: number;
  currency: string;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

export interface ContactBalance {
  receivables: number;
  payables: number;
  net: number;
  currency: string;
}

