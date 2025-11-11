import sanitizeHtml from "sanitize-html"

function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "b", "i", "em", "strong", "a",
      "ul", "ol", "li", "blockquote", "code", "pre",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "img"
    ],
    allowedAttributes: {
      a: ["href", "name", "target"],
      img: ["#src", "alt", "title"],
    },
  })
}