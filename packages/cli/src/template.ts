import { compile } from 'handlebars';
import code from '../templates/code.html';
import image from '../templates/image.html';
import main from '../templates/main.html';
import menu from '../templates/menu.html';
import slide from '../templates/slide.html';
import table from '../templates/table.html';
import title from '../templates/title.html';
import video from '../templates/video.html';

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
