#!/usr/bin/env bash

set -e # immediately exit upon error
cd "`dirname $0`/.." # start in project root

npm run clean
npm run build
npm run test:ci
# npm run lint # for v5!!!

./scripts/packages-contrib-ci.js
./scripts/example-projects-build.js
