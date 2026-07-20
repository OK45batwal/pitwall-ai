from pathlib import Path

import joblib
from lightgbm import LGBMRegressor
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, mean_absolute_error, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from pitwall_ml.features import FEATURES, build_mock_training_frame


def train_all(output_dir: str = "artifacts") -> dict:
    frame = build_mock_training_frame()
    x_train, x_test, y_train, y_test = train_test_split(frame[FEATURES], frame["winner"], test_size=0.2, random_state=7)
    winner_model = Pipeline([
        ("scale", StandardScaler()),
        ("model", XGBClassifier(n_estimators=120, max_depth=3, learning_rate=0.05, eval_metric="logloss")),
    ])
    winner_model.fit(x_train, y_train)
    winner_prob = winner_model.predict_proba(x_test)[:, 1]

    safety_x_train, safety_x_test, safety_y_train, safety_y_test = train_test_split(frame[FEATURES], frame["safety_car_event"], test_size=0.2, random_state=11)
    safety_model = RandomForestClassifier(n_estimators=160, max_depth=6, random_state=11)
    safety_model.fit(safety_x_train, safety_y_train)

    tire_x_train, tire_x_test, tire_y_train, tire_y_test = train_test_split(frame[FEATURES], frame["degradation"], test_size=0.2, random_state=13)
    tire_model = LGBMRegressor(n_estimators=180, learning_rate=0.04, verbose=-1)
    tire_model.fit(tire_x_train, tire_y_train)

    pit_x_train, pit_x_test, pit_y_train, pit_y_test = train_test_split(frame[FEATURES], frame["optimal_pit_lap"], test_size=0.2, random_state=17)
    pit_model = LGBMRegressor(n_estimators=180, learning_rate=0.04, verbose=-1)
    pit_model.fit(pit_x_train, pit_y_train)

    artifact_dir = Path(output_dir)
    artifact_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(winner_model, artifact_dir / "winner_prediction.joblib")
    joblib.dump(safety_model, artifact_dir / "safety_car_prediction.joblib")
    joblib.dump(tire_model, artifact_dir / "tire_wear_estimation.joblib")
    joblib.dump(pit_model, artifact_dir / "pit_strategy_optimization.joblib")

    return {
        "winner_auc": round(roc_auc_score(y_test, winner_prob), 4),
        "winner_accuracy": round(accuracy_score(y_test, winner_model.predict(x_test)), 4),
        "safety_car_accuracy": round(accuracy_score(safety_y_test, safety_model.predict(safety_x_test)), 4),
        "tire_wear_mae": round(mean_absolute_error(tire_y_test, tire_model.predict(tire_x_test)), 4),
        "pit_lap_mae": round(mean_absolute_error(pit_y_test, pit_model.predict(pit_x_test)), 4),
    }


if __name__ == "__main__":
    print(train_all())
