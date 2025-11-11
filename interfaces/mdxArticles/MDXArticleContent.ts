import { HeadingBase } from "../../../modules/mdxArticles/interfaces/headings/HeadingBase.js"

export interface MDXArticleContent {
    content_html: string
    headings?: HeadingBase[]
}