-- Migration 015: WhatsApp Delivery Status, Provider Message ID & User Phone Number

-- 1. Add provider_message_id and whatsapp_status to notification_deliveries
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS provider_message_id TEXT NULL;
ALTER TABLE notification_deliveries ADD COLUMN IF NOT EXISTS whatsapp_status TEXT NULL;

-- 2. Add phone_number to users table for E.164 recipient lookup
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT NULL;

-- 3. Create index for fast webhook correlation by provider_message_id
CREATE INDEX IF NOT EXISTS idx_deliveries_provider_msg_id ON notification_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL;
