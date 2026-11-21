# Changelog

All notable changes to markdown-slides. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

**Updating your slides?** Read the **Upgrade notes** of every version between yours and the new one. Each note says what changed, how to find affected places in your slides, and what to do. The commands run in the root of a lecture repository.

## [Unreleased]

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

### Added

- `--title` option to set the lecture title used for the link back to the main page on sub-pages, e.g. an abbreviation. Defaults to the first headline of `README.md`.
- Image and video attributes: `![Alt](image.png){width=70% align=left}`. `width` takes a percentage or pixels, `align` takes `left`, `center` or `right`. Invalid attributes stop the build.
- Warning for images and videos without alt text.
- `:spacer{size=sm|md|lg|xl}` as documented in the README.
- The npm package includes the MIT `LICENSE` file and links to the repository, issues and homepage.

### Changed

- The CLI requires Node.js 22 or newer (`engines` field) and is built for it.
- Images keep their aspect ratio when a width is set and the height is limited by the maximum height.
- Invalid spacer sizes stop the build.

### Fixed

- Rows and columns that contain inline code or code blocks failed with `Missing <!-- row:end -->`.
- Unbalanced columns were not reported.
- Columns had no width and no gap (`col` vs. `column` class).
- Markdown directly after `<!-- row -->` or `<!-- col -->` was printed as plain text.
- README: build commands for slide authors (`npx` and Docker) instead of `sh master/build.sh`.

### Removed

- `build-with-docker.sh` and `bin/md2slides.sh` from the repository. Neither was part of the npm package; use the commands in the README.

## [1.0.0-rc.1]

First release candidate.
