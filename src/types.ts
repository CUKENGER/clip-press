export type MediaType = "video" | "image" | "audio" | "unknown";

export interface MediaInfo {
  file_path: string;
  media_type: MediaType;
  format_name: string;
  size_bytes: number;
  bit_rate_bps: number | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  video_codec: string | null;
  audio_codec: string | null;
  fps: number | null;
}

// Отражает структуру `BinaryStatus` из Rust
export interface BinaryStatus {
  name: string;
  available: boolean;
  // В Rust был `Option<String>` - в JSON это строка либо null
  path: string | null;
  version: string | null;
  error: string | null;
}

// Отражает структуру `DependenciesStatus` из Rust
export interface DependenciesStatus {
  ffmpeg: BinaryStatus;
  ffprobe: BinaryStatus;
  all_available: boolean;
}
