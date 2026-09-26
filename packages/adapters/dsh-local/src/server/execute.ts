import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  inferOpenAiCompatibleBiller,
  type AdapterExecutionContext,
  type AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import {
  adapterExecutionTargetIsRemote,
  adapterExecutionTargetRemoteCwd,
  adapterExecutionTargetSessionIdentity,
  adapterExecutionTargetSessionMatches,
  ensureAdapterExecutionTargetCommandResolvable,
  ensureAdapterExecutionTargetFile,
  ensureAdapterExecutionTargetRuntimeCommandInstalled,
  adapterExecutionTargetUsesManagedHome,
  adapterExecutionTargetUsesPaperclipBridge,
  describeAdapterExecutionTarget,
  prepareAdapterExecutionTargetRuntime,
  adapterExecutionTargetDuplexObservabilityRecorder,
  adapterExecutionTargetEnablesSandboxDuplexBridge,
  readAdapterExecutionTarget,
  resolveAdapterExecutionTargetTimeoutSec,
  resolveAdapterExecutionTargetCommandForLogs,
  runAdapterExecutionTargetProcess,
  runAdapterExecutionTargetShellCommand,
  startAdapterExecutionTargetPaperclipBridge,
  overrideAdapterExecutionTargetRemoteCwd,
} from "@paperclipai/adapter-utils/execution-target";
import { shellQuote } from "@paperclipai/adapter-utils/ssh";
import {
  asString,
  asNumber,
  asStringArray,
  parseObject,
  buildPaperclipEnv,
  buildRuntimeToolsEnv,
  joinPromptSections,
  buildInvocationEnvForLogs,
  ensureAbsoluteDirectory,
  ensurePathInEnv,
  renderTemplate,
  renderPaperclipWakePrompt,
  isPaperclipRecoveryWakePayload,
  DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE,
  refreshPaperclipWorkspaceEnvForExecution,
  readPaperclipIssueWorkModeFromContext,
  readPaperclipRuntimeSkillEntries,
} from "@paperclipai/adapter-utils/server-utils";

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));

const DSH_SESSIONS_DIR = path.join(os.homedir(), ".dsh", "paperclips");
const DSH_AGENT_SKILLS_DIR = path.join(os.homedir(), ".dsh", "agent", "skills");

function firstNonEmptyLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map((line: string) => line.trim())
      .find(Boolean) ?? ""
  );
}

function normalizeEnv(input: unknown): Record<string, string> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (typeof value === "string") env[key] = value;
  }
  return env;
}

async function ensureDSHSkillsInjected(
  onLog: AdapterExecutionContext["onLog"],
  skillsEntries: Array<{ key: string; runtimeName: string; source: string }>,
  desiredSkillNames?: string[],
) {
  const desiredSet = new Set(desiredSkillNames ?? skillsEntries.map((entry) => entry.key));
  const selectedEntries = skillsEntries.filter((entry) => desiredSet.has(entry.key));
  if (selectedEntries.length === 0) return;
  await fs.mkdir(DSH_AGENT_SKILLS_DIR, { recursive: true });
  for (const entry of selectedEntries) {
    const target = path.join(DSH_AGENT_SKILLS_DIR, entry.runtimeName);
    try {
      const result = await ensureDSHSkillSymlink(entry.source, target);
      if (result === "skipped") continue;
      await onLog(
        "stderr",
        `[paperclip] ${result === "repaired" ? "Repaired" : "Injected"} DSH skill "${entry.runtimeName}" into ${DSH_AGENT_SKILLS_DIR}\n`,
      );
    } catch (err) {
      await onLog(
        "stderr",
        `[paperclip] Failed to inject DSH skill "${entry.runtimeName}": ${err instanceof Error ? err.message : String(err)}\n`,
      );
    }
  }
}

async function ensureDSHSkillSymlink(source: string, target: string): Promise<"created" | "repaired" | "skipped"> {
  try {
    const stat = await fs.lstat(target).catch(() => null);
    if (stat) {
      if (stat.isSymbolicLink()) {
        const current = await fs.readlink(target);
        if (path.resolve(path.dirname(target), current) === path.resolve(source)) return "skipped";
        await fs.unlink(target);
      } else {
        await fs.unlink(target);
      }
    }
  } catch {
    // ignore — proceed to create
  }
  await fs.symlink(source, target, "dir");
  return "created";
}

