// Module-resolution hook for the Paperclip MCP server (Hermes stdio launcher).
//
// The monorepo's @paperclipai/shared dev package.json points "exports" at
// TypeScript source, but the compiled mcp-server dist/ imports compiled JS.
// This hook rewrites the bare "@paperclipai/shared" specifier to the built
// dist/ entry when it exists — non-destructively, no files mutated.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SHARED_DIST = join(here, "../../shared/dist/index.js");

export async function resolve(specifier, context, next) {
  if (specifier === "@paperclipai/shared" && existsSync(SHARED_DIST)) {
    return next("file://" + SHARED_DIST, context);
  }
  return next(specifier, context);
}
