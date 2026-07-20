from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    power_unit: Mapped[str] = mapped_column(String(80))
    base_color: Mapped[str] = mapped_column(String(16))
    drivers: Mapped[list["Driver"]] = relationship(back_populates="team")


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(3), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"))
    rating: Mapped[float] = mapped_column(Float, default=80)
    team: Mapped[Team] = relationship(back_populates="drivers")


class Race(Base):
    __tablename__ = "races"

    id: Mapped[int] = mapped_column(primary_key=True)
    season: Mapped[int] = mapped_column(Integer, index=True)
    round: Mapped[int] = mapped_column(Integer)
    name: Mapped[str] = mapped_column(String(160), index=True)
    circuit: Mapped[str] = mapped_column(String(160))
    start_time: Mapped[datetime] = mapped_column(DateTime)


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    lap: Mapped[int] = mapped_column(Integer)
    speed_kph: Mapped[float] = mapped_column(Float)
    throttle: Mapped[float] = mapped_column(Float)
    brake: Mapped[float] = mapped_column(Float)
    sector_delta: Mapped[float] = mapped_column(Float)


class TireData(Base):
    __tablename__ = "tire_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    lap: Mapped[int] = mapped_column(Integer)
    compound: Mapped[str] = mapped_column(String(24))
    age_laps: Mapped[int] = mapped_column(Integer)
    degradation: Mapped[float] = mapped_column(Float)


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    model_name: Mapped[str] = mapped_column(String(80))
    prediction_type: Mapped[str] = mapped_column(String(80), index=True)
    payload: Mapped[dict] = mapped_column(JSON)
    confidence: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PitStrategy(Base):
    __tablename__ = "pit_strategies"

    id: Mapped[int] = mapped_column(primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("drivers.id"), index=True)
    stop_lap: Mapped[int] = mapped_column(Integer)
    compound: Mapped[str] = mapped_column(String(24))
    expected_delta: Mapped[float] = mapped_column(Float)
    risk_score: Mapped[float] = mapped_column(Float)


class WeatherData(Base):
    __tablename__ = "weather_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, index=True)
    track_temp_c: Mapped[float] = mapped_column(Float)
    air_temp_c: Mapped[float] = mapped_column(Float)
    rain_probability: Mapped[float] = mapped_column(Float)
    wind_kph: Mapped[float] = mapped_column(Float)
