# PitWall AI Architecture

PitWall AI is split into three production domains:

- `frontend/`: Next.js 15 analytics console with responsive telemetry dashboards, strategy simulator, user profile, saved simulations, notifications, and theme controls.
- `backend/`: FastAPI REST and WebSocket service with JWT auth, rate limiting, Redis caching, PostgreSQL SQLAlchemy models, and modular F1 data gateways.
- `ml-models/`: Scikit-Learn, XGBoost, LightGBM, and TensorFlow/Keras starter pipelines for race winner, tire wear, safety car, pit strategy, and pace degradation models.

The backend is designed so FastF1, Ergast, and OpenF1 ingestion can run as scheduled jobs that normalize sessions into the PostgreSQL domain tables. Live updates flow through `/api/v1/ws/telemetry`; lower-frequency prediction endpoints are cached in Redis.

Core database entities:

- Drivers
- Teams
- Races
- Telemetry
- TireData
- Predictions
- PitStrategies
- WeatherData

Production hardening checklist:

- Replace the default `jwt_secret`.
- Put PostgreSQL and Redis credentials in environment variables.
- Add Alembic migrations before shared deployment.
- Persist trained ML artifacts to object storage or a model registry.
- Add real FastF1 data ingestion jobs once API credentials and cache policy are finalized.
