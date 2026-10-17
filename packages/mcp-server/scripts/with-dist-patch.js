#!/usr/bin/env node
/**
 * Paperclip MCP server launcher — Hermes-native stdio entry point.
 *
 * Why this exists: the Paperclip monorepo's @paperclipai/shared dev
 * package.json points "exports" at TypeScript source, but the compiled
 * mcp-server dist/ imports compiled JS from that package. Rather than
 * mutating the committed shared package.json on every start, this
 * launcher registers a module-resolution hook that rewrites the bare
 * "@paperclipai/shared" specifier to the built dist/ when it exists.
 *
 * Non-destructive: no file on disk is modified. If dist/ is missing,
 * the hook is skipped and resolution falls through to the default
 * (which will fail as before — rebuild the shared package first).
 */
import { register } from "node:module";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const sharedDist = join(here, "../../shared/dist/index.js");

if (existsSync(sharedDist)) {
  register(join(here, "resolve-shared-dist.mjs"), import.meta.url);
}

await import(join(here, "../dist/stdio.js"));
