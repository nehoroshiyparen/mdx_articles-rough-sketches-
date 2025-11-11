export const MdxLoader = async () => {
    const { createLoader } = await import('@mdx-js/node-loader')
    return createLoader()
}