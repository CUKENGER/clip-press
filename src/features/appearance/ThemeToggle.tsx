import type { Translate } from "../../i18n";
import type { Theme } from "./useTheme";

interface Props {
  theme: Theme;
  onToggle: () => void;
  t: Translate;
}

export function ThemeToggle({ theme, onToggle, t }: Props) {
  const targetLabel = theme === "dark" ? t("lightTheme") : t("darkTheme");

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={onToggle}
      aria-label={targetLabel}
      title={targetLabel}
    >
      {targetLabel}
    </button>
  );
}
