interface SlideToken {
  type: 'slide';
  children: Token[];
}

type TokenType = 'text' | 'code' | 'codespan';
interface Token {
  type?: TokenType;
  text: string;
}

export class Lexer {
  private content!: string;
  private index = 0;

  constructor() {}

  peek(length: number = 1) {
    return this.content.length < length
      ? null
      : this.content.slice(this.index, this.index + length);
  }

  consume(length: number = 1) {
    const part = this.content.slice(this.index, this.index + length);
    this.index += length;
    return part;
  }

  peekEquals(search: string): boolean {
    return this.peek(search.length) === search;
  }

  isEOF(): boolean {
    return this.index === this.content.length;
  }

  read(input: string): SlideToken[] {
    this.content = input;

    const slides: SlideToken[] = [];

    let slide: SlideToken = { type: 'slide', children: [] };
    let token: Token = { text: '' };

    const startNewToken = () => {
      slide.children!.push(token);
      token = { text: '' };
    };

    const startNewSlide = () => {
      startNewToken();
      slides.push(slide);
      slide = { type: 'slide', children: [] };
    };

    while (!this.isEOF()) {
      switch (token.type) {
        case 'code': {
          while (!this.isEOF() && !this.peekEquals('`')) {
            token.text += this.consume();
          }
          token.text += this.consume();
          startNewToken();
          break;
        }
        case 'codespan': {
          while (!this.isEOF() && !this.peekEquals('```')) {
            token.text += this.consume();
          }
          token.text += this.consume(3);
          startNewToken();
          break;
        }
        default: {
          if (this.peekEquals('<!-- slide -->')) {
            this.consume('<!-- slide -->'.length);
            startNewSlide();
            continue;
          }
          if (this.peekEquals('```')) {
            startNewToken();
            token.type = 'codespan';
            token.text = this.consume(3);
            continue;
          }
          if (this.peekEquals('`')) {
            startNewToken();
            token.type = 'code';
            token.text = this.consume();
            continue;
          }

          token.type === 'text';
          token.text += this.consume();
        }
      }
    }

    startNewSlide();

    return slides;
  }
}
