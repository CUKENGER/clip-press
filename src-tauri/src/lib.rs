// ============================================================================
// ПОДКЛЮЧЕНИЕ МОДУЛЕЙ И ИМПОРТЫ
// ============================================================================

// `mod detector;`
// В Rust это команда для компилятора: найти файл `detector.rs` в этой же папке
// и скомпилировать его как модуль с именем `detector`.
// (В TS мы просто пишем import, в Rust сначала объявляем модуль через `mod`).
mod detector;

// После того как модуль объявлен через `mod`, мы можем использовать `use`
// для импорта конкретных сушностей из него:
use detector::{check_all_dependencies, DependenciesStatus};

// ============================================================================
// КОМАНДЫ TAURI (RPC / IPC мост между Rust и React)
// ============================================================================

// `#[tauri::command]`
// Макрос регистрирует функцию как вызываемую из фронтенда через `invoke(...)`.
// Он автоматически преобразует JSON-аргументы из JS в типы Rust
// и сериализует возвращаемое значение обратно в JSON для Promise в JS.

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn check_dependencies(
    custom_ffmpeg: Option<String>,
    custom_ffprobe: Option<String>,
) -> DependenciesStatus {
    // `.as_deref()`:
    // Функция `check_all_dependencies` ждет `Option<&str>` (дешевую ссылку на срез строки),
    // а фронтенд прислал нам `Option<String>` (полноценную строку, владеющую памятью).
    // Метод `.as_deref()` временно превращает `&Option<String>` в `Option<&str>`
    // без лишнего клонирования и выделения памяти в куче.
    check_all_dependencies(custom_ffmpeg.as_deref(), custom_ffprobe.as_deref())
}

// ============================================================================
// ТОЧКА СБОРКИ ПРИЛОЖЕНИЯ
// ============================================================================

// Макрос для мобильных платформ (генерируется Tauri по умолчанию)
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Плагин для безопасного открытия ссылок в системном браузере
        .plugin(tauri_plugin_opener::init())
        // `generate_handler!` - макрос Tauri, создающий диспетчер команд.
        // Здесь мы перечисляем через запятую все функции с атрибутом `#[tauri::command]`.
        .invoke_handler(tauri::generate_handler![check_dependencies])
        // `generate_context!` читает файл конфигурации `tauri.conf.json` во время сборки
        .run(tauri::generate_context!())
        // `.expect(...)` - обработка паники. Если приложение не смогло инициализироваться
        // (например, нет прав на создание окна или битый конфиг), вывести эту ошибку в stderr.
        .expect("error while running tauri application");
}
