export class Mermaid {
  private elements: Array<{ node: Element; code: string }> = [];

  constructor() {
    document.querySelectorAll('.mermaid').forEach((node) => {
      const code = node.textContent!;
      this.elements.push({ node, code });
    });
  }

  getCSSVariableColor(name: string): string {
    return window.getComputedStyle(document.body).getPropertyValue(name);
  }

  async update(darkMode: boolean) {
    // @ts-ignore
    const mermaid = window.mermaid;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      darkMode,
      themeVariables: {
        background: this.getCSSVariableColor('--color-bg'),
        primaryColor: this.getCSSVariableColor('--color-border'),
        primaryTextColor: this.getCSSVariableColor('--color-text'),
        primaryBorderColor: this.getCSSVariableColor('--color-grey'),
      },
    });

    for (const element of this.elements) {
      if (element.node.hasAttribute('data-processed')) {
        element.node.removeAttribute('data-processed');
        element.node.innerHTML = element.code;
      }
    }

    mermaid.run();
  }
}
