import joblib
import numpy as np

# ---------------------------------------
# Load trained model
# ---------------------------------------

model = joblib.load("model.pkl")
feature_columns = joblib.load("feature_columns.pkl")


# -------------------------------------------------
# Labels
# -------------------------------------------------

LABELS = {
    0: "LOW",
    1: "MEDIUM",
    2: "HIGH"
}


# -------------------------------------------------
# Predict Cognitive Load
# -------------------------------------------------

def predict(metrics):
    """
    metrics -> dictionary containing live metrics

    Returns:
    {
        "prediction": LOW/MEDIUM/HIGH,
        "class": 0/1/2,
        "confidence": 97.3,
        "load_score": 64.8
    }
    """

    # Arrange features in correct order
    sample = []

    for feature in feature_columns:
        value = metrics.get(feature, 0)

        if feature == "head_movement":
            if isinstance(value, str):
                value = metrics.get("head_score", 0.0)

        if value is None:
            value = 0.0

        if isinstance(value, str):
            try:
                value = float(value)
            except ValueError:
                value = 0.0

        sample.append(float(value))

    sample = np.array(sample).reshape(1, -1)

    # Prediction
    prediction = model.predict(sample)[0]

    # Probabilities
    probabilities = model.predict_proba(sample)[0]

    confidence = float(np.max(probabilities) * 100)

    # Continuous Load Score (0-100)
    #
    # Instead of simply returning LOW/MEDIUM/HIGH,
    # use probability distribution to create a smoother gauge.

    low, medium, high = probabilities

    load_score = (
        low * 20 +
        medium * 55 +
        high * 90
    )

    return {
        "prediction": LABELS[prediction],
        "class": int(prediction),
        "confidence": round(confidence, 2),
        "load_score": round(float(load_score), 2)
    }


# -------------------------------------------------
# Standalone Testing
# -------------------------------------------------

if __name__ == "__main__":

    sample = {
        "ear": 0.24,
        "mar": 0.31,
        "blink_count": 12,
        "yawn_count": 2,
        "head_movement": 4.5,
        "typing_speed": 38,
        "mouse_speed": 180,
        "keyboard_idle": 12,
        "mouse_idle": 10,
        "mouse_clicks": 42,
        "study_time": 65,
        "load_score": 50
    }

    result = predict(sample)

    print("\nPrediction")
    print(result)