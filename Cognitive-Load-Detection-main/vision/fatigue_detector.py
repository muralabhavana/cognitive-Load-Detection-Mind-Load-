import cv2
from scipy.spatial import distance

# ==========================
# Eye Landmark Indices
# ==========================

LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

# ==========================
# Mouth Landmark Indices
# ==========================

MOUTH = [13, 14, 78, 308, 81, 311]

# ==========================
# Blink Parameters
# ==========================

EAR_THRESHOLD = 0.23
CONSEC_FRAMES = 2

blink_counter = 0
blink_frames = 0

# ==========================
# Yawn Parameters
# ==========================

MAR_THRESHOLD = 0.65
MOUTH_CONSEC_FRAMES = 8

yawn_counter = 0
mouth_frames = 0
# ==========================
# Head Movement
# ==========================

previous_nose = None
head_movement = 0


def reset_fatigue_state():
    global blink_counter, blink_frames, yawn_counter, mouth_frames
    global previous_nose, head_movement
    blink_counter = 0
    blink_frames = 0
    yawn_counter = 0
    mouth_frames = 0
    previous_nose = None
    head_movement = 0


# ==========================
# Euclidean Distance
# ==========================

def euclidean(p1, p2):
    return distance.euclidean(p1, p2)


# ==========================
# Eye Aspect Ratio
# ==========================

def eye_aspect_ratio(eye_points):

    A = euclidean(eye_points[1], eye_points[5])
    B = euclidean(eye_points[2], eye_points[4])
    C = euclidean(eye_points[0], eye_points[3])

    ear = (A + B) / (2.0 * C)

    return ear


# ==========================
# Mouth Aspect Ratio
# ==========================

def mouth_aspect_ratio(mouth_points):

    A = euclidean(mouth_points[0], mouth_points[1])
    B = euclidean(mouth_points[4], mouth_points[5])
    C = euclidean(mouth_points[2], mouth_points[3])

    mar = (A + B) / (2.0 * C)

    return mar


# ==========================
# Fatigue Detection
# ==========================

def detect_fatigue(frame, face_landmarks):

    global blink_counter
    global blink_frames

    global yawn_counter
    global mouth_frames

    h, w, _ = frame.shape
    global previous_nose
    global head_movement

    left_eye = []
    right_eye = []
    mouth = []

    # --------------------------
    # Left Eye
    # --------------------------

    for idx in LEFT_EYE:

        landmark = face_landmarks.landmark[idx]

        x = int(landmark.x * w)
        y = int(landmark.y * h)

        left_eye.append((x, y))

    # --------------------------
    # Right Eye
    # --------------------------

    for idx in RIGHT_EYE:

        landmark = face_landmarks.landmark[idx]

        x = int(landmark.x * w)
        y = int(landmark.y * h)

        right_eye.append((x, y))

    # --------------------------
    # Mouth
    # --------------------------

    for idx in MOUTH:

        landmark = face_landmarks.landmark[idx]

        x = int(landmark.x * w)
        y = int(landmark.y * h)

        mouth.append((x, y))

    # --------------------------
    # EAR
    # --------------------------

    left_ear = eye_aspect_ratio(left_eye)
    right_ear = eye_aspect_ratio(right_eye)

    ear = (left_ear + right_ear) / 2

    # --------------------------
    # MAR
    # --------------------------

    mar = mouth_aspect_ratio(mouth)

    # --------------------------
    # Blink Detection
    # --------------------------

    if ear < EAR_THRESHOLD:

        blink_frames += 1

    else:

        if blink_frames >= CONSEC_FRAMES:

            blink_counter += 1

        blink_frames = 0

    # --------------------------
    # Yawn Detection
    # --------------------------

    if mar > MAR_THRESHOLD:

        mouth_frames += 1

    else:

        if mouth_frames >= MOUTH_CONSEC_FRAMES:

            yawn_counter += 1

        mouth_frames = 0

    # --------------------------
    # Display
    # --------------------------
    nose = face_landmarks.landmark[1]

    nose_x = int(nose.x * w)
    nose_y = int(nose.y * h)

    if previous_nose is not None:

        dx = nose_x - previous_nose[0]
        dy = nose_y - previous_nose[1]

        head_movement = (dx**2 + dy**2) ** 0.5

    previous_nose = (nose_x, nose_y)
    return (
    frame,
    ear,
    blink_counter,
    mar,
    yawn_counter,
    head_movement
)

    
