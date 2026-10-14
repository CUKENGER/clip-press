import { invoke } from "@tauri-apps/api/core";
import { DependenciesStatus } from "../../types";

export function checkDependencies(): Promise<DependenciesStatus> {
  return invoke<DependenciesStatus>("check_dependencies", {
    customFfpmeg: null,
    customFfprobe: null,
  });
}
