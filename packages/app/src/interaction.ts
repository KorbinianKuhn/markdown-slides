import { App } from './app';
import { Slides } from './slides';

export interface ScreenDimensions {
  width: number;
  height: number;
}
export class Interaction {
  private container = document.querySelector('.slides-container')!;

  constructor(private app: App, private slides: Slides) {
    document.body.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'ArrowRight':
        case 'PageDown':
        case 'Space':
          event.preventDefault();
          this.nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          this.previousSlide();
          break;
      }
    });
  }

  goToSlide(index: number) {
    const slide = this.slides.getSlide(index);
    this.container.scrollTo(0, slide.offsetTop);
  }

  previousSlide() {
    const index = this.slides.getPreviousSlideIndex();
    if (index !== null) {
      this.goToSlide(index);
    }
  }

  nextSlide() {
    const index = this.slides.getNextSlideIndex();
    if (index !== null) {
      this.goToSlide(index);
    }
  }

  scrollTo(position: number) {
    this.container.scrollTo({
      top: this.container.scrollHeight * position,
      behavior: 'instant',
    });
  }

  getScreenDimensions(): ScreenDimensions {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
}
