import {
  ContactRecord,
  CreateContactInput,
  UpdateContactInput,
  createContactInDb,
  getContactByIdFromDb,
  listContactsFromDb,
  updateContactInDb,
  deleteContactFromDb,
  findContactsByNameFromDb,
} from "../repositories/contact.repository.js";

export function validateEmailFormat(email?: string | null): boolean {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhoneNumberFormat(phone?: string | null): boolean {
  if (!phone) return true;
  const digitsOnly = phone.replace(/\D/g, "");
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export async function createContact(
  authUserId: string,
  input: CreateContactInput,
): Promise<ContactRecord> {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Contact name is required");
  }

  if (input.email && !validateEmailFormat(input.email)) {
    throw new Error("Invalid email format");
  }

  if (input.phoneNumber && !validatePhoneNumberFormat(input.phoneNumber)) {
    throw new Error("Invalid phone number format");
  }

  return createContactInDb(authUserId, input);
}

export async function getContact(
  authUserId: string,
  contactId: string,
): Promise<ContactRecord | null> {
  return getContactByIdFromDb(authUserId, contactId);
}

export async function listContacts(
  authUserId: string,
  options?: { search?: string },
): Promise<ContactRecord[]> {
  return listContactsFromDb(authUserId, options);
}

export async function updateContact(
  authUserId: string,
  contactId: string,
  updates: UpdateContactInput,
): Promise<ContactRecord> {
  if (updates.name !== undefined && updates.name.trim().length === 0) {
    throw new Error("Contact name cannot be empty");
  }

  if (updates.email && !validateEmailFormat(updates.email)) {
    throw new Error("Invalid email format");
  }

  if (updates.phoneNumber && !validatePhoneNumberFormat(updates.phoneNumber)) {
    throw new Error("Invalid phone number format");
  }

  const existing = await getContactByIdFromDb(authUserId, contactId);
  if (!existing) {
    throw new Error("Contact not found");
  }

  const updated = await updateContactInDb(authUserId, contactId, updates);
  if (!updated) {
    throw new Error("Failed to update contact");
  }

  return updated;
}

export async function deleteContact(
  authUserId: string,
  contactId: string,
): Promise<boolean> {
  const existing = await getContactByIdFromDb(authUserId, contactId);
  if (!existing) {
    throw new Error("Contact not found");
  }

  return deleteContactFromDb(authUserId, contactId);
}

export async function findContactsByName(
  authUserId: string,
  nameQuery: string,
): Promise<ContactRecord[]> {
  if (!nameQuery || nameQuery.trim().length === 0) {
    return [];
  }
  return findContactsByNameFromDb(authUserId, nameQuery);
}
