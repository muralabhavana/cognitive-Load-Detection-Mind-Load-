"""
Train a Random Forest classifier for the MindLoad project.

This script:

1. Loads dataset.csv
2. Splits the dataset
3. Trains a Random Forest model
4. Evaluates performance
5. Saves the trained model
"""

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split


# =====================================================
# Load Dataset
# =====================================================

dataset = pd.read_csv("dataset.csv")

print("\nDataset Loaded Successfully")
print(dataset.head())


# =====================================================
# Features & Target
# =====================================================

FEATURE_COLUMNS = [
    "ear",
    "mar",
    "blink_count",
    "yawn_count",
    "head_movement",
    "typing_speed",
    "mouse_speed",
    "keyboard_idle",
    "mouse_idle",
    "mouse_clicks",
    "study_time",
]

X = dataset[FEATURE_COLUMNS]

y = dataset["cognitive_load"]


# =====================================================
# Train/Test Split
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)


# =====================================================
# Create Model
# =====================================================

model = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    random_state=42,
    n_jobs=-1,
)

print("\nTraining Random Forest...")

model.fit(X_train, y_train)

print("Training Complete!")


# =====================================================
# Evaluation
# =====================================================

predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nAccuracy")

print(f"{accuracy*100:.2f}%")

print("\nClassification Report")

print(classification_report(y_test, predictions))

print("\nConfusion Matrix")

print(confusion_matrix(y_test, predictions))


# =====================================================
# Feature Importance
# =====================================================

importance = pd.DataFrame(
    {
        "Feature": FEATURE_COLUMNS,
        "Importance": model.feature_importances_,
    }
).sort_values(by="Importance", ascending=False)

print("\nFeature Importance")

print(importance)


# =====================================================
# Save Model
# =====================================================

joblib.dump(model, "model.pkl")

joblib.dump(FEATURE_COLUMNS, "feature_columns.pkl")

print("\nModel saved as model.pkl")

print("Feature list saved as feature_columns.pkl")