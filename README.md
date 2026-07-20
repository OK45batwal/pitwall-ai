# PitWall AI

PitWall AI is a modern Formula 1 race strategy analytics platform with a premium dark telemetry UI, FastAPI backend, PostgreSQL/Redis infrastructure, and starter ML pipelines.

## Included

- Next.js 15 frontend with Dashboard, Live Race Tracker, Driver Analytics, Team Performance, Strategy Simulator, AI Prediction Center, Historical Race Analysis, Weather Impact Analysis, Profile, and Settings pages.
- Recharts telemetry visuals for lap delta, tire degradation, sector comparison, pit stops, team trends, race simulations, and weather impact.
- FastAPI backend with REST endpoints, JWT auth token issuing, rate limiting, Redis caching, SQLAlchemy domain models, and WebSocket telemetry streaming.
- PostgreSQL schema models for drivers, teams, races, telemetry, tire data, predictions, pit strategies, and weather data.
- ML starters for winner prediction, tire wear estimation, safety car prediction, pit strategy optimization, and Keras pace degradation.
- Mock data and API documentation.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Run Backend

```bash
docker compose up -d
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs are available at `http://localhost:8000/docs`.

## Train ML Starters

```bash
cd ml-models
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. python pitwall_ml/train.py
```

Artifacts are written to `ml-models/artifacts/`.

## Key Endpoints

- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/predictions/winner`
- `POST /api/v1/strategy/simulate`
- `GET /api/v1/predictions/safety-car`
- `WS /api/v1/ws/telemetry`

## Data Sources

The backend includes a gateway for OpenF1 and Ergast-compatible endpoints. FastF1 is intended for offline ingestion jobs because it is Python-native and benefits from persistent caching.
