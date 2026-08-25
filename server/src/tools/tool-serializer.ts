import { z } from "zod";
import {
  NormalizedToolDefinition,
  NormalizedToolParameter,
  NormalizedToolResult,
  ChatMessage,
} from "../services/llm/llm-provider.interface.js";

export function zodSchemaToJsonSchema(schema: z.ZodType<any>): NormalizedToolParameter {
  const def = (schema as any)._def;
  const typeName = def?.typeName || schema.constructor?.name || "";

  // Handle Optional / Nullable
  if (typeName === "ZodOptional" || typeName === "ZodNullable") {
    const inner = def?.innerType || (schema as any).unwrap?.();
    return inner ? zodSchemaToJsonSchema(inner) : { type: "string" };
  }

  // Handle Default
  if (typeName === "ZodDefault") {
    const inner = def?.innerType;
    const base = inner ? zodSchemaToJsonSchema(inner) : { type: "string" };
    base.default =
      typeof def?.defaultValue === "function" ? def.defaultValue() : def?.defaultValue;
    return base;
  }

  // Handle ZodObject
  if (typeName === "ZodObject" || (schema as any).shape) {
    const shape =
      typeof (schema as any).shape === "function"
        ? (schema as any).shape()
        : (schema as any).shape || {};

    const properties: Record<string, NormalizedToolParameter> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const childSchema = value as z.ZodType<any>;
      const childDef = (childSchema as any)._def;
      const childTypeName = childDef?.typeName || childSchema.constructor?.name || "";

      properties[key] = zodSchemaToJsonSchema(childSchema);

      const isOptional =
        childTypeName === "ZodOptional" ||
        childTypeName === "ZodDefault" ||
        (typeof childSchema.isOptional === "function" && childSchema.isOptional());

      if (!isOptional) {
        required.push(key);
      }
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Handle String
  if (typeName === "ZodString") {
    return {
      type: "string",
      description: def?.description || (schema as any).description,
    };
  }

  // Handle Number
  if (typeName === "ZodNumber") {
    return {
      type: "number",
      description: def?.description || (schema as any).description,
    };
  }

  // Handle Boolean
  if (typeName === "ZodBoolean") {
    return {
      type: "boolean",
      description: def?.description || (schema as any).description,
    };
  }

  // Handle Array
  if (typeName === "ZodArray") {
    const elementSchema = def?.type || (schema as any).element;
    return {
      type: "array",
      items: elementSchema ? zodSchemaToJsonSchema(elementSchema) : { type: "string" },
      description: def?.description || (schema as any).description,
    };
  }

  // Handle Enum
  if (typeName === "ZodEnum") {
    const values = def?.values || (schema as any).options || [];
    return {
      type: "string",
      enum: Array.isArray(values) ? values : undefined,
      description: def?.description || (schema as any).description,
    };
  }

  // Default fallback
  return {
    type: "string",
    description: def?.description || (schema as any).description,
  };
}

export function backendToolToNormalizedDefinition(tool: {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
}): NormalizedToolDefinition {
  const jsonSchema = zodSchemaToJsonSchema(tool.inputSchema);
  return {
    name: tool.id,
    description: tool.description,
    parameters: {
      type: "object",
      properties: jsonSchema.properties || {},
      required: jsonSchema.required,
    },
  };
}

export function formatToolResultToChatMessage(
  result: NormalizedToolResult,
): ChatMessage {
  const payload = result.success
    ? result.data ?? { success: true }
    : {
        error: result.error || "Execution failed",
        code: result.code || "TOOL_EXECUTION_ERROR",
      };

  return {
    role: "tool",
    toolCallId: result.toolCallId,
    name: result.name,
    content: JSON.stringify(payload),
  };
}
