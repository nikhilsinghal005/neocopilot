// src/types/custom-modules.d.ts

declare module 'prismjs' {
    const Prism: unknown;
    export default Prism;
  }
  
  declare module 'remarkable' {
    export class Remarkable {
      constructor(options?: unknown);
      render(markdown: string): string;
    }
  }
  