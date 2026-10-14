import { useEffect, useState } from "react";
import { DependencyStatusCard } from "./features/dependencies/DependencyStatusCard";
import { useDependencies } from "./features/dependencies/useDependencies";
import { MediaInfoCard } from "./features/media/MediaInfoCard";
import { useMediaInspection } from "./features/media/useMediaInspection";
import { translate, type Locale, type Translate } from "./i18n";
import "./App.css";

function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    return localStorage.getItem("clip-press-locale") === "en" ? "en" : "ru";
  });

  useEffect(() => {
    localStorage.setItem("clip-press-locale", locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t: Translate = (key) => translate(locale, key);
  const dependencies = useDependencies();
  const media = useMediaInspection();

  return (
    <main className="container">
      <header>
        <div>
          <h1>clip-press</h1>
          <p className="subtitle">{t("appSubtitle")}</p>
        </div>

        <label className="language-control">
          <span>{t("language")}</span>
          <select
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
            aria-label={t("language")}
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
          </select>
        </label>
      </header>

      <DependencyStatusCard
        status={dependencies.status}
        loading={dependencies.loading}
        error={dependencies.error}
        onRefresh={() => void dependencies.refresh()}
        t={t}
      />

      <MediaInfoCard
        mediaInfo={media.mediaInfo}
        inspecting={media.inspecting}
        error={media.error}
        onChooseFile={() => void media.chooseAndInspectFile()}
        locale={locale}
        t={t}
      />
    </main>
  );
}

export default App;
