from flask import Flask, render_template, Response, jsonify, send_file
import csv
import io
import cv2
import threading

from vision.face_detector import detect_face
from vision.fatigue_detector import reset_fatigue_state
from tracking.keyboard_tracker import KeyboardTracker
from tracking.mouse_tracker import MouseTracker
from metrics import latest_metrics, update_load_score, get_session_load_summary, get_session_records, reset_metrics
import time

app = Flask(__name__)

# Session and webcam lifecycle
camera = None
camera_lock = threading.RLock()
session_active = True
session_started_at = time.time()


def open_camera():
    global camera
    with camera_lock:
        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(0)
        return camera


def release_camera():
    global camera
    with camera_lock:
        if camera is not None:
            camera.release()
        camera = None


def session_summary():
    summary = get_session_load_summary()
    summary.update({
        "duration": round(latest_metrics.get("study_time", 0.0), 1),
        "blink_count": int(latest_metrics.get("blink_count", 0)),
        "yawn_count": int(latest_metrics.get("yawn_count", 0)),
        "typing_speed": float(latest_metrics.get("typing_speed", 0.0)),
        "mouse_clicks": int(latest_metrics.get("mouse_clicks", 0)),
    })
    return summary

# Keyboard Tracker
keyboard_tracker = KeyboardTracker()
keyboard_tracker.start()

# Mouse Tracker
mouse_tracker = MouseTracker()
mouse_tracker.start()


def generate_frames():
    global session_active
    open_camera()

    while session_active:
        with camera_lock:
            active_camera = camera

        if active_camera is None or not active_camera.isOpened():
            break

        success, frame = active_camera.read()

        if not success:
            break

        # ----------------------------
        # Face Detection
        # ----------------------------

        frame = detect_face(frame)

        # ----------------------------
        # Update Keyboard Metrics
        # ----------------------------

        latest_metrics["typing_speed"] = round(
            keyboard_tracker.get_typing_speed(), 1
        )

        latest_metrics["keyboard_idle"] = round(
            keyboard_tracker.get_idle_time(), 1
        )

        # ----------------------------
        # Update Mouse Metrics
        # ----------------------------

        latest_metrics["mouse_speed"] = round(
            mouse_tracker.get_mouse_speed(), 1
        )

        latest_metrics["mouse_idle"] = round(
            mouse_tracker.get_idle_time(), 1
        )

        latest_metrics["mouse_clicks"] = mouse_tracker.get_clicks()
        latest_metrics["study_time"] = round(time.time() - session_started_at, 1)
        update_load_score()

        # ----------------------------
        # Encode Frame
        # ----------------------------

        _, buffer = cv2.imencode(".jpg", frame)

        frame = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame +
            b"\r\n"
        )


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")


@app.route("/video")
def video():
    if not session_active:
        return Response(status=204)
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


# ----------------------------
# API for Dashboard
# ----------------------------

@app.route("/metrics")
def metrics():
    # Always send the complete dashboard contract, including before video starts.
    latest_metrics["session_active"] = session_active
    return jsonify(latest_metrics)


@app.route("/end_session", methods=["POST"])
def end_session():
    global session_active
    if session_active:
        latest_metrics["study_time"] = round(time.time() - session_started_at, 1)
        update_load_score()
        session_active = False
        release_camera()
        keyboard_tracker.stop()
        mouse_tracker.stop()

    return jsonify(session_summary())


@app.route("/download_session_csv")
def download_session_csv():
    records = get_session_records()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "Time",
        "EAR",
        "MAR",
        "Blink_Count",
        "Yawn_Count",
        "Head_Movement",
        "Typing_Speed",
        "Mouse_Speed",
        "Keyboard_Idle",
        "Mouse_Idle",
        "Mouse_Clicks",
        "Load_Score",
        "Load_Label"
    ])
    writer.writeheader()

    for record in records:
        writer.writerow({
            "Time": record.get("time", 0),
            "EAR": record.get("ear", 0.0),
            "MAR": record.get("mar", 0.0),
            "Blink_Count": record.get("blink_count", 0),
            "Yawn_Count": record.get("yawn_count", 0),
            "Head_Movement": record.get("head_movement", "Stable"),
            "Typing_Speed": record.get("typing_speed", 0.0),
            "Mouse_Speed": record.get("mouse_speed", 0.0),
            "Keyboard_Idle": record.get("keyboard_idle", 0.0),
            "Mouse_Idle": record.get("mouse_idle", 0.0),
            "Mouse_Clicks": record.get("mouse_clicks", 0),
            "Load_Score": record.get("load_score", 0.0),
            "Load_Label": record.get("load_label", "LOW"),
        })

    csv_bytes = io.BytesIO(output.getvalue().encode("utf-8"))
    csv_bytes.seek(0)
    return send_file(
        csv_bytes,
        mimetype="text/csv",
        download_name="mindload_session.csv",
        as_attachment=True
    )


@app.route("/start_session", methods=["POST"])
def start_session():
    global session_active, session_started_at
    release_camera()
    reset_fatigue_state()
    reset_metrics()
    keyboard_tracker.reset()
    mouse_tracker.reset()
    keyboard_tracker.start()
    mouse_tracker.start()
    session_started_at = time.time()
    session_active = True
    open_camera()
    latest_metrics["session_active"] = True
    return jsonify(latest_metrics)


if __name__ == "__main__":

    app.run(debug=True)
