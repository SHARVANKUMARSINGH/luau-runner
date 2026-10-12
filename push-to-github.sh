#!/usr/bin/env bash
set -e

# Make sure we're in the project directory
cd "$(dirname "$0")"

# Run the Node.js script which handles cross-platform prompts and GitHub REST API calls
exec node push-to-github.mjs "$@"
