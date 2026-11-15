#!/usr/bin/env bash
# Render start command for the Django API (runs from backend/, see render.yaml).
# Migrations run here because pre-deploy commands are not available on the free plan.
set -o errexit -o nounset -o pipefail

PY=.venv/bin/python

$PY manage.py migrate --noinput

# Optional demo data: set DEMO_PASSWORD (and optionally DEMO_USERNAME / DEMO_EMAIL)
# to create the demo operator and a simulated 14-day mission on the first boot.
if [[ -n "${DEMO_PASSWORD:-}" ]]; then
  $PY manage.py simulate_mission --if-empty \
    --user "${DEMO_USERNAME:-demo}" \
    --password "$DEMO_PASSWORD" \
    --email "${DEMO_EMAIL:-demo@example.com}"
fi

exec .venv/bin/gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --timeout 120 \
  --access-logfile - \
  --forwarded-allow-ips "*"
