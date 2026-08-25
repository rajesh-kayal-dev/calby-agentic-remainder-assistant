import { apiFetch } from "./api";

export interface Contact {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  telegramId?: string | null;
  notes?: string | null;
  created_at: string;
}

export async function fetchContactsApi(token: string, search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<{ contacts: Contact[] }>(`/api/contacts${query}`, { token });
}

export async function createContactApi(
  token: string,
  body: {
    name: string;
    email?: string;
    phoneNumber?: string;
    telegramId?: string;
    notes?: string;
  },
) {
  return apiFetch<{ contact: Contact }>("/api/contacts", {
    method: "POST",
    token,
    body,
  });
}

export async function updateContactApi(
  token: string,
  contactId: string,
  body: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    telegramId?: string;
    notes?: string;
  },
) {
  return apiFetch<{ contact: Contact }>(`/api/contacts/${contactId}`, {
    method: "PATCH",
    token,
    body,
  });
}

export async function deleteContactApi(token: string, contactId: string) {
  return apiFetch<{ success: boolean }>(`/api/contacts/${contactId}`, {
    method: "DELETE",
    token,
  });
}
