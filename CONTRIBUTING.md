# Contributing

## Setup

Use the Node.js version from [.nvmrc](.nvmrc) (e.g. `nvm use`), then:

```bash
npm ci
```

| Command             | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `npm run build`     | Build the CLI and the slides app into `dist`              |
| `npm run slides`    | Build the README deck into `public` with `dist/cli.js`    |
| `npm run lint`      | Lint with ESLint                                          |
| `npm run format`    | Format with Prettier (`npm run format:check` only checks) |
| `npm run typecheck` | Type-check the CLI, the app and the tests                 |

Templates in `packages/cli/templates` and the test fixtures are not formatted, because whitespace there changes the generated slides.

## Tests

The tests make sure changes don't alter the generated slides by accident. They build the decks listed in [tests/decks.ts](tests/decks.ts) and compare the result to committed snapshots:

- **HTML snapshots** (`tests/html.spec.ts`) compare the generated HTML files. They run on any OS.
- **Screenshots** (`tests/visual.spec.ts`) compare every slide in four modes: light, dark, mobile and print. Font rendering differs between operating systems, so they only run on Linux, in the same Docker image as CI.
- **Accessibility** (`tests/a11y.spec.ts`) checks every page and the menu with axe-core against the WCAG 2.2 A and AA rules, in light, dark and mobile mode. Automated checks find about a third of the issues; meaningful alt texts, headings and reading order still need a human.
- **CLI tests** (`tests/cli.spec.ts`) check build errors and warnings for invalid input.
- **App tests** (`tests/app.spec.ts`) check the behavior of the slides in Chromium, WebKit (Safari) and Firefox, e.g. that the position is kept when entering and leaving fullscreen. Outside Docker, they need the browsers: `npx playwright install`.

The fixture deck in [tests/fixtures/features](tests/fixtures/features) has one slide per feature. Add a slide there when you add a feature.

| Command                                     | Description                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| `npm test`                                  | Run all tests locally (screenshots skipped outside Linux) |
| `npm run test:docker`                       | Run all tests in Docker, like CI (requires Docker)        |
| `npm run test:docker -- --update-snapshots` | Accept intended changes and update the snapshots          |
| `npx playwright show-report`                | Open the report with side-by-side image diffs             |

When a change is intended, update the snapshots and commit them together with the change, so the diff in the pull request shows what changed.

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs formatting, linting, type checks and all tests on every pull request. If the tests fail, the report is attached to the workflow run as the `playwright-report` artifact.

## Changelog

Every change that users notice goes into the `[Unreleased]` section of [CHANGELOG.md](CHANGELOG.md): under Added, Changed, Fixed or Removed.

If a change can affect existing slides (different rendering, new build errors or warnings, changed syntax), also add an **Upgrade note**. Say what changed, give a command that finds the affected places in a lecture repository, and say what to do. Colleagues and their AI assistants use these notes to update their slides, so test the commands.

## Release

Releases are published to npm by [.github/workflows/publish.yml](.github/workflows/publish.yml) with npm trusted publishing, so no npm token is needed.

The trusted publisher on npmjs.com points to this repository and the file name `publish.yml`. Renaming the workflow breaks publishing until the setting on npmjs.com is updated too.

1. In a pull request, set the new `version` in `package.json` (run `npm install` to update the lockfile), and rename `[Unreleased]` in the changelog to the version and date.
2. After merging, create a GitHub release with the tag `v<version>` (e.g. `v1.0.0`) and the changelog section as notes. Mark release candidates (e.g. `v1.0.0-rc.2`) as **pre-release**.
3. The workflow runs all checks, verifies that the tag matches `package.json`, and publishes. Pre-releases get the npm tag `next`, releases `latest`.

## Dependencies

Dependabot opens weekly PRs: minor and patch updates grouped, major updates one by one. The tests show whether an update changes the slides.

Playwright is updated by hand, because the version must match the Docker image: change `@playwright/test` in `package.json` and the image tag in `.github/workflows/ci.yml` and `tests/docker.sh` together, then regenerate the screenshots with `npm run test:docker -- --update-snapshots` and review them.

## Live demo

On every push to `main`, [.github/workflows/pages.yml](.github/workflows/pages.yml) publishes the README deck to https://korbiniankuhn.github.io/markdown-slides/.
