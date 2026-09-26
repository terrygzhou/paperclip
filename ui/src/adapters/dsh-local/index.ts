import type { UIAdapterModule } from "../types";
import { parseDshStdoutLine } from "./parse-stdout";
import { DshLocalConfigFields } from "./config-fields";
import { buildDshLocalConfig } from "./build-config";

export const dshLocalUIAdapter: UIAdapterModule = {
  type: "dsh_local",
  label: "DSH",
  parseStdoutLine: parseDshStdoutLine,
  ConfigFields: DshLocalConfigFields,
  buildAdapterConfig: buildDshLocalConfig,
};
