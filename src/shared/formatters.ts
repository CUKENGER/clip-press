import type { Locale } from "../i18n";

export function formatBytes(
  bytes: number,
  locale: Locale,
  unit: string,
): string {
  const languageTag = locale === "ru" ? "ru-RU" : "en-US";
  return `${new Intl.NumberFormat(languageTag).format(bytes)} ${unit}`;
}

export function formatDuration(seconds: number): string {
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
