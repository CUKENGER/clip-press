import type { DependenciesStatus } from "../../types";

interface Props {
  status: DependenciesStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function DependencyStatusCard({
  status,
  loading,
  error,
  onRefresh,
}: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Системные зависимости</h2>
        <button onClick={onRefresh} disabled={loading}>
          {loading ? "Проверка..." : "Обновить статус"}
        </button>
      </div>

      {error && (
        <div className="alert error">Ошибка вызова бэкенда: {error}</div>
      )}

      {status && (
        <div className="deps-list">
          <DependencyItem name="FFmpeg" status={status.ffmpeg} />
          <DependencyItem name="FFprobe" status={status.ffprobe} />

          {!status.all_available && (
            <div className="alert warning">
              Для работы приложения требуются FFmpeg и FFprobe.
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function DependencyItem({
  name,
  status,
}: {
  name: string;
  status: DependenciesStatus["ffmpeg"];
}) {
  return (
    <div className={`dep-item ${status.available ? "ok" : "fail"}`}>
      <div className="dep-title">
        <strong>{name}:</strong>{" "}
        <span>{status.available ? "Доступен" : "Не найден"}</span>
      </div>

      {status.version && <div className="dep-detail">{status.version}</div>}
      {status.path && <div className="dep-path">Путь: {status.path}</div>}
      {status.error && <div className="dep-error">Ошибка: {status.error}</div>}
    </div>
  );
}
