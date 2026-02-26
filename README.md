# ey (EyesOnly director/ops desktop tools)

`ey` is a local frontend used to coordinate and monitor **EyesOnly** scenarios.

It supports **single-persona sessions** (one at a time):
- **M DIRECTOR** (director helper)
- **OPS ACTOR** (coffee-shop moderator dashboard)
- **PLAYER** (stub)

## How it connects

- You enter a **portal URL** like `https://flapsandseals.com/m`.
- `ey` derives the API origin (`https://flapsandseals.com`) and uses `/api/*` endpoints.

### Identity model (current)

- **Account-first identity**
  - Ops sessions authenticate via `POST /api/user/login` (username-only)
  - Then join scenario via `POST /api/join` using `Authorization: Bearer <user session token>`
- **Ops is a scenario-scoped moderator role**
  - Granted/revoked by M via `scenario_user_roles`

## Sync model

When EyesOnly session globals are present, `ey` uses the real backend:

- M events: `GET /api/m/events/:scenarioId` + `POST /api/m/event`
- Grid/dead drops: `GET /api/m/grid/:scenarioId/cells` + director dead-drop endpoints
- Game state: ops uses `/api/ops/status`, `/api/ops/pings`, `/api/ops/ack`, `/api/ops/telemetry`, `/api/ops/ws`
- WS: `/api/m/ws?token=...` and `/api/ops/ws?token=...`

Spark KV is retained only as a fallback for dev scaffolding.

## Dev

```sh
npm run build
```

## Notes

This repo previously described itself as a full standalone “Field Telemetry” platform.
It now functions primarily as a **companion desktop tool** for EyesOnly.
