import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { DependencyStatusCard } from "./features/dependencies/DependencyStatusCard";
import { useDependencies } from "./features/dependencies/useDependencies";
import type { MediaInfo } from "./types";
import "./App.css";

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString("ru-RU")} байт`;
}

function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds,
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function App() {
  const dependencies = useDependencies();

  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  async function chooseAndInspectFile() {
    setMediaError(null);

    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Видео и изображения",
            extensions: [
              "mp4", "mkv", "mov", "webm", "avi", "m4v", "mpeg", "mpg", "3gp",
              "png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff",
            ],
          },
        ],
      });

      if (typeof selected !== "string") {
        return;
      }

      setInspecting(true);
      setMediaInfo(null);

      const result = await invoke<MediaInfo>("inspect_media_file", {
        filePath: selected,
        customFfprobe: null,
      });

      setMediaInfo(result);
    } catch (err) {
      setMediaError(String(err));
    } finally {
      setInspecting(false);
    }
  }

  return (
    <main className="container">
      <header>
        <h1>clip-press</h1>
        <p className="subtitle">Конвертация и сжатие медиа</p>
      </header>

      <DependencyStatusCard
        status={dependencies.status}
        loading={dependencies.loading}
        error={dependencies.error}
        onRefresh={() => void dependencies.refresh()}
      />

      <section className="card media-card">
        <div className="card-header">
          <h2>Информация о файле</h2>
          <button onClick={chooseAndInspectFile} disabled={inspecting}>
            {inspecting ? "Анализирую..." : "Выбрать файл"}
          </button>
        </div>

        {mediaError && (
          <div className="alert error">
            Не удалось прочитать файл: {mediaError}
          </div>
        )}

        {mediaInfo && (
          <dl className="media-details">
            <dt>Файл</dt>
            <dd>{mediaInfo.file_path}</dd>

            <dt>Тип</dt>
            <dd>{mediaInfo.media_type}</dd>

            <dt>Формат</dt>
            <dd>{mediaInfo.format_name}</dd>

            <dt>Размер</dt>
            <dd>{formatBytes(mediaInfo.size_bytes)}</dd>

            {mediaInfo.duration_seconds !== null && (
              <>
                <dt>Длительность</dt>
                <dd>{formatDuration(mediaInfo.duration_seconds)}</dd>
              </>
            )}

            {mediaInfo.width !== null && mediaInfo.height !== null && (
              <>
                <dt>Разрешение</dt>
                <dd>
                  {mediaInfo.width} × {mediaInfo.height}
                </dd>
              </>
            )}

            {mediaInfo.video_codec && (
              <>
                <dt>Видеокодек</dt>
                <dd>{mediaInfo.video_codec}</dd>
              </>
            )}

            {mediaInfo.audio_codec && (
              <>
                <dt>Аудиокодек</dt>
                <dd>{mediaInfo.audio_codec}</dd>
              </>
            )}

            {mediaInfo.fps !== null && (
              <>
                <dt>Частота кадров</dt>
                <dd>{mediaInfo.fps} FPS</dd>
              </>
            )}

            {mediaInfo.bit_rate_bps !== null && (
              <>
                <dt>Битрейт</dt>
                <dd>
                  {(mediaInfo.bit_rate_bps / 1_000_000).toFixed(2)} Мбит/с
                </dd>
              </>
            )}
          </dl>
        )}
      </section>
    </main>
  );
}

export default App;
