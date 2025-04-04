import { Clipboard } from './clipboard';
import { Interaction } from './interaction';
import { Slides } from './slides';
import { Theme } from './theme';

export class App {
  public type = 'slides';

  private slides = new Slides();
  private theme = new Theme();
  private clipboard = new Clipboard();
  private interaction = new Interaction(this, this.slides);
  private menu = document.querySelector('#menu') as HTMLDialogElement;

  constructor() {
    this.menu.addEventListener('click', (event) => {
      if (event.target === this.menu) {
        this.closeMenu();
      }
    });
  }

  print() {
    window.print();
  }

  copyToClipboard(id: string) {
    this.clipboard.copy(id);
  }

  setTheme(value: string) {
    this.theme.updateSetting(value);
  }

  openMenu() {
    if (!this.menu.open) {
      this.menu.showModal();
    }
  }

  closeMenu() {
    if (this.menu.open) {
      this.menu.close();
    }
  }

  fullscreen() {
    this.closeMenu();
    document.body.requestFullscreen();
  }

  previousSlide() {
    this.interaction.previousSlide();
  }

  nextSlide() {
    this.interaction.nextSlide();
  }

  goToSlide(index: number) {
    this.interaction.goToSlide(index);
  }

  scroll(position: number) {
    this.interaction.scrollTo(position);
  }

  onClickImage(image: any) {
    console.log(image);
  }
}
