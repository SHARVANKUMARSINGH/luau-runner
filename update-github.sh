#!/usr/bin/env bash
set -e

# Change directory to the repository folder
cd "$(dirname "$0")"

# Execute the updater Node.js script passing any CLI arguments
exec node update-github.mjs "$@"
