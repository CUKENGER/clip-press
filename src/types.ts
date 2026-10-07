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
