export const type = "dsh_local";
export const label = "DSH";

// dsh (DeepSeek Harness) is not an npm-installable global CLI — it lives under
// ~/.local/bin/dsh on this host and is configured against a local SGLang
// endpoint via ~/.dsh/settings.yaml. There is no npm installCommand to run in
// a sandbox; we therefore omit SANDBOX_INSTALL_COMMAND and let the host's own
// dsh binary be detected in PATH.
export const SANDBOX_INSTALL_COMMAND = "";

export { execute } from "./server/execute.js";
export { testEnvironment } from "./server/test.js";
export { sessionCodec } from "./server/session-codec.js";
export { createServerAdapter } from "./server/index.js";

export const models: Array<{ id: string; label: string }> = [];

export const agentConfigurationDoc = `# dsh_local agent configuration

Adapter: dsh_local

Use when:
- You want Paperclip to run the DeepSeek Harness (dsh) locally as the agent runtime
- You want dsh's headless profile (one task in, final answer out) driven per Paperclip run
- You want dsh's plugin stack (mem0 MCP bridge, session persistence, etc.) under the Paperclip control plane

Don't use when:
- You need Pi's JSONL session codec (use pi_local)
- You need a webhook-style external invocation (use openclaw_gateway or http)
- dsh is not installed on the machine (PATH must resolve to the dsh binary)

Core fields:
- command (string, optional): defaults to "dsh"
- profile (string, optional): dsh profile to boot, defaults to "headless"
- profileArgs (string[], optional): extra launcher flags passed before the task
- cwd (string, optional): default absolute working directory for the agent process
- promptTemplate (string, optional): user prompt template
- extraArgs (string[], optional): raw arguments appended after the task string

Operational fields:
- timeoutSec (number, optional): run timeout in seconds
- graceSec (number, optional): SIGTERM grace period in seconds
- env (object, optional): KEY=VALUE environment variables

Notes:
- dsh headless streams reasoning to stderr and prints the final assistant message to stdout.
- The model/provider is read from ~/.dsh/settings.yaml (agent-default-model), not from this adapter config.
- To route to a different model, patch ~/.dsh/profiles/<profile>/cordis.patch.yml or set DSH settings.
- Paperclip's runtime tools MCP URL and API key are injected as PAPERCLIP_* env so the dsh agent can call back to Paperclip.
`;
