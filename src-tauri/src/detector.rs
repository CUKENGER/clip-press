// ============================================================================
// 1. Импорты (use)
// ============================================================================

// `use` - аналог `import` в TypeScript и Go
// `serde::Serialize` - трейт (интерфейс), позовляющий автоматически
// превращать структуры Rust в JSON для отправки на фронтенд (React)
use serde::Serialize;

// `Path` и `PathBuf` - типы для работы с файловыми путями:
// `Path` - срез пути по ссылке (как `&str`, только для путей).
// `PathBuf` - владеющий путь с памятью в куче (как `String`, только для путей)
use std::path::{Path, PathBuf};

// `Command` - модуль стандартной библиотеки для запуска внешних процессов.
// Запускает бинарник напрямую через системный вызов ядра OC (execve),
// минуя командную оболочку (shell). Это защищает от инъекций.
use std::process::Command;

// ============================================================================
// 2. Структура данных (struct) и МАКРОС DERIVE
// ============================================================================

// `#[derive(...)]` - процедурный макрос.
// В отличие от декораторов TypeScript, которые работают в рантайме, `derive`
// прямо во время компиляции генерирует готовый код реализации трейтов (интерфейсов)
// - `Debug` - дает возможность распечатать структуру в консоль через `printIn!("{:?}", x)`
// - `Clone` - добавляет метод `.clone()` для глубокого копирования объекта в памяти
// - `Serialize` - генерирует код сериализации в JSON
// - `PartialEq` - позволяет сравнивать две структуры через `==` в тестах
#[derive(Debug, Clone, Serialize, PartialEq)]
// `pub` - public. Без `pub` структура была бы видна только внутри этого файла.
// В Go аналог - имя с большой буквы (`BinaryStatus`), в TS - `export interface`.
pub struct BinaryStatus {
    // В Rust поля по умолчанию тоже приватные, поэтому каждому нужно указать `pub`.
    pub name: String,

    // `bool` - примитивный логический тип (true / false), как в JS и Go.
    pub available: bool,

