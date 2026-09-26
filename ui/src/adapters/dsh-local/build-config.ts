import type { CreateConfigValues } from "../../components/AgentConfigForm";

export function buildDshLocalConfig(v: CreateConfigValues): Record<string, unknown> {
  const ac: Record<string, unknown> = {};
  // DSH uses `command` for the dsh binary path (or leave empty for PATH lookup)
  if (v.command) ac.command = v.command;
  if (v.cwd) ac.cwd = v.cwd;
  return ac;
}
