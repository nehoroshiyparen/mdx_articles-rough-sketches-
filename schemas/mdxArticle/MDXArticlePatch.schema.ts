import z from "zod";
import { MDXArticleSchema } from "./MDXArticle.schema.js";
import { HeadingArraySchema } from "../heading/HeadingArray.schema.js";

export const MDXArticleCreateSchema = MDXArticleSchema.extend({
    headings: HeadingArraySchema.optional()
}).strict()
export type TypeofAdvancedMDXArticleSchema = z.infer<typeof MDXArticleCreateSchema>