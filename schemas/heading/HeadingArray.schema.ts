import z from "zod";
import { HeadingSchema } from "./Heading.schema.js";

export const HeadingArraySchema = z.array(
    HeadingSchema
)
export type TypeofHeadingArraySchema = z.infer<typeof HeadingArraySchema>