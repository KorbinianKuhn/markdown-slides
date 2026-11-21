import { App } from './app';
import { Slides } from './slides';

export interface ScreenDimensions {
  width: number;
  height: number;
}
export class Interaction {
  private container = document.querySelector('.slides-container')!;

  // The slide at the top of the view, how far it is scrolled (as a fraction of
  // its height) and the container size it was measured at. Firefox loses the
  // position when the layout changes, e.g. when entering or leaving
  // fullscreen, so it is restored after every resize.
  private anchor = { index: 0, fraction: 0, width: 0, height: 0 };

  constructor(
    private app: App,
    private slides: Slides,
  ) {
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

    this.container.addEventListener('scroll', () => this.saveAnchor(), {
      passive: true,
    });
    new ResizeObserver(() => this.restoreAnchor()).observe(this.container);
  }

  private saveAnchor() {
    const { clientWidth, clientHeight, scrollTop } = this.container;
    if (
      clientWidth !== this.anchor.width ||
      clientHeight !== this.anchor.height
    ) {
      // The layout is changing, keep the anchor until it is restored
      return;
    }
    const index = this.slides.getCurrentSlideIndex();
    const slide = this.slides.getSlide(index);
    this.anchor.index = index;
    this.anchor.fraction = (scrollTop - slide.offsetTop) / slide.offsetHeight;
  }

  private restoreAnchor() {
    const isFirstLayout = this.anchor.width === 0;
    this.anchor.width = this.container.clientWidth;
    this.anchor.height = this.container.clientHeight;
    if (isFirstLayout) {
      // Keep the initial position, e.g. from a link to a slide
      this.saveAnchor();
      return;
    }
    const slide = this.slides.getSlide(this.anchor.index);
    this.container.scrollTo({
      top: slide.offsetTop + this.anchor.fraction * slide.offsetHeight,
      behavior: 'instant',
    });
  }

  goToSlide(index: number) {
    const slide = this.slides.getSlide(index);
    this.container.scrollTo(0, slide.offsetTop);
    // Also while the layout changes, e.g. right after entering fullscreen
    this.anchor.index = index;
    this.anchor.fraction = 0;
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
