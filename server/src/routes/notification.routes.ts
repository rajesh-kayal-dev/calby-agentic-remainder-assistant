import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../repositories/notifications.repository.js";

export const notificationRouter: Router = Router();

notificationRouter.use(requireSession);

notificationRouter.get("/", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const notifications = await getUserNotifications(authUserId);
    const unreadCount = await getUnreadCount(authUserId);

    const formatted = notifications.map((n) => ({
      id: n.id,
      authUserId: n.auth_user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      metadata: n.metadata || {},
      createdAt: n.created_at.toISOString(),
    }));

    res.json({
      success: true,
      unreadCount,
      notifications: formatted,
    });
  } catch (error) {
    res.status(500).json({ error: "Couldn't load notifications", success: false });
  }
});

notificationRouter.patch("/:id/read", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Notification ID required", success: false });
      return;
    }

    await markAsRead(authUserId, id);
    const unreadCount = await getUnreadCount(authUserId);

    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification as read", success: false });
  }
});

notificationRouter.post("/read-all", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    await markAllAsRead(authUserId);

    res.json({ success: true, unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all as read", success: false });
  }
});

notificationRouter.delete("/:id", async (req, res) => {
  try {
    const authUserId = req.authContext!.authUserId;
    const id = req.params.id;
    if (!id) {
      res.status(400).json({ error: "Notification ID required", success: false });
      return;
    }

    await deleteNotification(authUserId, id);
    const unreadCount = await getUnreadCount(authUserId);

    res.json({ success: true, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete notification", success: false });
  }
});
