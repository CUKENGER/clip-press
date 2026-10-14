import { formatBytes, formatDuration } from "../../shared/formatters";
import { MediaInfo } from "../../types";

interface Props {
  mediaInfo: MediaInfo | null;
  inspecting: boolean;
  error: string | null;
  onChooseFile: () => void;
}

export function MediaInfoCard({
  error,
  mediaInfo,
  inspecting,
  onChooseFile,
}: Props) {
  return (
    <section className="card media-card">
      <div className="card-header">
        <h2>Информация о файле</h2>
        <button onClick={onChooseFile} disabled={inspecting}>
          {inspecting ? "Анализирую..." : "Выбрать файл"}
        </button>
      </div>

      {error && (
        <div className="alert error">Не удалось прочитать файл: {error}</div>
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
              <dd>{(mediaInfo.bit_rate_bps / 1_000_000).toFixed(2)} Мбит/с</dd>
            </>
          )}
        </dl>
      )}
    </section>
  );
}
