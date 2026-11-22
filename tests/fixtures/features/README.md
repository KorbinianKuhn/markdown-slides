# Feature Fixture

@module[123456]
@semester[Summer 2026]

Jane Doe [jane@](mailto:jane@example.com)

<!-- slide -->

## Text

Plain text with **bold**, _italic_, `inline code`, an [external link](https://example.com) and a [link to a sub-page](chapter.md).

> A blockquote with some text.

<!-- slide -->

## Lists

- First level
  - Second level
    - Third level
- Back to the first level

1. Ordered one
2. Ordered two

<!-- slide -->

## Headings

### Third level heading

#### Fourth level heading

Text below the headings.

<!-- slide -->

## Code

```typescript
interface Slide {
  title: string;
  index: number;
}

const next = (slide: Slide): number => slide.index + 1;
```

<!-- slide -->

## Table

| Name    | Type   | Description          |
| ------- | ------ | -------------------- |
| `title` | string | Title of the slide   |
| `index` | number | Position in the deck |

<!-- slide -->

## Rows and columns

<!-- row -->
<!-- col -->

Left column with some text that is long enough to wrap onto a second line.

<!-- col:end -->
<!-- col -->

Right column with a list:

- One
- Two

<!-- col:end -->
<!-- row:end -->

<!-- slide -->

## Columns with inline code and an image

<!-- row -->
<!-- col -->
![A wide image](images/wide.svg)
<!-- col:end -->
<!-- col -->

Uses `UObject` and **bold** text.

<!-- col:end -->
<!-- row:end -->

<!-- slide -->

## Wide image

![A wide image](images/wide.svg)

<!-- slide -->

## Tall image

![A tall image](images/tall.svg)

<!-- slide -->

## Mermaid

```mermaid
flowchart LR
  A[Markdown] --> B[CLI]
  B --> C[HTML slides]
```

<!-- slide -->

## MathJax

$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

Sorting \\(f: \mathbb{N} \to \mathbb{N}\\) takes \\(\mathcal{O}(n \log n)\\).

<!-- slide -->

## Spacer

Text above the spacer.

:spacer{size=lg}

Text below the spacer.

<!-- slide -->

## Alerts

> [!NOTE]
> Useful information, even when **skimming**.

> [!TIP]
> Helpful advice.

> [!IMPORTANT]
> Key information.

> [!WARNING]
> Needs attention.

> [!CAUTION]
> Negative consequences.

<!-- slide -->

## Footnotes

Markdown[^md] is converted to slides[^slides]. The same footnote again[^md].

An undefined footnote stays as text[^missing].

[^md]: A lightweight markup language, see [CommonMark](https://commonmark.org).

[^slides]: Footnotes are shown at the bottom of their slide.

    A second paragraph, indented by four spaces[^nested].

[^nested]: A footnote in a footnote.

<!-- slide -->

## Footnotes on the next slide

Numbering starts again[^slides].
