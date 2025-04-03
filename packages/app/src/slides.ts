export class Slides {
  private container = document.querySelector('.slides-container')!;
  private slides = this.container.querySelectorAll('section');

  getCurrentSlideIndex() {
    const currentY = this.container.scrollTop;
    for (let i = 0; i < this.slides.length; i++) {
      const slideY = this.slides[i].offsetTop + this.slides[i].clientHeight;
      if (slideY > currentY) {
        return i;
      }
    }

    return 0;
  }

  getPreviousSlideIndex() {
    const index = this.getCurrentSlideIndex();
    return index === 0 ? null : index - 1;
  }

  getNextSlideIndex() {
    const index = this.getCurrentSlideIndex();
    return index < this.slides.length - 1 ? index + 1 : null;
  }

  getSlide(index: number) {
    return this.slides[index];
  }

  getRelativeScrollPosition() {
    return this.container.scrollTop / this.container.scrollHeight;
  }
}
