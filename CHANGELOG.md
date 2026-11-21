# Changelog

All notable changes to markdown-slides. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

**Updating your slides?** Read the **Upgrade notes** of every version between yours and the new one. Each note says what changed, how to find affected places in your slides, and what to do. The commands run in the root of a lecture repository.

## [Unreleased]

## [1.0.0-rc.2] - 2026-11-21

### Upgrade notes

1. **Unbalanced columns now fail the build.** Before, a missing `<!-- col:end -->` was never reported. Build once and fix the markers on the reported slide.

2. **Columns are now styled.** `<!-- col -->` produced unstyled `<div class="col">` elements, so columns had no width and no gap. They now render as equal-width columns with a gap. Check slides with columns:

   ```bash
   grep -rln --include='*.md' '<!-- col -->' .
   ```

3. **Markdown directly after `<!-- row -->` or `<!-- col -->` is now rendered.** Before, a line right after a marker (without a blank line in between) was printed as plain text, e.g. `![Alt](image.png)`. If you worked around this with raw HTML, you can switch back to Markdown. Find markers followed directly by content:

   ```bash
   grep -rn --include='*.md' -A1 -E '<!-- (row|col) -->' . | grep -vE '<!--|^--$|-$'
   ```

4. **Image size and alignment use an attribute block.** The slides-master syntax with tokens in the alt text (`![left 70% Alt](image.png)`) is not supported, and the tokens end up in the alt text. Use `![Alt](image.png){width=70% align=left}` instead. Find old-style images:

   ```bash
   grep -rnE --include='*.md' '!\[(left|center|right|[0-9]{1,3}%)( |\])' .
   ```

   Convert them automatically, then check the diff. The command can't tell layout tokens from real alt text, so `![50% of users](chart.png)` becomes `![of users](chart.png){width=50%}`. It also rewrites matching text inside inline code:

   ```bash
   perl -pi -e 's{!\[((?:(?:left|center|right|\d{1,3}%)(?:\s+|(?=\])))+)([^\]]*)\]\(([^)\s]*)\)}{my($t,$alt,$url)=($1,$2,$3);my($a)=$t=~/\b(left|center|right)\b/;my($w)=$t=~/(\d{1,3}%)/;my@at;push@at,"width=$w" if $w;push@at,"align=$a" if $a;"![$alt]($url){".join(" ",@at)."}"}ge' *.md
   ```

   Images whose alt text consisted only of tokens (`![70%](image.png)`) end up without alt text. Add a description, see note 6.

5. **Invalid spacer sizes fail the build.** Before, `:spacer[huge]` silently produced an unstyled spacer. Allowed sizes are `sm`, `md`, `lg` and `xl`. The documented syntax `:spacer{size=lg}` now works. The older `:spacer[lg]` keeps working, so no change is needed. Find spacers:

   ```bash
   grep -rn --include='*.md' ':spacer' .
   ```

6. **Images without alt text produce a warning.** The build still succeeds. Each warning names the file, slide and image, e.g. `[warn] README.md slide 4: Image without alt text (images/a.png)`. Add a description for screen readers: `![Class diagram of the player](images/a.png)`.

7. **Node.js 22 or newer is required.** The CLI is now built for Node.js 22, and older versions are not supported. Check the Node.js version where you build your slides, e.g. the image in your CI configuration (`node:alpine` is fine):

   ```bash
   node -v
   grep -rn 'image:' .gitlab-ci.yml .github/workflows 2>/dev/null
   ```

8. **New Markdown parser version.** marked was updated from version 9 to 18, which follows the CommonMark specification more closely. Slides rendered the same in all tests, but check unusual Markdown (nested lists with mixed indentation, raw HTML mixed with Markdown, emphasis inside words) after updating. Find raw HTML blocks, the most likely place for differences:

   ```bash
   grep -rn --include='*.md' -E '^\s*<(div|span|p|table|br|img)' .
   ```