async function buildDSHSkillsDir(config: Record<string, unknown>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-dsh-skills-"));
  const target = path.join(tmp, "skills");
  await fs.mkdir(target, { recursive: true });
  const availableEntries = await readPaperclipRuntimeSkillEntries(config, __moduleDir);
  for (const entry of availableEntries) {
    await fs.symlink(entry.source, path.join(target, entry.runtimeName));
  }
  return target;
}

function resolveDSHBiller(env: Record<string, string>): string {
  return inferOpenAiCompatibleBiller(env, null) ?? "unknown";
}

async function ensureSessionsDir(): Promise<string> {
  await fs.mkdir(DSH_SESSIONS_DIR, { recursive: true });
  return DSH_SESSIONS_DIR;
}

function buildSessionPath(agentId: string, timestamp: string): string {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  return path.join(DSH_SESSIONS_DIR, `${safeTimestamp}-${agentId}.jsonl`);
}

function buildRemoteSessionPath(runtimeRootDir: string, agentId: string, timestamp: string): string {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  return path.posix.join(runtimeRootDir, "sessions", `${safeTimestamp}-${agentId}.jsonl`);
}

function normalizeExecutionCwd(candidate: string, remote: boolean): string {
  return remote ? path.posix.normalize(candidate) : path.resolve(candidate);
}

function executionCwdsMatch(saved: string, current: string, remote: boolean): boolean {
  return normalizeExecutionCwd(saved, remote) === normalizeExecutionCwd(current, remote);
}

function readSessionHeaderCwd(raw: string): string | null {
  const headerLine = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!headerLine) return null;
  try {
    const parsed = JSON.parse(headerLine) as Record<string, unknown>;
    if (parsed.type !== "session") return null;
    const cwd = typeof parsed.cwd === "string" ? parsed.cwd.trim() : "";
    return cwd.length > 0 ? cwd : null;
  } catch {
    return null;
  }
}

