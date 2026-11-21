/**
 * Code blocks scroll horizontally when their lines are too long. Keyboard
 * users can only scroll them when they can focus them, so blocks that
 * overflow get a tab stop (WCAG 2.1.1). Others don't, to keep Tab short.
 */
export class Code {
  private blocks = document.querySelectorAll<HTMLElement>('pre code');

  constructor() {
    const observer = new ResizeObserver(() => this.update());
    this.blocks.forEach((block) => observer.observe(block));
  }

  private update() {
    this.blocks.forEach((block) => {
      if (block.scrollWidth > block.clientWidth) {
        block.tabIndex = 0;
        block.setAttribute('role', 'region');
        block.setAttribute('aria-label', 'Code example, scrollable');
      } else {
        block.removeAttribute('tabindex');
        block.removeAttribute('role');
        block.removeAttribute('aria-label');
      }
    });
  }
}
