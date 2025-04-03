import { compile } from 'handlebars';

export const template = {
  main: compile(require('./../templates/main.html')),
  title: compile(require('./../templates/title.html')),
  slide: compile(require('./../templates/slide.html')),
  code: compile(require('./../templates/code.html')),
  image: compile(require('./../templates/image.html')),
  video: compile(require('./../templates/video.html')),
  table: compile(require('./../templates/table.html')),
  menu: compile(require('./../templates/menu.html')),
};
