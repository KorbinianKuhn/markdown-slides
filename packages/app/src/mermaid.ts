// Loaded by a separate script tag (app/scripts/mermaid.min.js)
declare global {
  interface Window {
    mermaid?: {
      initialize: (config: Record<string, unknown>) => void;
      run: () => Promise<void>;
    };
  }
}

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
    // Pages without diagrams don't load Mermaid
    const mermaid = window.mermaid;
    if (this.elements.length === 0 || !mermaid) {
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      // Mermaid 12 defaults to a new layout and look (shadows, uniform node
      // widths, labels wrapped early). Keep the compact mermaid 11 style,
      // which fits the slides better.
      layout: 'dagre',
      look: 'classic',
      flowchart: { minNodeWidth: 0, wrappingWidth: 200 },
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
