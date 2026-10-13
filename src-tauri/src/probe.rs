use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

// ============================================================================
// 1. СТРУКТУРЫ ДЛЯ ПАРСИНГА ВЫВОДА FFPROBE (Внутренний JSON)
// ============================================================================

// `#[serde(default)]` говорит: если какого-то поля нет в JSON от ffprobe,
// не паниковать и не падать с ошибкой, а заполнить дефолтным значением (None или пустой строкой).
#[derive(Debug, Clone, Deserialize)]
struct FfprobeOutput {
    #[serde(default)]
    streams: Vec<FfprobeStream>,
    #[serde(default)]
    format: Option<FfprobeFormat>,
}

#[derive(Debug, Clone, Deserialize)]
struct FfprobeStream {
    // "video", "audio", "subtitle"
    pub codec_type: Option<String>,
    pub codec_name: Option<String>,
    // Разрешение есть только у видео и картинок, у аудио его нет:
    pub width: Option<u32>,
    pub height: Option<u32>,
    // Длительность потока в секундах (может отстутствовать):
    pub duration: Option<String>,
    // Битрейт потока:
    pub bit_rate: Option<String>,
    // Частота кадров в виде дроби "30/1" или "24000/1001":
    pub r_frame_rate: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
struct FfprobeFormat {
    pub format_name: Option<String>,
    pub duration: Option<String>,
    pub size: Option<String>,
    pub bit_rate: Option<String>,
}

// ============================================================================
// 2. ПУБЛИЧНЫЕ СТРУКТУРЫ ДЛЯ ФРОНТЕНДА
// ============================================================================

// Тип медиафайла для логики интерфейса
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Video,
    Image,
    Audio,
    Unknown,
}

// Очищенная и удобная информация о медиафайле
#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct MediaInfo {
    pub file_path: String,
    pub media_type: MediaType,
    pub format_name: String,
    pub size_bytes: u64,
    pub bit_rate_bps: Option<u64>,
    // Длительность в секундах (для видео и аудио)
    pub duration_seconds: Option<f64>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub video_codec: Option<String>,
    pub audio_codec: Option<String>,
    pub fps: Option<f64>,
}

// ============================================================================
// 3. ФУНКЦИЯ ИНСПЕКЦИИ ФАЙЛА
// ============================================================================

// Запускает ffprobe и возвращает разобранные метаданные файла.
// Если файл не существует или ffprobe не может его прочесть - возвращает `Err(String)`.
pub fn probe_file(ffprobe_path: &str, file_path: &Path) -> Result<MediaInfo, String> {
    // Проверяем, существует ли файл физически на диске
    if !file_path.exists() {
        return Err(format!("Файл не существует: {}", file_path.display()));
    }

    // Формируем вызов:
    // ffprobe -v quiet -print_format json -show_streams <путь_к_файлу>
    let output = Command::new(ffprobe_path)
        .arg("-v")
        .arg("quiet")
        .arg("-print_format")
        .arg("json")
        .arg("-show_format")
        .arg("-show_streams")
        .arg(file_path.as_os_str())
        .output()
        .map_err(|e| format!("Не удалось запустить ffprobe: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ffprobe завершился с ошибкой: {}", stderr.trim()));
    }

    // Парсим сырые JSON-байты в нашу Rust-структуру `FfprobeOutput`
    let raw: FfprobeOutput = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Ошибка парсинга JSON ffprobe: {}", e))?;

    // Извлекаем видео и аудио потоки
    let video_stream = raw
        .streams
        .iter()
        .find(|s| s.codec_type.as_deref() == Some("video"));

    let audio_stream = raw
        .streams
        .iter()
        .find(|s| s.codec_type.as_deref() == Some("audio"));

    let size_bytes = raw
        .format
        .as_ref()
        .and_then(|f| f.size.as_deref())
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    let bit_rate_bps = raw
        .format
        .as_ref()
        .and_then(|format| format.bit_rate.as_deref())
        .or_else(|| video_stream.and_then(|stream| stream.bit_rate.as_deref()))
        .and_then(|value| value.parse::<u64>().ok());

    // Определяем длительность (сначала из format, затем из потока)
    let duration_seconds = raw
        .format
        .as_ref()
        .and_then(|f| f.duration.as_deref())
        .or_else(|| video_stream.and_then(|v| v.duration.as_deref()))
        .and_then(|d| d.parse::<f64>().ok());

    // Парсим частоту кадров (например, строка вида "30/1" или "29.97")
    let fps = video_stream
        .and_then(|v| v.r_frame_rate.as_deref())
        .and_then(parse_frame_rate);

    // Определяем тип медиафайла:
    // Если есть видеопоток и длительность > 0 (или есть аудиопоток) - это видео.
    // Если есть видеопоток без длиьельности (или 0) и без аудио - скорее всего статическое
    // изображение (PNG/JPEG)
    let media_type = match (&video_stream, &audio_stream, duration_seconds) {
        (Some(_), _, Some(dur)) if dur > 0.0 => MediaType::Video,
        (Some(_), Some(_), _) => MediaType::Video,
        (Some(_), None, _) => MediaType::Image,
        (None, Some(_), _) => MediaType::Audio,
        _ => MediaType::Unknown,
    };

    Ok(MediaInfo {
        file_path: file_path.to_string_lossy().to_string(),
        media_type,
        format_name: raw
            .format
            .and_then(|f| f.format_name)
            .unwrap_or_else(|| "unknown".to_string()),
        size_bytes,
        duration_seconds,
        width: video_stream.and_then(|v| v.width),
        height: video_stream.and_then(|v| v.height),
        video_codec: video_stream.and_then(|v| v.codec_name.clone()),
        audio_codec: audio_stream.and_then(|a| a.codec_name.clone()),
        fps,
        bit_rate_bps,
    })
}

fn parse_frame_rate(fps_str: &str) -> Option<f64> {
    let parts: Vec<&str> = fps_str.split("/").collect();
    if parts.len() == 2 {
        let num: f64 = parts[0].parse().ok()?;
        let den: f64 = parts[1].parse().ok()?;
        if den > 0.0 {
            return Some((num / den * 100.0).round() / 100.0);
        }
    } else if let Ok(val) = fps_str.parse::<f64>() {
        return Some(val);
    }
    None
}

// ============================================================================
// 4. ТЕСТЫ
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_frame_rate() {
        assert_eq!(parse_frame_rate("30/1"), Some(30.0));
        assert_eq!(parse_frame_rate("24000/1001"), Some(23.98));
        assert_eq!(parse_frame_rate("0/0"), None);
        assert_eq!(parse_frame_rate("invalid"), None);
    }

    #[test]
    fn test_non_existent_file() {
        let res = probe_file("ffprobe", Path::new("/path/that/definitely/does/not/exist"));
        assert!(res.is_err());
    }
}
