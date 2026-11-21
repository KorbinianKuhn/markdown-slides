// Templates are bundled as text by esbuild (loader '.html': 'text')
declare module '*.html' {
  const content: string;
  export default content;
}
