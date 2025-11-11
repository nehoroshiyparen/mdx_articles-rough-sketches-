export function headingParser(markdown: string) {
    const headingRegex = /^#{1,6}\s+(.+)/gm
    const matches = markdown.match(headingRegex)

    return matches
        ? matches.map((heading) => heading.replace(/^#+\s+/, "").trim())
        : []
}