import { App } from './app';

declare global {
  interface Window {
    app: App;
    onClickOpenMenu: () => void;
    onClickCloseMenu: () => void;
    onClickSetTheme: (theme: string) => void;
    onClickNextSlide: () => void;
    onClickPreviousSlide: () => void;
    onClickFullscreen: () => void;
    onClickCopyToClipboard: (id: string) => void;
    onClickPrint: () => void;
    onClickImage: (image: any) => void;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.onClickOpenMenu = () => window.app.openMenu();
  window.onClickCloseMenu = () => window.app.closeMenu();
  window.onClickSetTheme = (theme: string) => window.app.setTheme(theme);
  window.onClickNextSlide = () => window.app.nextSlide();
  window.onClickPreviousSlide = () => window.app.previousSlide();
  window.onClickFullscreen = () => window.app.fullscreen();
  window.onClickCopyToClipboard = (id: string) =>
    window.app.copyToClipboard(id);
  window.onClickPrint = () => window.app.print();
  window.onClickImage = (image: any) => window.app.onClickImage(image);
});
