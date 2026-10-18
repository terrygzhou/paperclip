import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { expect, test } from "vitest";

import {
  createHermesGatewayServerAdapter,
  createHermesLocalServerAdapter,
  createServerAdapter,
  hermesGatewayType,
} from "./index.js";
import { createServerAdapter as createGatewayServerAdapterFromSubpath } from "./gateway/index.js";

test("root package export exposes Paperclip external adapter entrypoint", () => {
  const adapter = createServerAdapter();

  expect(adapter.type).toBe("hermes_local");
  expect(typeof adapter.execute).toBe("function");
  expect(typeof adapter.testEnvironment).toBe("function");
  expect(typeof adapter.sessionCodec?.deserialize).toBe("function");
  expect(adapter.sessionManagement?.nativeContextManagement).toBe("confirmed");
  expect(adapter.supportsLocalAgentJwt).toBe(true);
  expect(adapter.supportsInstructionsBundle).toBe(true);
  expect(adapter.instructionsPathKey).toBe("instructionsFilePath");
  expect(adapter.getRuntimeCommandSpec?.({ command: "hermes-dev" })).toMatchObject({
    command: "hermes-dev",
    detectCommand: "hermes-dev",
    installCommand: null,
  });
  expect(typeof adapter.detectModel).toBe("function");
  expect(typeof adapter.getConfigSchema).toBe("function");
});

test("root package export keeps explicit local and gateway adapter factories", () => {
  const localAdapter = createHermesLocalServerAdapter();
  const gatewayAdapter = createHermesGatewayServerAdapter();

  expect(localAdapter.type).toBe("hermes_local");
  expect(gatewayAdapter.type).toBe("hermes_gateway");
  expect(hermesGatewayType).toBe("hermes_gateway");
  expect(gatewayAdapter.supportsLocalAgentJwt).toBe(false);
  expect(gatewayAdapter.supportsInstructionsBundle).toBe(false);
});

test("gateway subpath export exposes the Hermes Gateway adapter entrypoint", () => {
  const adapter = createGatewayServerAdapterFromSubpath();

  expect(adapter.type).toBe("hermes_gateway");
  expect(typeof adapter.execute).toBe("function");
  expect(typeof adapter.testEnvironment).toBe("function");
  expect(typeof adapter.sessionCodec?.deserialize).toBe("function");
  expect(adapter.sessionManagement?.nativeContextManagement).toBe("confirmed");
  expect(typeof adapter.getConfigSchema).toBe("function");
});

test("Hermes adapter exposes bundled Paperclip task bridge skill", async () => {
  const adapter = createServerAdapter();
  const snapshot = await adapter.listSkills?.({
    adapterType: "hermes_local",
    agentId: "11111111-1111-4111-8111-111111111111",
    companyId: "22222222-2222-4222-8222-222222222222",
    config: {},
  });

  expect(snapshot?.entries.some((entry) => entry.runtimeName === "paperclip-task-bridge")).toBe(true);
});

test("Hermes keeps the operational Paperclip skill linked after an empty replacement", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-hermes-core-skill-"));
  try {
    const source = path.join(home, "runtime-skills", "paperclip");
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(path.join(source, "SKILL.md"), "# Paperclip\n", "utf8");
    const adapter = createServerAdapter();
    const snapshot = await adapter.syncSkills?.({
      adapterType: "hermes_local",
      agentId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      config: {
        env: { HOME: home },
        paperclipRuntimeSkills: [{
          key: "paperclipai/paperclip/paperclip",
          runtimeName: "paperclip",
          source,
        }],
        paperclipSkillSync: { desiredSkills: [] },
      },
    }, []);

    expect(snapshot?.desiredSkills).toContain("paperclipai/paperclip/paperclip");
    expect((await fs.lstat(path.join(home, ".hermes", "skills", "paperclip"))).isSymbolicLink()).toBe(true);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test("Hermes rejects a conflicting operational skill target", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-hermes-core-conflict-"));
  try {
    const source = path.join(home, "runtime-skills", "paperclip");
    const target = path.join(home, ".hermes", "skills", "paperclip");
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(path.join(source, "SKILL.md"), "# Paperclip\n", "utf8");
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(path.join(target, "SKILL.md"), "# Conflicting skill\n", "utf8");
    const adapter = createServerAdapter();

    await expect(adapter.syncSkills?.({
      adapterType: "hermes_local",
      agentId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      config: {
        env: { HOME: home },
        paperclipRuntimeSkills: [{
          key: "paperclipai/paperclip/paperclip",
          runtimeName: "paperclip",
          source,
        }],
      },
    }, [])).rejects.toThrow("occupied by another installation");
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test("Hermes repairs a live symlink owned by another managed Paperclip catalog", async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-hermes-core-link-managed-"));
  const pcHome = await fs.mkdtemp(path.join(os.tmpdir(), "paperclip-hermes-core-pc-"));
  const prevPcHome = process.env.PAPERCLIP_HOME;
  const prevInstanceId = process.env.PAPERCLIP_INSTANCE_ID;
  try {
    const source = path.join(home, "runtime-skills", "paperclip");
    await fs.mkdir(source, { recursive: true });
    await fs.writeFile(path.join(source, "SKILL.md"), "# Paperclip\n", "utf8");
    const target = path.join(home, ".hermes", "skills", "paperclip");
    // Synthetic managed Paperclip catalog under a temp PAPERCLIP_HOME:
    //   instances/<id>/skills/<companyId>/__versions__/<skillId>/<versionId>
    const companyId = randomUUID();
    const skillId = randomUUID();
    const versionId = randomUUID();
    const managedCatalog = path.join(
      pcHome,
      "instances",
      "default",
      "skills",
      companyId,
      "__versions__",
      skillId,
      versionId,
    );
    await fs.mkdir(managedCatalog, { recursive: true });
    await fs.writeFile(
      path.join(managedCatalog, "SKILL.md"),
      "# Foreign managed skill\n",
      "utf8",
    );
    await fs.mkdir(path.dirname(target), { recursive: true });
    // The slot's live symlink points into the foreign company's managed catalog.
    await fs.symlink(managedCatalog, target);
    // Point PAPERCLIP_HOME at the synthetic catalog so the reconciler's
    // managed-catalog root resolves here; detection is by path shape.
    process.env.PAPERCLIP_HOME = pcHome;
    process.env.PAPERCLIP_INSTANCE_ID = "default";
    const adapter = createServerAdapter();

    // A foreign managed-catalog point is repaired, not clobbering: it succeeds
    // and the target is re-linked to the desired source.
    await expect(adapter.syncSkills?.({
      adapterType: "hermes_local",
      agentId: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      config: {
        env: { HOME: home },
        paperclipRuntimeSkills: [{
          key: "paperclipai/paperclip/paperclip",
          runtimeName: "paperclip",
          source,
        }],
      },
    }, [])).resolves.toEqual(expect.anything());
    expect(await fs.readlink(target)).toBe(source);
  } finally {
    if (prevPcHome === undefined) delete process.env.PAPERCLIP_HOME;
    else process.env.PAPERCLIP_HOME = prevPcHome;
    if (prevInstanceId === undefined) delete process.env.PAPERCLIP_INSTANCE_ID;
    else process.env.PAPERCLIP_INSTANCE_ID = prevInstanceId;
    await fs.rm(home, { recursive: true, force: true });
    await fs.rm(pcHome, { recursive: true, force: true });
  }
});
