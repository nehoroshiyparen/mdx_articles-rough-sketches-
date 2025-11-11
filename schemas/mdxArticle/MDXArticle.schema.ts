import z from "zod";

export const MDXArticleSchema = z.object({
    title: z.string(),
    author_username: z.string().optional(),
    content_markdown: z.string(),
    event_start_date: z.date().optional(),
    event_end_date: z.date().optional(),
    is_published: z.boolean().optional()
}).strict()

export type TypeofMDXArticleSchema = z.infer<typeof MDXArticleSchema>