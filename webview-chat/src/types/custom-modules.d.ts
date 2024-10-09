// src/types/custom-modules.d.ts

declare module 'prismjs' {
    const Prism: any;
    export default Prism;
  }
  
  declare module 'remarkable' {
    export class Remarkable {
      constructor(options?: any);
      render(markdown: string): string;
    }
  }
  