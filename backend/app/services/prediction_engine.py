from __future__ import annotations

from dataclasses import dataclass
from math import exp


@dataclass(frozen=True)
class StrategyInput:
    driver_rating: float
    tire_age: int
    pit_lap: int
    track_position: int
    safety_car_probability: float
    rain_probability: float


class PredictionEngine:
    def winner_probabilities(self) -> list[dict]:
        drivers = [
            ("NOR", "Lando Norris", 92, 0.16),
            ("VER", "Max Verstappen", 94, 0.14),
            ("LEC", "Charles Leclerc", 88, 0.18),
            ("RUS", "George Russell", 85, 0.17),
            ("ALO", "Fernando Alonso", 80, 0.19),
        ]
        scores = [rating / 10 - deg * 8 for _, _, rating, deg in drivers]
        total = sum(exp(score) for score in scores)
        return [
            {"code": code, "driver": name, "probability": round(exp(score) / total * 100, 1)}
            for (code, name, _, _), score in zip(drivers, scores, strict=True)
        ]

    def predict_strategy(self, payload: StrategyInput) -> dict:
        stop_delta = abs(payload.pit_lap - 18) * 0.22
        tire_penalty = payload.tire_age * 0.035
        chaos_credit = payload.safety_car_probability * 0.018 + payload.rain_probability * 0.012
        expected_delta = round(stop_delta + tire_penalty - chaos_credit - payload.driver_rating / 85, 2)
        final_position = max(1, min(20, round(payload.track_position + expected_delta)))
        return {
            "final_position": final_position,
            "expected_delta": expected_delta,
            "undercut_opportunity": payload.pit_lap <= 18 and payload.track_position <= 5,
            "overcut_opportunity": payload.pit_lap >= 21 and payload.tire_age < 18,
            "confidence": max(0.52, round(0.91 - stop_delta / 20, 2)),
        }

    def safety_car_probability(self, circuit_risk: float, rain_probability: float, field_spread: float) -> float:
        probability = 0.18 + circuit_risk * 0.52 + rain_probability * 0.22 - field_spread * 0.03
        return round(max(0.02, min(0.94, probability)), 3)


engine = PredictionEngine()
