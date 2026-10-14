import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { MediaInfo } from "../../types";

export async function selectMediaFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Видео и изображения",
        extensions: [
          "mp4",
          "mkv",
          "mov",
          "webm",
          "avi",
          "m4v",
          "mpeg",
          "mpg",
          "3gp",
          "png",
          "jpg",
          "jpeg",
          "webp",
          "gif",
          "bmp",
          "tif",
          "tiff",
        ],
      },
    ],
  });

  return typeof selected === "string" ? selected : null;
}

export function inspectMediaFile(filePath: string): Promise<MediaInfo> {
  return invoke<MediaInfo>("inspect_media_file", {
    filePath,
    customFfprobe: null,
  });
}
