import { Mermaid } from './mermaid';
export class Theme {
  private buttonAuto = document.querySelector('#button-theme-auto')!;
  private buttonLight = document.querySelector('#button-theme-light')!;
  private buttonDark = document.querySelector('#button-theme-dark')!;
  private mermaid = new Mermaid();

  constructor() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'theme') {
        this.updateThemeClass();
      }
    });

    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', () => this.updateThemeClass());

    this.updateThemeClass();
  }

  updateSetting(value: string) {
    localStorage.setItem('theme', value);
    this.updateThemeClass();
  }

  updateThemeClass() {
    const setting = localStorage.getItem('theme') || 'system';

    const active =
      setting === 'light'
        ? this.buttonLight
        : setting === 'dark'
          ? this.buttonDark
          : this.buttonAuto;
    for (const button of [this.buttonAuto, this.buttonLight, this.buttonDark]) {
      // Shown with the class, announced by screen readers with aria-pressed
      button.classList.toggle('active', button === active);
      button.setAttribute('aria-pressed', String(button === active));
    }

    const isDark =
      setting === 'dark' ||
      (setting === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    this.mermaid.update(isDark);
  }
}
