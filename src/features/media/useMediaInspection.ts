import { useState } from "react";
import { MediaInfo } from "../../types";
import { inspectMediaFile, selectMediaFile } from "./api";

export function useMediaInspection() {
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function chooseAndInspectFile() {
    setError(null);
    setInspecting(true);

    try {
      const filePath = await selectMediaFile();

      // null означает, что диалог закрыли без выбора.
      if (filePath === null) return;

      setMediaInfo(await inspectMediaFile(filePath));
    } catch (err) {
      setError(String(err));
    } finally {
      setInspecting(false);
    }
  }
  return { mediaInfo, inspecting, error, chooseAndInspectFile };
}
