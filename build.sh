#!/bin/bash

# Build the cli and slides app
node build.js

# Build the example slides
node dist/cli.js -i examples/docs -o examples/docs/public -l en
node dist/cli.js -i examples/custom-theme -o examples/custom-theme/public -l en --institution "Custom Institution"
node dist/cli.js -i examples/mwa -o examples/mwa/public -l en