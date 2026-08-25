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

