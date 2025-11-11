export function fileParser(markdown: string) {
    const files: string[] = []

    // Находим все теги <img src="..."> и markdown ![alt](...)
    const regex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>|!\[[^\]]*\]\(([^)]+)\)/g

    let match: RegExpExecArray | null
    while ((match = regex.exec(markdown)) !== null) {
        const key = match[1] || match[2] // берем src или путь из markdown
        if (key) {
            const fileName = key.split('/').pop() // достаем только имя файла
            if (fileName) files.push(fileName)
        }
    }

    return files
} 