import numpy as np
import tensorflow as tf


def build_pace_degradation_model(sequence_length: int = 12, features: int = 5) -> tf.keras.Model:
    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(sequence_length, features)),
        tf.keras.layers.LSTM(48, return_sequences=True),
        tf.keras.layers.Dropout(0.15),
        tf.keras.layers.LSTM(24),
        tf.keras.layers.Dense(16, activation="relu"),
        tf.keras.layers.Dense(1, name="pace_degradation"),
    ])
    model.compile(optimizer="adam", loss="mae", metrics=["mse"])
    return model


def smoke_train() -> dict:
    rng = np.random.default_rng(12)
    x = rng.normal(size=(64, 12, 5))
    y = x[:, :, 0].mean(axis=1) * 0.18 + rng.normal(0, 0.03, 64)
    model = build_pace_degradation_model()
    history = model.fit(x, y, epochs=2, verbose=0)
    return {"loss": float(history.history["loss"][-1])}
