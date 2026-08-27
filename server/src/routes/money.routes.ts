import { Router } from "express";
import { z } from "zod";
import { requireSession } from "../middleware/requireSession.js";
import {
  createLedgerItem,
  getLedgerItem,
  listLedgerItems,
  recordPayment,
  markLedgerItemPaid,
  cancelLedgerItem,
  getContactBalance,
  getPaymentsForLedgerItem,
} from "../services/money.service.js";

export const moneyRouter = Router();
moneyRouter.use(requireSession);

const createLedgerItemSchema = z.object({
  contactId: z.string().uuid(),
  direction: z.enum(["receivable", "payable"]),
  amount: z.number().positive(),
  currency: z.string().optional(),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  taskId: z.string().uuid().optional().nullable(),
  reminderId: z.string().uuid().optional().nullable(),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string(),
  notes: z.string().trim().optional().nullable(),
  paidAt: z.string().optional().nullable(),
});

const markPaidSchema = z.object({
  notes: z.string().trim().optional().nullable(),
});

moneyRouter.post("/money", async (req, res) => {
  const parsed = createLedgerItemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
    return;
  }

  try {
    const item = await createLedgerItem(req.authContext!.authUserId, {
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    });
    res.status(201).json({ ledgerItem: item });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to create ledger item" });
  }
});

moneyRouter.get("/money", async (req, res) => {
  const status = req.query.status as any;
  const direction = req.query.direction as any;
  const contactId = req.query.contactId as string;
  const search = req.query.search as string;

  try {
    const items = await listLedgerItems(req.authContext!.authUserId, {
      status,
      direction,
      contactId,
      search,
    });
    res.json({ ledgerItems: items });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to fetch ledger items" });
  }
});

moneyRouter.get("/money/:id", async (req, res) => {
  try {
    const item = await getLedgerItem(req.authContext!.authUserId, req.params.id);
    if (!item) {
      res.status(404).json({ error: "Ledger item not found or access denied" });
      return;
    }
    const payments = await getPaymentsForLedgerItem(req.authContext!.authUserId, req.params.id);
    res.json({ ledgerItem: item, payments });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to fetch ledger item details" });
  }
});

moneyRouter.post("/money/:id/payments", async (req, res) => {
  const parsed = recordPaymentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload", details: parsed.error.issues });
    return;
  }

  try {
    const result = await recordPayment(req.authContext!.authUserId, req.params.id, {
      ...parsed.data,
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to record payment" });
  }
});

moneyRouter.post("/money/:id/mark-paid", async (req, res) => {
  const parsed = markPaidSchema.safeParse(req.body);
  const notes = parsed.success ? parsed.data.notes : null;

  try {
    const item = await markLedgerItemPaid(req.authContext!.authUserId, req.params.id, notes);
    res.json({ ledgerItem: item });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to mark ledger item as paid" });
  }
});

moneyRouter.post("/money/:id/cancel", async (req, res) => {
  try {
    const item = await cancelLedgerItem(req.authContext!.authUserId, req.params.id);
    res.json({ ledgerItem: item });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to cancel ledger item" });
  }
});

moneyRouter.get("/money/balance/:contactId", async (req, res) => {
  try {
    const balance = await getContactBalance(req.authContext!.authUserId, req.params.contactId);
    res.json({ balance });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || "Failed to fetch contact balance" });
  }
});
