# Contributing

## Build

```bash
npm ci
node build.js
```

## Tests

The tests make sure changes don't alter the generated slides by accident. They build the decks listed in [tests/decks.ts](tests/decks.ts) and compare the result to committed snapshots:

- **HTML snapshots** (`tests/html.spec.ts`) compare the generated HTML files. They run on any OS.
- **Screenshots** (`tests/visual.spec.ts`) compare every slide in four modes: light, dark, mobile and print. Font rendering differs between operating systems, so they only run on Linux, in the same Docker image as CI.

The fixture deck in [tests/fixtures/features](tests/fixtures/features) has one slide per feature. Add a slide there when you add a feature.

| Command                                     | Description                                               |
| ------------------------------------------- | --------------------------------------------------------- |
| `npm test`                                  | Run all tests locally (screenshots skipped outside Linux) |
| `npm run test:docker`                       | Run all tests in Docker, like CI (requires Docker)        |
| `npm run test:docker -- --update-snapshots` | Accept intended changes and update the snapshots          |
| `npx playwright show-report`                | Open the report with side-by-side image diffs             |

When a change is intended, update the snapshots and commit them together with the change, so the diff in the pull request shows what changed.

CI runs the tests on every pull request ([.github/workflows/test.yml](.github/workflows/test.yml)). If they fail, the report is attached to the workflow run as the `playwright-report` artifact.

## Changelog

Every change that users notice goes into the `[Unreleased]` section of [CHANGELOG.md](CHANGELOG.md): under Added, Changed, Fixed or Removed.

If a change can affect existing slides (different rendering, new build errors or warnings, changed syntax), also add an **Upgrade note**. Say what changed, give a command that finds the affected places in a lecture repository, and say what to do. Colleagues and their AI assistants use these notes to update their slides, so test the commands.

On release, rename `[Unreleased]` to the version and start a new empty `[Unreleased]` section.
