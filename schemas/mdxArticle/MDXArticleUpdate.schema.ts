import z from "zod";
import { HeadingArraySchema } from "../heading/HeadingArray.schema.js";
import { MDXArticleFileUpdateSchema } from "../articleFiles/ArticleFileUpdate.schema.js";

export const MDXArticleUpdateSchema = z.object({
    title: z.string().optional(),
    author_username: z.string().optional(),
    content_markdown: z.string().optional(),
    event_start_date: z.date().optional(),
    event_end_date: z.date().optional(),
    is_published: z.boolean().optional()
}).strict().extend({
    headings: HeadingArraySchema.default([])
}).extend({
    files: MDXArticleFileUpdateSchema.optional()
})

export type TypeofMDXArticleUpdateSchema = z.infer<typeof MDXArticleUpdateSchema>