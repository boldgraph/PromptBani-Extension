/// <reference types="vite/client" />

// Vite's `?raw` import suffix loads a file's exact contents as a plain
// string at build time. Used to load promptbani-system-source.txt
// verbatim, with zero risk of the text being altered by escaping rules
// that would apply if it were embedded in a .ts template literal.
declare module "*.txt?raw" {
  const content: string;
  export default content;
}
