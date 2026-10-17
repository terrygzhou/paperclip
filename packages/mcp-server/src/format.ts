import { PaperclipApiError } from "./client.js";

export type McpContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

type McpTextResponse = {
  content: McpContentBlock[];
};

export function formatTextResponse(value: unknown): McpTextResponse {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

/**
 * Format a binary payload (e.g. an image) as an MCP image content block,
 * optionally followed by a text caption.
 */
export function formatImageResponse(
  input: { mimeType: string; base64: string; byteLength: number },
  caption?: string,
): McpTextResponse {
  const blocks: McpContentBlock[] = [
    { type: "image", data: input.base64, mimeType: input.mimeType },
  ];
  if (caption) blocks.push({ type: "text", text: caption });
  return { content: blocks };
}

export function formatErrorResponse(error: unknown): McpTextResponse {
  if (error instanceof PaperclipApiError) {
    return formatTextResponse({
      error: error.message,
      status: error.status,
      method: error.method,
      path: error.path,
      body: error.body,
    });
  }
  return formatTextResponse({
    error: error instanceof Error ? error.message : String(error),
  });
}
