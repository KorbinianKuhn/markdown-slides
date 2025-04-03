export class Theme {
  private buttonAuto = document.querySelector('#button-theme-auto')!;
  private buttonLight = document.querySelector('#button-theme-light')!;
  private buttonDark = document.querySelector('#button-theme-dark')!;

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

    this.buttonAuto.classList.remove('active');
    this.buttonLight.classList.remove('active');
    this.buttonDark.classList.remove('active');

    switch (setting) {
      case 'light':
        this.buttonLight.classList.add('active');
        break;
      case 'dark':
        this.buttonDark.classList.add('active');
        break;
      case 'system':
      default:
        this.buttonAuto.classList.add('active');
        break;
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
  }
}
