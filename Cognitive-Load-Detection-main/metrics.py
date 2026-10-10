import time
from classifier import predict


latest_metrics = {
    "ear": 0.0,
    "mar": 0.0,
    "blink_count": 0,
    "yawn_count": 0,
    "head_movement": "Stable",
    "head_score": 0.0,
    "typing_speed": 0.0,
    "keyboard_idle": 0.0,
    "mouse_speed": 0.0,
    "mouse_idle": 0.0,
    "mouse_clicks": 0,
    "study_time": 0.0,
    "load_score": 0.0,
    "load_label": "LOW",
    "high_load_seconds": 0,
    "cognitive_load": 0,
}

# One prediction per second keeps the application responsive and the chart honest.
load_history = []
session_load_history = []
session_typing_history = []
session_mouse_speed_history = []
session_records = []
last_score_second = None
high_load_seconds = 0


def update_load_score():
    """Predict cognitive load with the trained classifier and update dashboard history."""
    global last_score_second, high_load_seconds

    current_second = int(time.monotonic())
    sampled_this_second = last_score_second != current_second

    if sampled_this_second:
        current_prediction = predict(latest_metrics)
        raw_score = float(current_prediction.get("load_score", 0.0))

        latest_metrics["cognitive_load"] = int(current_prediction.get("class", 0))
        latest_metrics["load_label"] = current_prediction.get("prediction", "LOW")

        load_history.append(raw_score)
        if len(load_history) > 120:
            load_history.pop(0)

        session_load_history.append(raw_score)
        session_typing_history.append(latest_metrics["typing_speed"])
        session_mouse_speed_history.append(latest_metrics["mouse_speed"])

        session_records.append({
            "time": int(round(latest_metrics.get("study_time", 0.0))),
            "ear": latest_metrics.get("ear", 0.0),
            "mar": latest_metrics.get("mar", 0.0),
            "blink_count": latest_metrics.get("blink_count", 0),
            "yawn_count": latest_metrics.get("yawn_count", 0),
            "head_movement": latest_metrics.get("head_movement", "Stable"),
            "typing_speed": latest_metrics.get("typing_speed", 0.0),
            "mouse_speed": latest_metrics.get("mouse_speed", 0.0),
            "keyboard_idle": latest_metrics.get("keyboard_idle", 0.0),
            "mouse_idle": latest_metrics.get("mouse_idle", 0.0),
            "mouse_clicks": latest_metrics.get("mouse_clicks", 0),
            "load_score": raw_score,
            "load_label": latest_metrics.get("load_label", "LOW"),
        })

        last_score_second = current_second

    average_load = round(sum(load_history) / len(load_history), 1) if load_history else 0.0
    latest_metrics["load_score"] = average_load
    latest_metrics["load_label"] = (
        "LOW" if average_load <= 30 else "MEDIUM" if average_load <= 60 else "HIGH"
    )
    high_load_seconds = high_load_seconds + 1 if average_load > 60 else 0
    latest_metrics["high_load_seconds"] = high_load_seconds


def get_session_records():
    return list(session_records)


def get_session_load_summary():
    if not session_load_history:
        return {
            "average_load": 0.0, "maximum_load": 0.0, "minimum_load": 0.0,
            "average_typing_speed": 0.0, "average_mouse_speed": 0.0,
            "focus_percentage": 100.0, "session_chart": [],
        }

    average_load = round(sum(session_load_history) / len(session_load_history), 1)
    return {
        "average_load": average_load,
        "maximum_load": round(max(session_load_history), 1),
        "minimum_load": round(min(session_load_history), 1),
        "average_typing_speed": round(sum(session_typing_history) / len(session_typing_history), 1),
        "average_mouse_speed": round(sum(session_mouse_speed_history) / len(session_mouse_speed_history), 1),
        "focus_percentage": round(max(0.0, min(100.0, 100.0 - average_load)), 1),
        "session_chart": list(session_load_history),
    }


def reset_metrics():
    global last_score_second, high_load_seconds
    latest_metrics.update({
        "ear": 0.0, "mar": 0.0, "blink_count": 0, "yawn_count": 0,
        "head_movement": "Stable", "head_score": 0.0, "typing_speed": 0.0,
        "keyboard_idle": 0.0, "mouse_speed": 0.0, "mouse_idle": 0.0,
        "mouse_clicks": 0, "study_time": 0.0, "load_score": 0.0,
        "load_label": "LOW", "high_load_seconds": 0,
        "cognitive_load": 0,
    })
    load_history.clear()
    session_load_history.clear()
    session_typing_history.clear()
    session_mouse_speed_history.clear()
    session_records.clear()
    last_score_second = None
    high_load_seconds = 0
