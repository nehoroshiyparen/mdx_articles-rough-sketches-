import { NextLoad } from "node_modules/@mdx-js/node-loader/lib/index.js";

export const nextLoad: NextLoad = async (url, context) => {
    throw new Error(`Cannot load ${url}`);
};