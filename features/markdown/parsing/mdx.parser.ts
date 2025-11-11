import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { pathToFileURL } from 'node:url';
import { MDXArticleFileInfo } from '#src/types/interfaces/files/MDXArticleFileInfo.interface';
import { fileRender } from '../render/file.render';

export async function MdxParser(markdown: string, files?: MDXArticleFileInfo[]) {
  if (files && files.length > 0) {
    markdown = fileRender(markdown, files)
  }

  const baseUrl = pathToFileURL(process.cwd() + '/').toString()

  const mdxModule = await evaluate(
    { value: markdown },  
    { ...runtime, baseUrl }       
  );

  const MDXContent = mdxModule.default;
  if (!MDXContent) throw new Error('MDX compile/evaluate returned no default export');

  const html = renderToString(
    React.createElement(MDXContent as any, {
      components: {}
    })
  );

  return html;
}