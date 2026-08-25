import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  createContact,
  getContact,
  listContacts,
  updateContact,
  deleteContact,
} from "../services/contact.service.js";

export const contactRouter = Router();

contactRouter.use(requireSession);

contactRouter.post("/", async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name : "";
    const email = typeof req.body?.email === "string" ? req.body.email : undefined;
    const phoneNumber = typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber : undefined;
    const telegramId = typeof req.body?.telegramId === "string" ? req.body.telegramId : undefined;
    const notes = typeof req.body?.notes === "string" ? req.body.notes : undefined;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: "Contact name is required" });
      return;
    }

    const contact = await createContact(req.authContext!.authUserId, {
      name,
      email,
      phoneNumber,
      telegramId,
      notes,
    });

    res.status(201).json({ contact });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create contact" });
  }
});

contactRouter.get("/", async (req, res) => {
  try {
    const search = typeof req.query?.search === "string" ? req.query.search : undefined;
    const contacts = await listContacts(req.authContext!.authUserId, { search });
    res.json({ contacts });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to list contacts" });
  }
});

contactRouter.get("/:id", async (req, res) => {
  try {
    const contact = await getContact(req.authContext!.authUserId, req.params.id);
    if (!contact) {
      res.status(404).json({ error: "Contact not found" });
      return;
    }
    res.json({ contact });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Failed to fetch contact" });
  }
});

contactRouter.patch("/:id", async (req, res) => {
  try {
    const contact = await updateContact(req.authContext!.authUserId, req.params.id, {
      name: typeof req.body?.name === "string" ? req.body.name : undefined,
      email: typeof req.body?.email === "string" ? req.body.email : undefined,
      phoneNumber: typeof req.body?.phoneNumber === "string" ? req.body.phoneNumber : undefined,
      telegramId: typeof req.body?.telegramId === "string" ? req.body.telegramId : undefined,
      notes: typeof req.body?.notes === "string" ? req.body.notes : undefined,
    });

    res.json({ contact });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to update contact" });
  }
});

contactRouter.delete("/:id", async (req, res) => {
  try {
    const success = await deleteContact(req.authContext!.authUserId, req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to delete contact" });
  }
});
