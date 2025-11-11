export function sanitizeMarkdownToText(markdown: string): string {
    return markdown
        // убираем html-теги
        .replace(/<[^>]*>/g, "")
        // убираем изображения, оставляем alt-текст
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        // убираем ссылки, оставляем текст ссылки
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        // убираем заголовки (# в начале строки)
        .replace(/^#{1,6}\s*/gm, "")
        // убираем форматирование (*, _, ~~)
        .replace(/[*_~`]/g, "")
        // схлопываем пробелы
        .replace(/\s+/g, " ")
        .trim()
}