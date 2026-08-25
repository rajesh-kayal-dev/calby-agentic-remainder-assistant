export interface NotificationPayload {
  deliveryId: string;
  reminderId?: string;
  authUserId: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationChannel {
  channelId: string;
  name: string;
  send(payload: NotificationPayload): Promise<NotificationDeliveryResult>;
}
