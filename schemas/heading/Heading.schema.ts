import z from "zod";

export const HeadingSchema = z.object({
    title: z.string()
})
export type TypeofHeadingSchema = z.infer<typeof HeadingSchema>