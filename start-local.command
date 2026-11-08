#!/bin/zsh
set -eu
cd -- "$(dirname -- "$0")"

if command -v node >/dev/null 2>&1; then
  arena_node="$(command -v node)"
else
  arena_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$arena_node" ]]; then
  print 'Install Node.js 22.13 or later, then run npm ci and npm run dev.'
  exit 1
fi
if [[ ! -f node_modules/vinext/dist/cli.js ]]; then
  print 'Install project dependencies first with npm ci. See README.md.'
  exit 1
fi
export PATH="$(dirname -- "$arena_node"):$PWD/node_modules/.bin:$PATH"
exec "$arena_node" scripts/run-framework.mjs dev "$@"
