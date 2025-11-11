import z from "zod";

export const MDXArticleFileUpdateSchema = z.object({
    delete: z.array(z.number()).optional().nullable(),
}).strict()
export type TypeofMDXArticleFileUpdateSchema = z.infer<typeof MDXArticleFileUpdateSchema>