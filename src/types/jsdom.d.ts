// jsdom paketi öz tiplərini gətirmir; testlərdə istifadə olunan hissə üçün minimal bəyannamə.
declare module 'jsdom' {
  export interface JSDOMOptions {
    runScripts?: 'dangerously' | 'outside-only';
    pretendToBeVisual?: boolean;
  }

  export class JSDOM {
    constructor(html?: string, options?: JSDOMOptions);
    readonly window: Window & typeof globalThis;
  }
}
