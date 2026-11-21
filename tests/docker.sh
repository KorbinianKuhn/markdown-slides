#!/bin/sh
# Run the full test suite in the Playwright Docker image, which is the same
# environment as CI. Extra arguments are passed on, e.g.:
#   npm run test:docker -- --update-snapshots
set -e
IMAGE=mcr.microsoft.com/playwright:v1.65.1-noble

docker run --rm --ipc=host \
  -v "$(pwd)":/work \
  -v /work/node_modules \
  -w /work \
  -e CI \
  "$IMAGE" \
  sh -c 'npm ci --silent && npx playwright test "$@"' -- "$@"
