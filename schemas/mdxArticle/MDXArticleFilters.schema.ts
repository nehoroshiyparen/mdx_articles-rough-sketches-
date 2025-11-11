import z from "zod";

export const MDXArticleFiltersSchema = z.object({
    title: z.string().optional(),
    author_username: z.string().optional(),
    event_start_date: z.date().optional(),
    event_end_date: z.date().optional(),
}).strict()
export type TypeofMDXArticleFiltersSchema = z.infer<typeof MDXArticleFiltersSchema>