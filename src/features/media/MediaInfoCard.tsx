import { formatBytes, formatDuration } from "../../shared/formatters";
import type { Locale, Translate } from "../../i18n";
import type { MediaInfo } from "../../types";

interface Props {
  mediaInfo: MediaInfo | null;
  inspecting: boolean;
  error: string | null;
  onChooseFile: () => void;
  locale: Locale;
  t: Translate;
}

export function MediaInfoCard({
  error,
  mediaInfo,
  inspecting,
  onChooseFile,
  locale,
  t,
}: Props) {
  return (
    <section className="card media-card">
      <div className="card-header">
        <h2>{t("mediaInfo")}</h2>
        <button onClick={onChooseFile} disabled={inspecting}>
          {inspecting ? t("analyzing") : t("chooseFile")}
        </button>
      </div>

      {error && (
        <div className="alert error">
          {t("inspectError")}: {error}
        </div>
      )}

      {mediaInfo && (
        <dl className="media-details">
          <dt>{t("file")}</dt>
          <dd>{mediaInfo.file_path}</dd>

          <dt>{t("type")}</dt>
          <dd>{t(mediaInfo.media_type)}</dd>

          <dt>{t("format")}</dt>
          <dd>{mediaInfo.format_name}</dd>

          <dt>{t("size")}</dt>
          <dd>{formatBytes(mediaInfo.size_bytes, locale, t("bytes"))}</dd>

          {mediaInfo.duration_seconds !== null && (
            <>
              <dt>{t("duration")}</dt>
              <dd>{formatDuration(mediaInfo.duration_seconds)}</dd>
            </>
          )}

          {mediaInfo.width !== null && mediaInfo.height !== null && (
            <>
              <dt>{t("resolution")}</dt>
              <dd>
                {mediaInfo.width} × {mediaInfo.height}
              </dd>
            </>
          )}

          {mediaInfo.video_codec && (
            <>
              <dt>{t("videoCodec")}</dt>
              <dd>{mediaInfo.video_codec}</dd>
            </>
          )}

          {mediaInfo.audio_codec && (
            <>
              <dt>{t("audioCodec")}</dt>
              <dd>{mediaInfo.audio_codec}</dd>
            </>
          )}

          {mediaInfo.fps !== null && (
            <>
              <dt>{t("frameRate")}</dt>
              <dd>
                {mediaInfo.fps} {t("fps")}
              </dd>
            </>
          )}

          {mediaInfo.bit_rate_bps !== null && (
            <>
              <dt>{t("bitrate")}</dt>
              <dd>
                {new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(mediaInfo.bit_rate_bps / 1_000_000)}{" "}
                {t("megabitsPerSecond")}
              </dd>
            </>
          )}
        </dl>
      )}
    </section>
  );
}
