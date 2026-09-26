import {
  type as dshType,
  agentConfigurationDoc,
  models,
  SANDBOX_INSTALL_COMMAND,
} from "../index.js";
import { execute } from "./execute.js";
import { sessionCodec } from "./session-codec.js";
import { testEnvironment } from "./test.js";

export { sessionCodec };
export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";

export function createServerAdapter() {
  return {
    type: dshType,
    runtimeToolDelivery: "environment" as const,
    execute,
    testEnvironment,
    sessionCodec,
    models,
    supportsLocalAgentJwt: true,
    supportsInstructionsBundle: false,
    requiresMaterializedRuntimeSkills: false,
    agentConfigurationDoc,
    getConfigSchema: () => ({
      fields: [
        {
          key: "command",
          label: "Command",
          type: "text" as const,
          default: "dsh",
          hint: "The dsh binary. Defaults to dsh.",
        },
        {
          key: "profile",
          label: "DSH profile",
          type: "text" as const,
          default: "headless",
          hint: "The dsh profile to boot. Defaults to headless (one task in, final answer out).",
        },
        {
          key: "profileArgs",
          label: "Profile args",
          type: "text" as const,
          default: "",
          hint: "Extra launcher flags passed before the task string (comma-separated).",
        },
        {
          key: "cwd",
          label: "Working directory",
          type: "text" as const,
          default: "",
          hint: "Default absolute working directory for the agent process.",
        },
        {
          key: "promptTemplate",
          label: "Prompt template",
          type: "text" as const,
          default: "",
          hint: "Optional user prompt template. The Paperclip wake payload is always injected.",
        },
        {
          key: "timeoutSec",
          label: "Timeout (s)",
          type: "number" as const,
          default: 600,
        },
        {
          key: "graceSec",
          label: "Grace period (s)",
          type: "number" as const,
          default: 20,
        },
      ],
    }),
  };
}

export { SANDBOX_INSTALL_COMMAND };
