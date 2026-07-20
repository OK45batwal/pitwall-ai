import asyncio
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from app.core.openf1 import openf1
from app.core.security import create_access_token, get_current_user
from app.services.cache import get_json, set_json
from app.services.prediction_engine import StrategyInput, engine

router = APIRouter()


def _merge_positions(positions: list[dict], intervals: list[dict]) -> list[dict]:
    interval_map = {i["driver_number"]: i for i in intervals if "driver_number" in i}
    merged = []
    for pos in positions:
        intv = interval_map.get(pos.get("driver_number"))
        merged.append({**pos, "interval_ms": intv.get("lap_ms") if intv else None, "gap_to_leader": intv.get("gap_to_leader") if intv else None})
    return sorted(merged, key=lambda x: x.get("position", 99))


class LoginRequest(BaseModel):
    email: str
    password: str


class StrategyRequest(BaseModel):
    driver_rating: float = Field(ge=1, le=100)
    tire_age: int = Field(ge=0, le=70)
    pit_lap: int = Field(ge=1, le=78)
    track_position: int = Field(ge=1, le=20)
    safety_car_probability: float = Field(ge=0, le=1)
    rain_probability: float = Field(ge=0, le=1)


class SessionRequest(BaseModel):
    year: int | None = None
    session_key: int | None = None


@router.post("/auth/login")
async def login(payload: LoginRequest) -> dict:
    return {"access_token": create_access_token(payload.email), "token_type": "bearer"}


@router.get("/sessions")
async def list_sessions(year: int | None = Query(None), _user: str = Depends(get_current_user)) -> dict:
    sessions = await openf1.sessions(year)
    return {"sessions": sessions[-10:], "total": len(sessions)}


@router.get("/sessions/latest")
async def latest_session(_user: str = Depends(get_current_user)) -> dict:
    session = await openf1.latest_session()
    if not session:
        return {"session": None}
    return {"session": session}


@router.get("/sessions/{session_key}/drivers")
async def session_drivers(session_key: int, _user: str = Depends(get_current_user)) -> dict:
    drivers = await openf1.drivers(session_key)
    return {"drivers": drivers, "count": len(drivers)}


@router.get("/sessions/{session_key}/positions")
async def session_positions(session_key: int, _user: str = Depends(get_current_user)) -> dict:
    cached = await get_json(f"positions_{session_key}")
    if cached:
        return cached
    try:
        positions, intervals = await asyncio.gather(
            openf1.positions(session_key), openf1.intervals(session_key)
        )
        merged = _merge_positions(positions, intervals)
        result = {"positions": merged, "updated_at": str(datetime.now(timezone.utc))}
        await set_json(f"positions_{session_key}", result, ttl_seconds=5)
        return result
    except Exception as e:
        return {"error": str(e), "positions": []}


@router.get("/sessions/{session_key}/laps")
async def session_laps(session_key: int, driver_number: int | None = Query(None), _user: str = Depends(get_current_user)) -> dict:
    laps = await openf1.laps(session_key, driver_number)
    return {"laps": laps, "count": len(laps)}


@router.get("/sessions/{session_key}/telemetry")
async def session_telemetry(session_key: int, driver_number: int | None = Query(None), _user: str = Depends(get_current_user)) -> dict:
    data = await openf1.car_data(session_key, driver_number)
    latest = data[-20:] if data else []
    return {"telemetry": latest, "count": len(latest)}


@router.get("/sessions/{session_key}/weather")
async def session_weather(session_key: int, _user: str = Depends(get_current_user)) -> dict:
    weather = await openf1.weather(session_key)
    latest = weather[-1] if weather else None
    return {"weather": latest, "history": weather[-10:]}


@router.get("/sessions/{session_key}/race-control")
async def race_control(session_key: int, _user: str = Depends(get_current_user)) -> dict:
    messages = await openf1.race_control(session_key)
    return {"messages": messages[-20:], "count": len(messages)}


@router.get("/predictions/winner")
async def winner_prediction(session_key: int | None = Query(None), _user: str = Depends(get_current_user)) -> dict:
    cached = await get_json("winner_prediction")
    if cached:
        return cached
    probabilities = engine.winner_probabilities()
    result = {"race": "Latest F1 Session", "predictions": probabilities, "drivers": []}
    if session_key:
        try:
            f1_drivers = await openf1.drivers(session_key)
            matched = []
            for p in probabilities:
                code = p.get("code", "").upper()
                for d in f1_drivers:
                    if d.get("name_acronym", "").upper() == code or d.get("code", "").upper() == code:
                        matched.append(d)
                        break
            result["drivers"] = matched
        except Exception:
            pass
    await set_json("winner_prediction", result, ttl_seconds=30)
    return result


@router.post("/strategy/simulate")
async def simulate_strategy(payload: StrategyRequest, _user: str = Depends(get_current_user)) -> dict:
    prediction = engine.predict_strategy(StrategyInput(**payload.model_dump()))
    return {"input": payload.model_dump(), "prediction": prediction}


@router.get("/predictions/safety-car")
async def safety_car(
    _user: str = Depends(get_current_user),
    circuit_risk: float = 0.82,
    rain_probability: float = 0.22,
    field_spread: float = 4.4,
) -> dict:
    probability = engine.safety_car_probability(circuit_risk, rain_probability, field_spread)
    risk_band = "high" if probability > 0.6 else "medium" if probability > 0.35 else "low"
    return {"probability": probability, "risk_band": risk_band}


@router.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket, session_key: int = 0) -> None:
    await websocket.accept()
    lap = 1
    try:
        while True:
            if session_key:
                try:
                    positions, intervals = await asyncio.gather(
                        openf1.positions(session_key), openf1.intervals(session_key)
                    )
                    if positions:
                        merged = _merge_positions(positions, intervals)
                        await websocket.send_json({"type": "positions", "data": merged})
                except Exception:
                    pass
            else:
                await websocket.send_json({
                    "lap": lap,
                    "driver": random.choice(["NOR", "VER", "LEC", "RUS", "HAM", "PIA", "SAI"]),
                    "speed_kph": round(random.uniform(92, 312), 1),
                    "throttle": round(random.uniform(0.18, 1.0), 2),
                    "brake": round(random.uniform(0.0, 0.8), 2),
                    "sector_delta": round(random.uniform(-0.35, 0.42), 3),
                    "position": random.randint(1, 20),
                })
            lap = 1 if lap >= 78 else lap + 1
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        return
