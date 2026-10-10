# 🧠 Cognitive Load Detection

An AI-powered Cognitive Load Detection system that predicts a user's cognitive load in real time using facial landmarks extracted with **MediaPipe Face Mesh** and a **Random Forest Classifier** trained with **Scikit-learn**.

## 📌 Overview

Cognitive load refers to the amount of mental effort a person is using while performing a task. This project analyzes facial features captured through a webcam to estimate whether the user's cognitive load is **Low**, **Medium**, or **High**.

The system uses MediaPipe Face Mesh to detect facial landmarks, extracts meaningful facial features, and predicts the cognitive load level using a trained Machine Learning model.

---

## ✨ Features

- 🎥 Real-time webcam-based detection
- 😊 Facial landmark extraction using MediaPipe Face Mesh
- 🤖 Random Forest Machine Learning classifier
- 📊 Predicts cognitive load levels:
  - Low
  - Medium
  - High
- ⚡ Fast and lightweight inference
- 🖥️ User-friendly interface built with Flask

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Python | Programming Language |
| OpenCV | Webcam capture and image processing |
| MediaPipe | Face Mesh landmark detection |
| Scikit-learn | Machine Learning model |
| Random Forest | Cognitive load classification |
| NumPy | Numerical computations |
| Flask | Web application framework |
| HTML/CSS | Frontend interface |

---

## 📂 Project Structure

```
Cognitive-Load-Detection/
│
├── app.py
├── classifier.py
├── train_model.py
├── requirements.txt
│
├── templates/
│
├── static/
│
├── models/
│
├── vision/
│
└── dataset/
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/nissib8/Cognitive-Load-Detection.git

cd Cognitive-Load-Detection
```

### Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

Windows

```bash
.venv\Scripts\activate
```

Mac/Linux

```bash
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

---

## ▶️ Running the Project

Start the Flask application:

```bash
python app.py
```

Open your browser and visit:

```
http://127.0.0.1:5000
```

Allow webcam access to begin real-time cognitive load detection.

---

## 🧠 Machine Learning Workflow

1. Capture facial images using webcam.
2. Detect 468 facial landmarks using MediaPipe Face Mesh.
3. Extract landmark-based features.
4. Train a Random Forest classifier.
5. Predict cognitive load in real time.

---

## 📊 Cognitive Load Levels

The model classifies the user's mental workload into:

- 🟢 Low
- 🟡 Medium
- 🔴 High

---

## 📈 Future Enhancements

- Deep Learning models (CNN/LSTM)
- Eye gaze tracking
- Head pose estimation
- Emotion recognition
- Fatigue detection
- Performance analytics dashboard
- Multi-user support

---

## 👩‍💻 Authors

**Nissi**

Computer Science Engineering Student

Shri Vishnu Engineering College for Women

---

## 📄 License

This project is developed for educational and research purposes.