async function readSavedSessionCwd(input: {
  runId: string;
  sessionPath: string;
  executionTarget: ReturnType<typeof readAdapterExecutionTarget>;
  cwd: string;
  env: Record<string, string>;
  timeoutSec: number;
  graceSec: number;
}): Promise<string | null> {
  if (!input.sessionPath.trim()) return null;
  if (!adapterExecutionTargetIsRemote(input.executionTarget)) {
    try {
      return readSessionHeaderCwd(await fs.readFile(input.sessionPath, "utf8"));
    } catch {
      return null;
    }
  }
  try {
    const { shellQuote } = await import("@paperclipai/adapter-utils/ssh");
    const sessionHeader = await runAdapterExecutionTargetShellCommand(
      input.runId,
      input.executionTarget,
      `if [ -f ${shellQuote(input.sessionPath)} ]; then head -n 1 ${shellQuote(input.sessionPath)}; fi`,
      {
        cwd: input.cwd,
        env: input.env,
        timeoutSec: input.timeoutSec > 0 ? Math.min(input.timeoutSec, 15) : 15,
        graceSec: input.graceSec,
      },
    );
    if (sessionHeader.timedOut || (sessionHeader.exitCode ?? 0) !== 0) return null;
    return readSessionHeaderCwd(sessionHeader.stdout);
  } catch {
    return null;
  }
}

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { runId, agent, runtime, config, context, onLog, onMeta, onSpawn, authToken } = ctx;
  const executionTarget = readAdapterExecutionTarget({
    executionTarget: ctx.executionTarget,
    legacyRemoteExecution: ctx.executionTransport?.remoteExecution,
  });
  const executionTargetIsRemote = adapterExecutionTargetIsRemote(executionTarget);

  const promptTemplate = asString(config.promptTemplate, DEFAULT_PAPERCLIP_AGENT_PROMPT_TEMPLATE);
  const command = asString(config.command, "dsh");
  const profile = asString(config.profile, "headless");
  const profileArgs = asStringArray(config.profileArgs);

  const workspaceContext = parseObject(context.paperclipWorkspace);
  const workspaceCwd = asString(workspaceContext.cwd, "");
  const workspaceSource = asString(workspaceContext.source, "");
  const workspaceId = asString(workspaceContext.workspaceId, "");
  const workspaceRepoUrl = asString(workspaceContext.repoUrl, "");
  const workspaceRepoRef = asString(workspaceContext.repoRef, "");
  const agentHome = asString(workspaceContext.agentHome, "");
  const workspaceHints = Array.isArray(context.paperclipWorkspaces)
    ? context.paperclipWorkspaces.filter(
        (value): value is Record<string, unknown> => typeof value === "object" && value !== null,
      )
    : [];
  const configuredCwd = asString(config.cwd, "");
  const useConfiguredInsteadOfAgentHome = workspaceSource === "agent_home" && configuredCwd.length > 0;
  const effectiveWorkspaceCwd = useConfiguredInsteadOfAgentHome ? "" : workspaceCwd;
  const cwd = effectiveWorkspaceCwd || configuredCwd || process.cwd();
  let effectiveExecutionCwd = adapterExecutionTargetRemoteCwd(executionTarget, cwd);
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });

  if (!executionTargetIsRemote) {
    await ensureSessionsDir();
  }

  // Build environment
  const envConfig = parseObject(config.env);
  const env: Record<string, string> = {
    ...buildPaperclipEnv(agent),
    ...buildRuntimeToolsEnv(ctx.runtimeTools),
  };
  env.PAPERCLIP_RUN_ID = runId;

  const wakeTaskId =
    (typeof context.taskId === "string" && context.taskId.trim().length > 0 && context.taskId.trim()) ||
    (typeof context.issueId === "string" && context.issueId.trim().length > 0 && context.issueId.trim()) ||
    null;
  const wakeReason =
    typeof context.wakeReason === "string" && context.wakeReason.trim().length > 0
      ? context.wakeReason.trim()
      : null;
  const wakeCommentId =
    (typeof context.wakeCommentId === "string" && context.wakeCommentId.trim().length > 0 && context.wakeCommentId.trim()) ||
    (typeof context.commentId === "string" && context.commentId.trim().length > 0 && context.commentId.trim()) ||
    null;
  const approvalId =
    typeof context.approvalId === "string" && context.approvalId.trim().length > 0
      ? context.approvalId.trim()
      : null;
  const approvalStatus =
    typeof context.approvalStatus === "string" && context.approvalStatus.trim().length > 0
      ? context.approvalStatus.trim()
      : null;
  const linkedIssueIds = Array.isArray(context.issueIds)
    ? context.issueIds.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];
  const issueWorkMode = readPaperclipIssueWorkModeFromContext(context);

  if (wakeTaskId) env.PAPERCLIP_TASK_ID = wakeTaskId;
  if (issueWorkMode) env.PAPERCLIP_ISSUE_WORK_MODE = issueWorkMode;
  if (wakeReason) env.PAPERCLIP_WAKE_REASON = wakeReason;
  if (wakeCommentId) env.PAPERCLIP_WAKE_COMMENT_ID = wakeCommentId;
  if (approvalId) env.PAPERCLIP_APPROVAL_ID = approvalId;
  if (approvalStatus) env.PAPERCLIP_APPROVAL_STATUS = approvalStatus;
  if (linkedIssueIds.length > 0) env.PAPERCLIP_LINKED_ISSUE_IDS = linkedIssueIds.join(",");

  refreshPaperclipWorkspaceEnvForExecution({
    env,
    envConfig,
    workspaceCwd: effectiveWorkspaceCwd,
    workspaceSource,
    workspaceId,
    workspaceRepoUrl,
    workspaceRepoRef,
    workspaceHints,
    agentHome,
    executionTargetIsRemote,
    executionCwd: effectiveExecutionCwd,
  });
  if (authToken) {
    env.PAPERCLIP_API_KEY = authToken;
  }

  // Merge user config env into env, ensuring runtime PAPERCLIP_* wins
  const forbiddenConfigKeys = new Set(["PAPERCLIP_API_KEY"]);
  const runtimeKeys = new Set(
    Object.keys(env).filter((k) => k.startsWith("PAPERCLIP_")),
  );
  for (const [k, v] of Object.entries(envConfig)) {
    if (typeof v !== "string") continue;
    if (forbiddenConfigKeys.has(k)) continue;
    if (runtimeKeys.has(k)) continue;
    env[k] = v;
  }

  const mergedEnv = ensurePathInEnv({ ...process.env, ...env });
  const runtimeEnv = Object.fromEntries(
    Object.entries(mergedEnv).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

  const timeoutSec = resolveAdapterExecutionTargetTimeoutSec(executionTarget, asNumber(config.timeoutSec, 0));
  const graceSec = asNumber(config.graceSec, 20);

  await ensureAdapterExecutionTargetRuntimeCommandInstalled({
    runId,
    target: executionTarget,
    installCommand: ctx.runtimeCommandSpec?.installCommand,
    detectCommand: ctx.runtimeCommandSpec?.detectCommand,
    cwd,
    env: runtimeEnv,
    timeoutSec,
    graceSec,
    onLog,
  });

  await ensureAdapterExecutionTargetCommandResolvable(command, executionTarget, cwd, runtimeEnv);
  const resolvedCommand = await resolveAdapterExecutionTargetCommandForLogs(command, executionTarget, cwd, runtimeEnv);
  let loggedEnv = buildInvocationEnvForLogs(env, {
    runtimeEnv,
    includeRuntimeKeys: ["HOME"],
    resolvedCommand,
  });

  let localSkillsDir: string | null = null;
  let remoteSkillsDir: string | null = null;
  let paperclipBridge: Awaited<ReturnType<typeof startAdapterExecutionTargetPaperclipBridge>> = null;

  if (executionTargetIsRemote) {
    try {
      localSkillsDir = await buildDSHSkillsDir(config);
      await onLog("stdout", `[paperclip] Syncing DSH runtime assets to ${describeAdapterExecutionTarget(executionTarget)}.\n`);
      const preparedRemoteRuntime = await prepareAdapterExecutionTargetRuntime({
        runId,
        target: executionTarget,
        adapterKey: "dsh",
        timeoutSec,
        workspaceLocalDir: cwd,
        installCommand: "",
        detectCommand: command,
        onProgress: (line) => onLog("stdout", line),
        onRuntimeProgress: ctx.onRuntimeProgress,
        assets: [
          {
            key: "skills",
            localDir: localSkillsDir,
            followSymlinks: true,
          },
        ],
      });
      remoteSkillsDir = preparedRemoteRuntime.assetDirs.skills ?? null;
    } catch (error) {
      await Promise.allSettled([
        localSkillsDir ? fs.rm(path.dirname(localSkillsDir), { recursive: true, force: true }).catch(() => undefined) : Promise.resolve(),
      ]);
      throw error;
    }
  }

  const runtimeExecutionTarget = overrideAdapterExecutionTargetRemoteCwd(executionTarget, effectiveExecutionCwd);
  if (executionTargetIsRemote && adapterExecutionTargetUsesPaperclipBridge(runtimeExecutionTarget)) {
    paperclipBridge = await startAdapterExecutionTargetPaperclipBridge({
      runId,
      target: runtimeExecutionTarget,
      enableSandboxDuplexBridge: adapterExecutionTargetEnablesSandboxDuplexBridge(runtimeExecutionTarget),
      duplexObservabilityRecorder: adapterExecutionTargetDuplexObservabilityRecorder(runtimeExecutionTarget),
      runtimeRootDir: remoteSkillsDir ? undefined : undefined,
      adapterKey: "dsh",
      timeoutSec,
      hostApiToken: env.PAPERCLIP_API_KEY,
      onLog,
    });
    if (paperclipBridge) {
      Object.assign(env, paperclipBridge.env);
      loggedEnv = buildInvocationEnvForLogs(env, {
        runtimeEnv: Object.fromEntries(
          Object.entries(ensurePathInEnv({ ...process.env, ...env })).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        ),
        includeRuntimeKeys: ["HOME"],
        resolvedCommand,
      });
    }
  }

  const runtimeSessionParams = parseObject(runtime.sessionParams);
  const runtimeSessionId = asString(runtimeSessionParams.sessionId, runtime.sessionId ?? "");
  const runtimeSessionCwd = asString(runtimeSessionParams.cwd, "");
  const runtimeRemoteExecution = parseObject(runtimeSessionParams.remoteExecution);
  const sessionTargetMatches = adapterExecutionTargetSessionMatches(runtimeRemoteExecution, runtimeExecutionTarget);
  const sessionParamsCwdMatches =
    runtimeSessionCwd.length === 0 ||
    executionCwdsMatch(runtimeSessionCwd, effectiveExecutionCwd, executionTargetIsRemote);
  const savedSessionCwd =
    runtimeSessionId.length > 0
      ? await readSavedSessionCwd({
          runId,
          sessionPath: runtimeSessionId,
          executionTarget: runtimeExecutionTarget ?? null,
          cwd,
          env,
          timeoutSec,
          graceSec,
        })
      : null;
  const sessionHeaderCwdMatches =
    runtimeSessionId.length === 0 ||
    (savedSessionCwd !== null &&
      executionCwdsMatch(savedSessionCwd, effectiveExecutionCwd, executionTargetIsRemote));
  const canResumeSession =
    runtimeSessionId.length > 0 &&
    sessionTargetMatches &&
    sessionParamsCwdMatches &&
    sessionHeaderCwdMatches;
  const sessionPath = canResumeSession
    ? runtimeSessionId
    : executionTargetIsRemote && remoteSkillsDir
      ? buildRemoteSessionPath(remoteSkillsDir, agent.id, new Date().toISOString())
      : buildSessionPath(agent.id, new Date().toISOString());

  if (!canResumeSession) {
    if (executionTargetIsRemote) {
      await ensureAdapterExecutionTargetFile(runId, runtimeExecutionTarget, sessionPath, {
        cwd,
        env,
        timeoutSec: 15,
        graceSec: 5,
        onLog,
      });
    } else {
      try {
        await fs.writeFile(sessionPath, "", { flag: "wx" });
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
          throw err;
        }
      }
    }
  }

  // Build the user prompt (no system prompt extension — dsh headless has no
  // --append-system-prompt equivalent, so the full prompt goes into the task arg)
  const bootstrapPromptTemplate = asString(config.bootstrapPromptTemplate, "");
  const templateData = {
    agentId: agent.id,
    companyId: agent.companyId,
    runId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId, source: "on_demand" },
    context,
  };
  const renderedBootstrapPrompt =
    !canResumeSession && bootstrapPromptTemplate.trim().length > 0
      ? renderTemplate(bootstrapPromptTemplate, templateData).trim()
      : "";
  const wakePrompt = renderPaperclipWakePrompt(context.paperclipWake, { resumedSession: canResumeSession });
  const shouldUseResumeDeltaPrompt = canResumeSession && wakePrompt.length > 0;
  const renderedHeartbeatPrompt = shouldUseResumeDeltaPrompt || isPaperclipRecoveryWakePayload(context.paperclipWake)
    ? ""
    : renderTemplate(promptTemplate, templateData);
  const sessionHandoffNote = asString(context.paperclipSessionHandoffMarkdown, "").trim();
  const userPrompt = joinPromptSections([
    renderedBootstrapPrompt,
    wakePrompt,
    sessionHandoffNote,
    renderedHeartbeatPrompt,
  ]);
  const promptMetrics = {
    systemPromptChars: 0,
    promptChars: userPrompt.length,
    bootstrapPromptChars: renderedBootstrapPrompt.length,
    wakePromptChars: wakePrompt.length,
    sessionHandoffChars: sessionHandoffNote.length,
    heartbeatPromptChars: renderedHeartbeatPrompt.length,
  };

  const extraArgs = (() => {
    const fromExtraArgs = asStringArray(config.extraArgs);
    if (fromExtraArgs.length > 0) return fromExtraArgs;
    return asStringArray(config.args);
  })();

  const buildArgs = (): string[] => {
    const args: string[] = [];
    args.push("--profile", profile);
    if (profileArgs.length > 0) args.push(...profileArgs);
    if (extraArgs.length > 0) args.push(...extraArgs);
    // dsh headless: task text as the final positional argument
    args.push(userPrompt);
    return args;
  };

  const runAttempt = async () => {
    const args = buildArgs();
    if (onMeta) {
      await onMeta({
        adapterType: "dsh_local",
        command: resolvedCommand,
        cwd: effectiveExecutionCwd,
        commandArgs: args,
        env: loggedEnv,
        prompt: userPrompt,
        promptMetrics,
        context,
      });
    }

    let stdoutBuffer = "";
    const bufferedOnLog = async (stream: "stdout" | "stderr", chunk: string) => {
      if (stream === "stderr") {
        await onLog(stream, chunk);
        return;
      }
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split("\n");
      stdoutBuffer = lines.pop() || "";
      for (const line of lines) {
        if (line) {
          await onLog(stream, line + "\n");
        }
      }
    };

    const proc = await runAdapterExecutionTargetProcess(runId, runtimeExecutionTarget, command, args, {
      cwd,
      env: executionTargetIsRemote ? env : runtimeEnv,
      timeoutSec,
      graceSec,
      onSpawn,
      onRuntimeProgress: ctx.onRuntimeProgress,
      onLog: bufferedOnLog,
      runLogTail: paperclipBridge?.runLogTail,
      settleRunDisposition: paperclipBridge?.settleRunDisposition,
    });

    if (stdoutBuffer) {
      await onLog("stdout", stdoutBuffer);
    }

    return {
      proc,
      rawStderr: proc.stderr,
    };
  };

  const toResult = (
    attempt: {
      proc: { exitCode: number | null; signal: string | null; timedOut: boolean; stdout: string; stderr: string; errorCode?: string | null };
      rawStderr: string;
    },
  ): AdapterExecutionResult => {
    if (attempt.proc.timedOut) {
      return {
        exitCode: attempt.proc.exitCode,
        signal: attempt.proc.signal,
        timedOut: true,
        errorMessage: `Timed out after ${timeoutSec}s`,
      };
    }

    const rawExitCode = attempt.proc.exitCode;
    const stderrLine = firstNonEmptyLine(attempt.proc.stderr);
    const stdoutSummary = attempt.proc.stdout.trim();
    const effectiveExitCode = rawExitCode;

    const resolvedSessionParams = {
      sessionId: sessionPath,
      cwd: effectiveExecutionCwd,
      ...(workspaceId ? { workspaceId } : {}),
      ...(workspaceRepoUrl ? { repoUrl: workspaceRepoUrl } : {}),
      ...(workspaceRepoRef ? { repoRef: workspaceRepoRef } : {}),
      ...(executionTargetIsRemote
        ? {
            remoteExecution: adapterExecutionTargetSessionIdentity(runtimeExecutionTarget),
          }
        : {}),
    };

    return {
      exitCode: effectiveExitCode,
      signal: attempt.proc.signal,
      timedOut: false,
      errorMessage: (effectiveExitCode ?? 0) === 0 ? null : stderrLine || `dsh exited with code ${rawExitCode ?? -1}`,
      errorCode: attempt.proc.errorCode ?? null,
      usage: { inputTokens: 0, outputTokens: 0 },
      sessionId: sessionPath,
      sessionParams: resolvedSessionParams,
      sessionDisplayId: sessionPath,
      provider: "sglang",
      biller: resolveDSHBiller(runtimeEnv),
      model: "sglang/Qwen3.8-27B",
      billingType: "unknown",
      costUsd: 0,
      resultJson: {
        stdout: attempt.proc.stdout,
        stderr: attempt.proc.stderr,
      },
      summary: stdoutSummary || stderrLine || `dsh exited with code ${rawExitCode ?? -1}`,
      clearSession: false,
    };
  };

  try {
    const initial = await runAttempt();
    return toResult(initial);
  } finally {
    await Promise.all([
      paperclipBridge?.stop(),
      localSkillsDir ? fs.rm(path.dirname(localSkillsDir), { recursive: true, force: true }).catch(() => undefined) : Promise.resolve(),
    ]);
  }
}
