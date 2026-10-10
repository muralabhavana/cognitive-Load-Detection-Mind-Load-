import cv2
import mediapipe as mp
from vision.fatigue_detector import detect_fatigue
from metrics import latest_metrics

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

mp_draw = mp.solutions.drawing_utils

drawing_spec = mp_draw.DrawingSpec(
    thickness=1,
    circle_radius=1
)


def detect_face(frame):
    ear = 0.0
    mar = 0.0
    blink_count = 0
    yawn_count = 0
    head_movement = "Stable"
    head_score = 0.0

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:

        for face_landmarks in results.multi_face_landmarks:

            mp_draw.draw_landmarks(
                frame,
                face_landmarks,
                mp_face_mesh.FACEMESH_TESSELATION,
                landmark_drawing_spec=drawing_spec,
                connection_drawing_spec=drawing_spec
            )

            frame, ear, blink_count, mar, yawn_count, head_score = detect_fatigue(
                frame,
                face_landmarks
            )

            if head_score < 2:
                head_movement = "Stable"
            elif head_score < 8:
                head_movement = "Moderate"
            else:
                head_movement = "High"

    latest_metrics["ear"] = round(ear, 3)
    latest_metrics["mar"] = round(mar, 3)
    latest_metrics["blink_count"] = blink_count
    latest_metrics["yawn_count"] = yawn_count
    latest_metrics["head_movement"] = head_movement
    latest_metrics["head_score"] = round(head_score, 2)
    return frame
