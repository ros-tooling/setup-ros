#!/usr/bin/env bash
set -euxo pipefail

npm ci
npm run build
npm test