    // `Option<T>` - стандартное перечисление Rust:
    // Либо `Some(значение)`, либо `None`.
    // В TypeScript аналог: `string | undefined`.
    // В Go аналог: указатель `*string`, который может быть `nil`.
    pub path: Option<String>,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct DependenciesStatus {
    pub ffmpeg: BinaryStatus,
    pub ffprobe: BinaryStatus,
    pub all_available: bool,
}

// ============================================================================
// 3.Основная ЛОГИКА ДЕТЕКЦИИ
// ============================================================================

// `pub fn` - публичная функция.
// Параметры:
// - `name: &str` - заимственная строка (срез). Мы не забираем память, а только читаем.
// - `custom_path: Option<&str>` - путь может быть передан (`Some("/usr/bin/ffmpeg")`),
// а может отсутствовать (`None`).
// Возвращает (`->`): владелицу созданной структуры `BinaryStatus`.
pub fn inspect_binary(name: &str, custom_path: Option<&str>) -> BinaryStatus {
    // `let` - объявление переменной. В Rust все переменные по умолчанию неизменяемые (immutable).
    // Это как `const` в JS. Если бы мы хотели поменять переменную, написали бы `let mut`.
    //
    // `match` - оператор сопоставления с образцом (pattern matching).
    // Аналог `switch` в JS/Go, но компилятор Rust гарантирует, что мы учли все случаи.
    let executable: PathBuf = match custom_path {
        // `Some(path) if ...` - образец с условием (match guard).
        // Ветка сработает, только если внутри `Option` лежит строка и она не пустая.
        Some(path) if !path.trim().is_empty() => PathBuf::from(path),

        // `_` - wildcard (подстановочный знак).
        // Срабатывает в любом другом случае (если пришел `None` или пустая строка).
        // Аналог блока `default` в switch.
        _ => PathBuf::from(name),
    };

    // Запуск процесса: `executable -version`
    // `.arg("-version")` передает аргумент отдельным элементом массива аргументов.
    // `.output()` запускает процесс синхронно, ожидает его завершения
    // и возвращает `Result<Output, std::io::Error>`.
    let output = Command::new(&executable).arg("-version").output();

    // Обрабатываем результат запуска процесса через `match`:
    match output {
        // Ветка 1: Процесс успешно стартовал и завершился с кодом 0 (status.success())
        Ok(out) if out.status.success() => {
            // `out.stdout` - это массив сырых байтов `Vec<u8>`.
            // `String::from_utf8_lossy` безопасно превращает байты в текст.
            // Если встретятся невалидные UTF-8 символы, они заменятся на значок ``.
            // let stdout = String::from_utf8_lossy(&out.stdout);
            let version_output = if out.stdout.is_empty() {
                &out.stderr
            } else {
                &out.stdout
            };
            let version = String::from_utf8_lossy(version_output)
                .lines()
                .next()
                .map(|line| line.to_string());

            // Функциональная цепочка обработки строки:
            // `.lines()` - создает итератор по строкам.
            // `.next()` - берет первую строку (возвращает `Option<&str>`).
            // `.map(...)` - аналог `Array.prototype.map` в JS: преобразует значение внутри `Some`,
            // если оно есть, вызывая замыкание (лямбду) `|line| line.to_string()`.
            // Синтаксис `|x| x + 1` в Rust - то же самое, что `(x) => x + 1` в JS.
            // let version = stdout.lines().next().map(|line| line.to_string());

            let resolved_path = resolve_full_path(&executable);

            // Создаем и возвращаем экземпляр `BinaryStatus`.
            // Заметьте: в конце блока нет `;` и нет слова `return`.
            // В Rust последнее выражение блока автоматически возвращается!
            BinaryStatus {
                name: name.to_string(),
                available: true,
                path: resolved_path,
                version,
                error: None,
            }
        }

        // Ветка 2: процесс запустился, но завершился с ошибкой (код != 0)
        Ok(out) => {
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            BinaryStatus {
                name: name.to_string(),
                available: false,
                path: None,
                version: None,
                // `format!` - макрос для форматирования строк, как `fmt.Sprintf` в Go.
                error: Some(format!("Exit code {}: {}", out.status, stderr.trim())),
            }
        }

        // Ветка 3: процесс вообще не смог запуститься (бинарник не найден в PATH или нет прав `+x`)
        Err(err) => {
            BinaryStatus {
                name: name.to_string(),
                available: false,
                path: None,
                version: None,
                // `err.to_string()` преобразует ошибку ввода-вывода в читаемый текст
                error: Some(err.to_string()),
            }
        }
    }
}

// Вспомогательная функция для поиска полного пути.
// Принимает `path: &Path` (ссылка на путь, чтобы избежать клонирования).
fn resolve_full_path(path: &Path) -> Option<String> {
    // Если передан абсолютный путь (начинается с `/` в Linux), возвращаем его сразу
    if path.is_absolute() {
        return Some(path.to_string_lossy().to_string());
    }

    //`#[cfg(unix)]` - условная компиляция.
    // Этот блок компилируется только на Unix-подобных системах (Linux, macOS).
    // На Windows этот кусок кода компилятор просто проигнорирует.
    #[cfg(unix)]
    {
        // Ищем через системную утилиту `which`
        if let Ok(output) = Command::new("which").arg(path).output() {
            // `if let` в Rust - синтаксический сахар:
            // "выполни этот блок, только если результат совпадает с шаблоном"
            if output.status.success() {
                let found = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !found.is_empty() {
                    return Some(found);
                }
            }
        }
    }

    // Запасной вариант: возвращаем имя как есть
    Some(path.to_string_lossy().to_string())
}

/// Проверяет сразу обе утилиты и формирует итоговый статус.
pub fn check_all_dependencies(
    custom_ffmpeg: Option<&str>,
    custom_ffprobe: Option<&str>,
) -> DependenciesStatus {
    let ffmpeg = inspect_binary("ffmpeg", custom_ffmpeg);
    let ffprobe = inspect_binary("ffprobe", custom_ffprobe);
    let all_available = ffmpeg.available && ffprobe.available;

    DependenciesStatus {
        ffmpeg,
        ffprobe,
        all_available,
    }
}

// ============================================================================
// 4. МОДУЛЬНЫЕ ТЕСТЫ
// ============================================================================

// В Rust тесты пишутся прямо в том же файле, что и код.
// `#[cfg(test)]` говорит компилятору: "собирай этот модуль только при запуске `cargo test`".
// В релизную сборку этот код не попадет ни одним байтом.
#[cfg(test)]
mod test {
    //`super::*` импортирует все из родительского модуля (то есть функции выше)
    use super::*;

    //`#[test]` указывает раннеру тестов, что это тестовая функция
    #[test]
    fn test_non_existent_binary() {
        let status = inspect_binary("definitely_not_an_existing_binary_12345", None);
        // `assert!` проверяет истинность условия. Если false - тест упадет с паникой.
        assert!(!status.available);
        assert!(status.version.is_none());
        assert!(status.error.is_some());
    }
}
