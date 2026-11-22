import Handlebars from 'handlebars';
import { getTexts, Texts } from './texts';
import code from '../templates/code.html';
import image from '../templates/image.html';
import main from '../templates/main.html';
import menu from '../templates/menu.html';
import slide from '../templates/slide.html';
import table from '../templates/table.html';
import title from '../templates/title.html';
import video from '../templates/video.html';

let texts: Texts = getTexts('en');

/** Sets the language of the texts in the templates, see texts.ts */
export const setLanguage = (language: string) => {
  texts = getTexts(language);
};

/** {{t 'key'}}: a text of the page in its language */
Handlebars.registerHelper('t', (key: keyof Texts) => {
  const text = texts[key];
  if (typeof text !== 'string') {
    throw new Error(`Unknown text "${key}"`);
  }
  return text;
});

/** {{{appTexts}}}: the texts of the slides app, as a script value */
Handlebars.registerHelper('appTexts', () =>
  // < is escaped, so a text can't end the script element
  JSON.stringify(texts.app).replace(/</g, '\\u003c'),
);

const compile = (source: string) => Handlebars.compile(source);

export const template = {
  main: compile(main),
  title: compile(title),
  slide: compile(slide),
  code: compile(code),
  image: compile(image),
  video: compile(video),
  table: compile(table),
  menu: compile(menu),
};