9. **`<!-- slide -->` only starts a slide on a line of its own.** Slides are now split by the Markdown parser, so a marker inside a list, a blockquote, after text or in a `~~~` code block no longer starts a new slide. A marker that is ignored this way produces a warning, e.g. `[warn] README.md slide 3: <!-- slide --> is ignored, because it is not on a line of its own`. Move the marker to its own line, without indentation, and with blank lines around it. Find candidates (matches inside inline code, like `` `<!-- slide -->` ``, are fine):

   ```sh
   grep -rnE --include='*.md' '^.*[^ \t].*<!-- slide -->|^[ \t]+<!-- slide -->' .
   ```

10. **Formulas use a new font.** MathJax was updated from 3 to 4, which renders with the New Computer Modern font instead of Latin Modern. Formulas look almost the same, but spacing can shift slightly, so check slides where formulas fill the width. If you set `window.MathJax` in a custom `.js` file next to your slides, keep `loader.paths.fonts` as in `main.html`, or formulas may try to load the font from the internet. Find formulas:

    ```sh
    grep -rnE --include='*.md' '\$\$|\\\\\(|\\\\\[' .
    ```

11. **`--toc-numbering false` now works, and unsafe output directories are refused.** Before, any value turned numbering on, so `--toc-numbering false` had no effect. Now it removes the numbers from headlines and the table of contents, and values other than `true` and `false` stop the build. The output directory must now be inside the current directory but not the directory itself, and it must not be or contain the input directory, because it is deleted before each build. Find build commands that use these options:

    ```sh
    grep -rnE --include='*.yml' --include='*.yaml' --include='*.sh' --include='*.json' --include='Makefile' -e '--toc-numbering|(-o|--out)[ =]\.(/)?( |$)' .
    ```

12. **Colors meet the WCAG AA contrast ratio.** The grey text (page numbers, footer) is darker in light mode, and the syntax highlighting uses GitHub's current light colors. In dark mode, text in the primary color (links, headlines) is lightened automatically when it is too dark for the dark background; this also applies to a custom `--color-primary`. If your `style.css` sets other colors, check them in dark mode, or check the whole deck with an accessibility checker such as [axe DevTools](https://www.deque.com/axe/devtools/). Find custom color settings:

    ```sh
    grep -rnE --include='*.css' --exclude-dir=public --exclude-dir=node_modules -e '--color-[a-z-]+:' .
    ```

### Added

- Automated accessibility tests (axe-core, WCAG 2.2 A and AA rules) for all test decks in light, dark and mobile mode, and for the menu.
- `--title` option to set the lecture title used for the link back to the main page on sub-pages, e.g. an abbreviation. Defaults to the first headline of `README.md`.
- Image and video attributes: `![Alt](image.png){width=70% align=left}`. `width` takes a percentage or pixels, `align` takes `left`, `center` or `right`. Invalid attributes stop the build.
- Warning for images and videos without alt text.
- `:spacer{size=sm|md|lg|xl}` as documented in the README.
- Live demo of the README deck and the custom theme example: https://korbiniankuhn.github.io/markdown-slides/
- The npm package includes the MIT `LICENSE` file and links to the repository, issues and homepage.

### Changed

- Printing: the spacing between elements on a slide is slightly tighter (margins collapse as in documents).
- Updated argparse from 2 to 3. The CLI options are unchanged; `--help` is colored in supported terminals.
- Updated MathJax from 3 to 4 (new font, see upgrade note 10). The font is included in the slides, so formulas also render offline.
- Updated Mermaid from 11 to 12. Diagrams keep the previous layout and style (Mermaid 12 changed the defaults). Viewing slides with diagrams needs a browser from 2024 or newer (e.g. Safari 17.4, Chrome 117, Firefox 119), and `mermaid.min.js` grows from 3.6 to 5.5 MB.
- Slides, spacers, `@module`/`@semester` and comments are handled by marked extensions instead of a custom lexer and regular expressions. See upgrade note 9.
- Updated the Markdown parser (marked 9 → 18). The tests show no visible changes, but rare edge cases may render differently, see upgrade note 8.
- The CLI requires Node.js 22 or newer (`engines` field) and is built for it.
- Images keep their aspect ratio when a width is set and the height is limited by the maximum height.
- Invalid spacer sizes stop the build.

