#!/usr/bin/env bash
# Render build step for the Django API (runs from backend/, see render.yaml).
set -o errexit -o nounset -o pipefail

# Install dependencies with uv, from the lockfile, into ./.venv using Render's Python
# (PYTHON_VERSION). Never let uv download its own interpreter: it would not exist at runtime.
pip install --upgrade --quiet uv
export UV_PYTHON_DOWNLOADS=never
uv sync --frozen --no-dev

.venv/bin/python manage.py collectstatic --noinput
