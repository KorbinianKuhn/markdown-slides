# markdown-slides

CLI that turns Markdown files into HTML slides. See [CONTRIBUTING.md](CONTRIBUTING.md) for build and test commands.

- Update [CHANGELOG.md](CHANGELOG.md) with every user-visible change. Add an upgrade note with a tested search command when existing slides could be affected (see CONTRIBUTING.md).
- Run `npm run format`, `npm run lint`, `npm run typecheck` and `npm run test:docker` before opening a pull request. When a rendering change is intended, update the snapshots with `npm run test:docker -- --update-snapshots`, look at the changed images, and commit them with the change.
- The README is also a slide deck and is part of the tests. Links in it to other `.md` files are turned into `.html` links, so link to repository files with their full GitHub URL.
