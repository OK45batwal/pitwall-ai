import numpy as np
import pandas as pd


def build_mock_training_frame(rows: int = 1200, seed: int = 44) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    driver_rating = rng.normal(84, 7, rows).clip(55, 99)
    team_pace = rng.normal(82, 8, rows).clip(50, 99)
    grid = rng.integers(1, 21, rows)
    tire_age = rng.integers(0, 34, rows)
    rain = rng.random(rows)
    safety_car = rng.random(rows)
    track_temp = rng.normal(36, 7, rows).clip(12, 58)
    deg = tire_age * 0.045 + track_temp * 0.012 - driver_rating * 0.006 + rng.normal(0, 0.12, rows)
    winner_score = driver_rating * 0.05 + team_pace * 0.06 - grid * 0.19 - deg + safety_car * 0.35
    winner = winner_score > np.quantile(winner_score, 0.86)
    safety_car_event = safety_car + rain * 0.28 + (grid < 6) * 0.04 > 0.72
    optimal_pit_lap = (18 + tire_age * 0.18 + rain * 6 - safety_car * 3 + rng.normal(0, 2, rows)).clip(8, 48)
    return pd.DataFrame({
        "driver_rating": driver_rating,
        "team_pace": team_pace,
        "grid": grid,
        "tire_age": tire_age,
        "rain_probability": rain,
        "safety_car_probability": safety_car,
        "track_temp": track_temp,
        "degradation": deg,
        "winner": winner.astype(int),
        "safety_car_event": safety_car_event.astype(int),
        "optimal_pit_lap": optimal_pit_lap,
    })


FEATURES = [
    "driver_rating",
    "team_pace",
    "grid",
    "tire_age",
    "rain_probability",
    "safety_car_probability",
    "track_temp",
]
