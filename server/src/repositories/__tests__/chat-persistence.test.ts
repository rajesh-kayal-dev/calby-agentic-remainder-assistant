import { test } from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeMessageRow,
  sanitizeConversationRow,
  reconstructChatMessagesHistory,
  MessageDTO,
  MessageRow,
  ConversationRow,
} from "../chat.repository.js";

test("1. sanitizeMessageRow handles tool role, tool_call_id, tool_name, and tool_calls", () => {
  const row: MessageRow = {
    id: "msg-123",
    conversation_id: "conv-123",
    auth_user_id: "user-123",
    role: "tool",
    content: '{"events":[]}',
    provider_id: "openai",
    model: "gpt-4o",
    status: "completed",
    sequence: 3,
    tool_call_id: "call_abc",
    tool_name: "calendar.get_events",
    tool_calls: null,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
  };

  const dto = sanitizeMessageRow(row);
  assert.equal(dto.role, "tool");
  assert.equal(dto.toolCallId, "call_abc");
  assert.equal(dto.toolName, "calendar.get_events");
  assert.equal(dto.content, '{"events":[]}');
});

test("2. sanitizeConversationRow maps pending_confirmation state", () => {
  const row: ConversationRow = {
    id: "conv-123",
    auth_user_id: "user-123",
    workspace_id: "default",
    title: "Test Thread",
    provider_id: "openai",
    model: "gpt-4o",
    status: "waiting_confirmation",
    is_pinned: false,
    pending_confirmation: {
      type: "confirmation_required",
      toolId: "calendar.delete_event",
      details: { eventId: "evt_99" },
    },
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    last_message_at: new Date(),
  };

  const dto = sanitizeConversationRow(row);
  assert.equal(dto.status, "waiting_confirmation");
  assert.ok(dto.pendingConfirmation);
  assert.equal(dto.pendingConfirmation.toolId, "calendar.delete_event");
});

test("3. reconstructChatMessagesHistory converts DB DTOs to normalized ChatMessage[]", () => {
  const dtos: MessageDTO[] = [
    {
      id: "m1",
      conversationId: "c1",
      authUserId: "u1",
      role: "user",
      content: "Check my calendar",
      providerId: null,
      model: null,
      status: "completed",
      sequence: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m2",
      conversationId: "c1",
      authUserId: "u1",
      role: "assistant",
      content: null as any,
      providerId: "openai",
      model: "gpt-4o",
      status: "completed",
      sequence: 2,
      toolCalls: [
        {
          id: "call_abc123",
          name: "calendar.get_events",
          arguments: { maxResults: 5 },
        },
      ],
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m3",
      conversationId: "c1",
      authUserId: "u1",
      role: "tool",
      content: '{"events":[]}',
      providerId: "openai",
      model: "gpt-4o",
      status: "completed",
      sequence: 3,
      toolCallId: "call_abc123",
      toolName: "calendar.get_events",
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const chatMessages = reconstructChatMessagesHistory(dtos);
  assert.equal(chatMessages.length, 3);
  assert.equal(chatMessages[0].role, "user");
  assert.equal(chatMessages[0].content, "Check my calendar");

  assert.equal(chatMessages[1].role, "assistant");
  assert.ok(chatMessages[1].toolCalls);
  assert.equal(chatMessages[1].toolCalls[0].id, "call_abc123");

  assert.equal(chatMessages[2].role, "tool");
  assert.equal(chatMessages[2].toolCallId, "call_abc123");
  assert.equal(chatMessages[2].name, "calendar.get_events");
  assert.equal(chatMessages[2].content, '{"events":[]}');
});

test("4. reconstructChatMessagesHistory preserves existing user/assistant/system messages", () => {
  const dtos: MessageDTO[] = [
    {
      id: "m1",
      conversationId: "c1",
      authUserId: "u1",
      role: "user",
      content: "Hello",
      providerId: null,
      model: null,
      status: "completed",
      sequence: 1,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m2",
      conversationId: "c1",
      authUserId: "u1",
      role: "assistant",
      content: "Hi there!",
      providerId: null,
      model: null,
      status: "completed",
      sequence: 2,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const chatMessages = reconstructChatMessagesHistory(dtos);
  assert.equal(chatMessages.length, 2);
  assert.equal(chatMessages[0].role, "user");
  assert.equal(chatMessages[1].role, "assistant");
  assert.equal(chatMessages[1].content, "Hi there!");
});
