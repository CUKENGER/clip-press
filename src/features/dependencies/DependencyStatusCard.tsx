import type { Translate } from "../../i18n";
import type { DependenciesStatus } from "../../types";

interface Props {
  status: DependenciesStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  t: Translate;
}

export function DependencyStatusCard({
  status,
  loading,
  error,
  onRefresh,
  t,
}: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>{t("dependenciesTitle")}</h2>
        <button onClick={onRefresh} disabled={loading}>
          {loading ? t("checking") : t("refreshStatus")}
        </button>
      </div>

      {error && (
        <div className="alert error">
          {t("backendCallError")}: {error}
        </div>
      )}

      {status && (
        <div className="deps-list">
          <DependencyItem name="FFmpeg" status={status.ffmpeg} t={t} />
          <DependencyItem name="FFprobe" status={status.ffprobe} t={t} />

          {!status.all_available && (
            <div className="alert warning">{t("requiresTools")}</div>
          )}
        </div>
      )}
    </section>
  );
}

function DependencyItem({
  name,
  status,
  t,
}: {
  name: string;
  status: DependenciesStatus["ffmpeg"];
  t: Translate;
}) {
  return (
    <div className={`dep-item ${status.available ? "ok" : "fail"}`}>
      <div className="dep-title">
        <strong>{name}:</strong>{" "}
        <span>{status.available ? t("available") : t("notFound")}</span>
      </div>

      {status.version && <div className="dep-detail">{status.version}</div>}
      {status.path && (
        <div className="dep-path">
          {t("path")}: {status.path}
        </div>
      )}
      {status.error && (
        <div className="dep-error">
          {t("processError")}: {status.error}
        </div>
      )}
    </div>
  );
}
