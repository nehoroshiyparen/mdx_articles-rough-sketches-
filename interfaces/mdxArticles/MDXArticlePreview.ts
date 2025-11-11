import { HeadingBase } from "../../../modules/mdxArticles/interfaces/headings/HeadingBase.js";

export interface MDXArticlePreview {
    id: number,
    title: string,
    slug: string,
    author_username: string,
    event_start_date: Date,
    event_end_date: Date,
    headings?: HeadingBase[]
}