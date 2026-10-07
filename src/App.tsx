import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { DependenciesStatus } from "./types";

function App() {
  const [status, setStatus] = useState<DependenciesStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshDependencies() {
    setLoading(true);
    setError(null);
    try {
      // invoke типизируется дженериком <DependenciesStatus>
      const result = await invoke<DependenciesStatus>("check_dependencies", {
        customFfmpeg: null,
        customFfprobe: null,
      });
      setStatus(result);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshDependencies();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>clip-press</h1>
        <p className="subtitle">Конвертация и сжатие медиа</p>
      </header>

      <section className="card">
        <div className="card-header">
          <h2>Системные зависимости</h2>
          <button onClick={refreshDependencies} disabled={loading}>
            {loading ? "Проверка..." : "Обновить статус"}
          </button>
        </div>

        {error && (
          <div className="alert error">Ошибка вызова бэкенда: {error}</div>
        )}

        {status && (
          <div className="deps-list">
            <div
              className={`dep-item ${status.ffmpeg.available ? "ok" : "fail"}`}
            >
              <div className="dep-title">
                <strong>FFmpeg:</strong>{" "}
                <span>
                  {status.ffmpeg.available ? "Доступен" : "Не найден"}
                </span>
              </div>
              {status.ffmpeg.version && (
                <div className="dep-detail">{status.ffmpeg.version}</div>
              )}
              {status.ffmpeg.path && (
                <div className="dep-path">Путь: {status.ffmpeg.path}</div>
              )}
              {status.ffmpeg.error && (
                <div className="dep-error">Ошибка: {status.ffmpeg.error}</div>
              )}
            </div>

            <div
              className={`dep-item ${status.ffprobe.available ? "ok" : "fail"}`}
            >
              <div className="dep-title">
                <strong>FFprobe:</strong>{" "}
                <span>
                  {status.ffprobe.available ? "Доступен" : "Не найден"}
                </span>
              </div>
              {status.ffprobe.version && (
                <div className="dep-detail">{status.ffprobe.version}</div>
              )}
              {status.ffprobe.path && (
                <div className="dep-path">Путь: {status.ffprobe.path}</div>
              )}
              {status.ffprobe.error && (
                <div className="dep-error">Ошибка: {status.ffprobe.error}</div>
              )}
            </div>

            {!status.all_available && (
              <div className="alert warning">
                Для работы приложения требуются обе утилиты. Установите их через
                пакетный менеджер или укажите путь вручную.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
