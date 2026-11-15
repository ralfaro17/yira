# Yira backend

Django + DRF backend for astronaut health monitoring (NASA Space Apps Challenge 2026,
"Create Health Monitoring Software for Astronauts on Space Missions").

It takes in crew telemetry (vitals, sleep, radiation dose, cabin CO2) and analyses it:
- static thresholds
- a personal baseline that accounts for time of day
- anomaly detection
- trends
- cumulative radiation exposure
- an explainable 0–100 risk score

It raises alerts and serves chart-ready data to the frontend.

> **Disclaimer:** the thresholds in `health/analysis/reference.py` are demonstration values
> based on public references, such as adult vital-sign norms and the NASA-STD-3001 radiation limits.
> They are **not clinical guidance**.

## Setup

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py simulate_mission --reset   # creates user "demo" / "demo-password-123"
uv run python manage.py runserver
uv run python manage.py test health
```

## Authentication (django-allauth headless, sessions)

Accounts use the stock `django.contrib.auth` User. Users log in with a username or email plus a password. There's no email verification.

| Step | Request |
|---|---|
| Get the CSRF cookie | `GET /api/csrf/`, then send the `csrftoken` value as the `X-CSRFToken` header on writes |
| Sign up | `POST /_allauth/browser/v1/auth/signup` `{"username", "email", "password"}` |
| Log in | `POST /_allauth/browser/v1/auth/login` `{"username" or "email", "password"}` |
| Current session | `GET /_allauth/browser/v1/auth/session` |
| Log out | `DELETE /_allauth/browser/v1/auth/session`, which returns 401 to mean "no longer authenticated" |

Cross-origin calls from the Vite dev server need `credentials: "include"` (axios: `withCredentials: true`).

## Health API (`/api/health/`, session auth required)

| Endpoint | Purpose |
|---|---|
| `GET metrics/` | Metric catalog: units, normal ranges, alert limits (public) |
| `GET dashboard/` | All your crew members with their latest vitals, risk score and open alerts, sorted by risk |
| `crew/` | CRUD for crew members (scoped to the logged-in user) |
| `GET crew/{id}/measurements/?metric=&start=&end=&limit=&offset=` | Raw measurements |
| `POST crew/{id}/measurements/` | Bulk ingest `{"source": "sensor", "measurements": [{"metric", "value", "recorded_at"}]}` |
| `POST crew/{id}/measurements/upload/` | CSV upload (multipart field `file`), long (`metric,value,recorded_at`) or wide (`recorded_at,heart_rate,spo2,...`) format |
| `GET crew/{id}/summary/?window=7d&metric=` | Per-metric statistics, latest status, personal baseline, MAP, radiation budget |
| `GET crew/{id}/timeseries/?metric=&resolution=1h&window=24h` | Resampled mean/min/max for charts |
| `GET crew/{id}/anomalies/?window=7d&method=baseline\|rolling&z=3.5&persistence=3` | On-demand anomaly scan |
| `GET crew/{id}/trends/?window=14d` | Daily linear trend per metric (slope, t-statistic, flags) |
| `GET crew/{id}/risk/` | Risk score with per-factor breakdown |
| `GET alerts/?crew_member=&severity=&kind=&metric=&acknowledged=` | Alerts |
| `PATCH alerts/{id}/` `{"acknowledged": true}` | Acknowledge an alert |

Windows end at the latest measurement unless you pass `end`. Durations look like `30m`, `24h`, `7d` or `2w`.

Metrics: `heart_rate`, `hrv_rmssd`, `spo2`, `systolic_bp`, `diastolic_bp`, `respiratory_rate`,
`body_temp`, `sleep_duration`, `radiation_dose` (mSv per reading), `cabin_co2`.

## How alerts are generated

Every ingest (API, CSV or simulator) goes through `services.ingest_measurements`, which runs these checks:

- **Threshold:** warning and critical limits per metric. High-rate vitals need 2 consecutive breaching samples before an alert fires, which acts as an alarm delay.
- **Anomaly:** a robust z-score (median and MAD) against the crew member's own baseline. The baseline comes from their first 3 days, in 1-hour time-of-day buckets. It needs 3 consecutive deviating readings, and |z| ≥ 6 is a warning.
- **Radiation:** the 24 h dose rate (possible solar particle event), plus cumulative 30-day, 365-day and career dose compared against limits.
- **Trend:** a significant daily trend in a concerning direction, such as sleep falling or resting HR rising.

Repeat breaches fold into one alert **episode** (`occurrences`, `last_seen_at`) rather than creating a new alert each time.
The risk score only counts alerts that were active in the last 24 h.

## Simulator

`manage.py simulate_mission --crew 4 --days 14 --interval 5m --seed 42 --reset` generates
data that follows a daily cycle and injects these scenarios:
- solar particle event (all crew)
- fever (crew 0)
- progressive sleep loss (crew 1)
- hypoxic desaturation (crew 2)
- CO2 scrubber degradation (all crew)

Use `--scenarios fever,spe` to pick a subset, or `--scenarios none` for none.
