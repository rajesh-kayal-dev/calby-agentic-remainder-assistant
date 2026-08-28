import { apiFetch } from "./api";
import { LedgerItem, PaymentTransaction, ContactBalance, LedgerDirection, LedgerStatus } from "./types";

export interface UserLedgerSummary {
  totalReceivables: number;
  totalPayables: number;
  netBalance: number;
  activeCount: number;
  unpaidCount: number;
  paidCount: number;
}

export async function fetchLedgerSummary(
  token: string,
): Promise<{ summary: UserLedgerSummary }> {
  return apiFetch<{ summary: UserLedgerSummary }>("/api/money/summary", { token });
}

export async function createLedgerItem(
  token: string,
  body: {
    contactId?: string | null;
    personName?: string | null;
    direction: LedgerDirection;
    amount: number;
    currency?: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    dueAt?: string | null;
    reminderAt?: string | null;
    taskId?: string | null;
    reminderId?: string | null;
  },
): Promise<{ ledgerItem: LedgerItem }> {
  return apiFetch<{ ledgerItem: LedgerItem }>("/api/money", {
    method: "POST",
    token,
    body,
  });
}

export async function updateLedgerItemApi(
  token: string,
  id: string,
  body: {
    title?: string;
    amount?: number;
    direction?: LedgerDirection;
    dueAt?: string | null;
    notes?: string | null;
    contactId?: string | null;
  },
): Promise<{ ledgerItem: LedgerItem }> {
  return apiFetch<{ ledgerItem: LedgerItem }>(`/api/money/${id}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteLedgerItemApi(
  token: string,
  id: string,
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/money/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function reopenLedgerItemApi(
  token: string,
  id: string,
): Promise<{ ledgerItem: LedgerItem }> {
  return apiFetch<{ ledgerItem: LedgerItem }>(`/api/money/${id}/reopen`, {
    method: "POST",
    token,
  });
}

export async function fetchLedgerItems(
  token: string,
  filters?: {
    status?: LedgerStatus;
    direction?: LedgerDirection;
    contactId?: string;
    search?: string;
  },
): Promise<{ ledgerItems: LedgerItem[] }> {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append("status", filters.status);
  if (filters?.direction) queryParams.append("direction", filters.direction);
  if (filters?.contactId) queryParams.append("contactId", filters.contactId);
  if (filters?.search) queryParams.append("search", filters.search);

  const queryStr = queryParams.toString();
  const url = `/api/money${queryStr ? `?${queryStr}` : ""}`;

  return apiFetch<{ ledgerItems: LedgerItem[] }>(url, { token });
}

export async function fetchLedgerItem(
  token: string,
  id: string,
): Promise<{ ledgerItem: LedgerItem; payments: PaymentTransaction[] }> {
  return apiFetch<{ ledgerItem: LedgerItem; payments: PaymentTransaction[] }>(`/api/money/${id}`, {
    token,
  });
}

export async function recordPayment(
  token: string,
  id: string,
  body: {
    amount: number;
    currency: string;
    notes?: string | null;
    paidAt?: string | null;
  },
): Promise<{ payment: PaymentTransaction; ledgerItem: LedgerItem }> {
  return apiFetch<{ payment: PaymentTransaction; ledgerItem: LedgerItem }>(`/api/money/${id}/payments`, {
    method: "POST",
    token,
    body,
  });
}

export async function markLedgerItemPaid(
  token: string,
  id: string,
  body?: { notes?: string | null },
): Promise<{ ledgerItem: LedgerItem }> {
  return apiFetch<{ ledgerItem: LedgerItem }>(`/api/money/${id}/mark-paid`, {
    method: "POST",
    token,
    body,
  });
}

export async function cancelLedgerItem(
  token: string,
  id: string,
): Promise<{ ledgerItem: LedgerItem }> {
  return apiFetch<{ ledgerItem: LedgerItem }>(`/api/money/${id}/cancel`, {
    method: "POST",
    token,
  });
}

export async function fetchContactBalance(
  token: string,
  contactId: string,
): Promise<{ balance: ContactBalance }> {
  return apiFetch<{ balance: ContactBalance }>(`/api/money/balance/${contactId}`, {
    token,
  });
}