### Fixed

- Contrast below the WCAG AA minimum: grey text (3.5:1), syntax highlighting in light mode (down to 3.3:1), and links and headlines in the primary color in dark mode (red 3.95:1, custom colors like blue 2.2:1). See upgrade note 12.
- Code blocks with long lines could only be scrolled with a mouse. Code blocks that overflow can now be focused with Tab and scrolled with the arrow keys.
- The names of the menu button and the theme buttons didn't contain their visible text, so voice control (e.g. "click Auto") didn't work. The selected theme is announced to screen readers.
- Images were wrapped in two paragraphs (`<p><p><img></p></p>`), which browsers split into an image and two empty paragraphs. The spacing around images is now even and slightly tighter. Images in a line of text stay in that line.
- Videos were inside a paragraph, which is invalid HTML, and had an `alt` attribute, which videos don't support. The description is now an `aria-label`.
- The menu button had an `alt` attribute instead of an `aria-label`, so screen readers announced it without a name.
- Links repeated their text as `title`, including HTML like `<code>`. They now only have a title when set in Markdown: `[text](url "title")`.
- Rows and columns were squeezed side by side on phones; they are now stacked below 576px.
- `--toc-numbering false` had no effect, see upgrade note 11.
- The check that input and output are inside the current directory only compared the start of the path, so e.g. `../slides-old` was accepted inside `slides`. `-o .` deleted the current directory, and an output directory that contains the input deleted the slides. Both are now refused.
- The lecture title was not detected when written as `Title` underlined with `===`, a `# …` line inside a code block was taken as the title, and Markdown in the title (e.g. `` `git` ``) was shown as is.
- `--help` and `--version` printed `# Start` first.
- Keyboard: the closed menu was still in the Tab order, so the first Tab presses went through its invisible links.
- Keyboard: the code copy button was invisible when focused with Tab.
- Keyboard: Space on a focused button or link went to the next slide instead of activating it. Keys on an open menu or a focused formula no longer change the slide.
- Focused elements have a visible outline in the primary color, also in dark mode.
- Screen readers announce "Copied to clipboard".
- Entering or leaving fullscreen (and resizing the window) could move the view to another slide in Firefox. The slides now keep the current position, also after scrolling in fullscreen.
- Printing: long code lines were cut off at the right edge; they now wrap. Slides no longer leave blank pages after the title slide and after slides that fill a page.
- The build hung forever on a lone backtick (e.g. "Use ` for inline code") or a code block fenced with four backticks.
- `<!-- slide -->` inside a `~~~` code block started a new slide.
- Row and column markers inside code were counted when checking that rows and columns are closed.
- Rows and columns that contain inline code or code blocks failed with `Missing <!-- row:end -->`.
- Unbalanced columns were not reported.
- Columns had no width and no gap (`col` vs. `column` class).
- Markdown directly after `<!-- row -->` or `<!-- col -->` was printed as plain text.
- Alt texts with `&`, `<` or `>` were escaped twice, so screen readers read e.g. "Tom &amp; Jerry".
- Building markdown-slides itself from a directory inside the system temp directory (e.g. a clone in `/tmp` in GitLab CI) failed with `Could not resolve ../../../node_modules/@fontsource-variable/...`. The SCSS is now compiled directly with Sass instead of the abandoned `esbuild-plugin-sass`.
- README: build commands for slide authors (`npx` and Docker) instead of `sh master/build.sh`.

### Security

- Updated the libraries bundled into the slides: Mermaid 12.3 and DOMPurify 3.4 (cross-site scripting fixes in diagrams), handlebars 4.7.10 (critical code injection fix) and highlight.js 11.12.
- Mermaid 12 bundles KaTeX 0.16.47, which fixes the last two known vulnerabilities (`npm audit` reports none).

### Removed

- `build-with-docker.sh` and `bin/md2slides.sh` from the repository. Neither was part of the npm package; use the commands in the README.

## [1.0.0-rc.1]

First release candidate.
