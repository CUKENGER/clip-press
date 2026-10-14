import { DependencyStatusCard } from "./features/dependencies/DependencyStatusCard";
import { useDependencies } from "./features/dependencies/useDependencies";
import { MediaInfoCard } from "./features/media/MediaInfoCard";
import { useMediaInspection } from "./features/media/useMediaInspection";
import "./App.css";

function App() {
  const dependencies = useDependencies();
  const media = useMediaInspection();

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

      <MediaInfoCard
        mediaInfo={media.mediaInfo}
        inspecting={media.inspecting}
        error={media.error}
        onChooseFile={() => void media.chooseAndInspectFile()}
      />
    </main>
  );
}

export default App;
