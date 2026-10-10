"""Generate a reproducible synthetic dataset for the MindLoad project.

The script creates realistic, correlated facial and interaction metrics for a
three-class cognitive-load classifier. Run this file directly when you are
ready to create ``dataset.csv``.
"""

import numpy as np
import pandas as pd


RANDOM_SEED = 42
SAMPLE_COUNT = 10_000

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
    "load_score",
]


def bounded(value, minimum, maximum):
    """Keep a noisy synthetic measurement within a realistic range."""
    return float(np.clip(value, minimum, maximum))


def compute_load_score(sample, cognitive_load, rng):
    """Compute a correlated cognitive load score from generated metrics."""
    def norm(value, minimum, maximum):
        return np.clip((value - minimum) / (maximum - minimum), 0.0, 1.0)

    metrics = {
        "ear": 1.0 - norm(sample["ear"], 0.12, 0.40),
        "mar": norm(sample["mar"], 0.16, 0.90),
        "blink_count": norm(sample["blink_count"], 1, 38),
        "yawn_count": norm(sample["yawn_count"], 0, 12),
        "head_movement": norm(sample["head_movement"], 0.1, 18.0),
        "typing_speed": 1.0 - norm(sample["typing_speed"], 5, 80),
        "mouse_speed": 1.0 - norm(sample["mouse_speed"], 15, 400),
        "keyboard_idle": norm(sample["keyboard_idle"], 0.2, 75),
        "mouse_idle": norm(sample["mouse_idle"], 0.2, 70),
        "mouse_clicks": 1.0 - norm(sample["mouse_clicks"], 3, 110),
        "study_time": norm(sample["study_time"], 5, 300),
    }

    weights = {
        "ear": 0.11,
        "mar": 0.11,
        "blink_count": 0.12,
        "yawn_count": 0.14,
        "head_movement": 0.10,
        "typing_speed": 0.10,
        "mouse_speed": 0.10,
        "keyboard_idle": 0.08,
        "mouse_idle": 0.06,
        "mouse_clicks": 0.06,
        "study_time": 0.02,
    }

    score = sum(metrics[name] * weights[name] for name in weights) * 100
    score += rng.normal(0, 3)

    if cognitive_load == 0:
        return bounded(np.clip(score, 10, 35), 10, 35)
    if cognitive_load == 1:
        return bounded(np.clip(score, 36, 69), 36, 69)
    return bounded(np.clip(score, 70, 100), 70, 100)


def generate_low_sample(rng):
    """Create an alert, focused study sample (label 0)."""
    fatigue = bounded(rng.normal(0.18, 0.08), 0.0, 0.45)
    study_time = bounded(rng.normal(28, 12), 5, 60)

    sample = {
        "ear": bounded(0.31 - fatigue * 0.03 + rng.normal(0, 0.012), 0.25, 0.40),
        "mar": bounded(0.28 + fatigue * 0.08 + rng.normal(0, 0.025), 0.16, 0.45),
        "blink_count": int(np.clip(round(4 + fatigue * 7 + rng.normal(0, 2)), 1, 14)),
        "yawn_count": int(np.clip(round(fatigue * 2 + rng.normal(0, 0.5)), 0, 2)),
        "head_movement": bounded(1.2 + fatigue * 2 + rng.normal(0, 0.5), 0.1, 4.0),
        "typing_speed": bounded(55 - fatigue * 10 + rng.normal(0, 6), 35, 80),
        "mouse_speed": bounded(250 - fatigue * 55 + rng.normal(0, 35), 120, 400),
        "keyboard_idle": bounded(4 + fatigue * 8 + rng.normal(0, 2), 0.2, 15),
        "mouse_idle": bounded(3 + fatigue * 7 + rng.normal(0, 2), 0.2, 14),
        "mouse_clicks": int(np.clip(round(65 - fatigue * 10 + rng.normal(0, 12)), 25, 110)),
        "study_time": study_time,
    }
    sample["load_score"] = compute_load_score(sample, 0, rng)
    sample["cognitive_load"] = 0
    return sample


def generate_medium_sample(rng):
    """Create a moderately tired or distracted study sample (label 1)."""
    fatigue = bounded(rng.normal(0.52, 0.10), 0.30, 0.75)
    study_time = bounded(rng.normal(85, 25), 35, 150)

    sample = {
        "ear": bounded(0.30 - fatigue * 0.08 + rng.normal(0, 0.014), 0.19, 0.32),
        "mar": bounded(0.30 + fatigue * 0.28 + rng.normal(0, 0.035), 0.28, 0.62),
        "blink_count": int(np.clip(round(5 + fatigue * 18 + rng.normal(0, 3)), 7, 22)),
        "yawn_count": int(np.clip(round(fatigue * 5 + rng.normal(0, 0.8)), 1, 5)),
        "head_movement": bounded(1.5 + fatigue * 7 + rng.normal(0, 1.0), 2.0, 9.0),
        "typing_speed": bounded(58 - fatigue * 30 + rng.normal(0, 6), 22, 52),
        "mouse_speed": bounded(270 - fatigue * 180 + rng.normal(0, 35), 70, 220),
        "keyboard_idle": bounded(3 + fatigue * 28 + rng.normal(0, 4), 7, 32),
        "mouse_idle": bounded(3 + fatigue * 24 + rng.normal(0, 4), 6, 30),
        "mouse_clicks": int(np.clip(round(55 - fatigue * 18 + rng.normal(0, 10)), 15, 65)),
        "study_time": study_time,
    }
    sample["load_score"] = compute_load_score(sample, 1, rng)
    sample["cognitive_load"] = 1
    return sample


def generate_high_sample(rng):
    """Create a fatigued, high cognitive-load study sample (label 2)."""
    fatigue = bounded(rng.normal(0.84, 0.09), 0.65, 1.0)
    study_time = bounded(rng.normal(180, 45), 100, 300)

    sample = {
        "ear": bounded(0.28 - fatigue * 0.13 + rng.normal(0, 0.014), 0.12, 0.24),
        "mar": bounded(0.31 + fatigue * 0.48 + rng.normal(0, 0.045), 0.55, 0.90),
        "blink_count": int(np.clip(round(7 + fatigue * 26 + rng.normal(0, 4)), 18, 38)),
        "yawn_count": int(np.clip(round(1 + fatigue * 9 + rng.normal(0, 1.2)), 5, 12)),
        "head_movement": bounded(2 + fatigue * 13 + rng.normal(0, 1.4), 7.0, 18.0),
        "typing_speed": bounded(50 - fatigue * 36 + rng.normal(0, 5), 5, 28),
        "mouse_speed": bounded(185 - fatigue * 135 + rng.normal(0, 24), 15, 95),
        "keyboard_idle": bounded(8 + fatigue * 55 + rng.normal(0, 7), 30, 75),
        "mouse_idle": bounded(7 + fatigue * 48 + rng.normal(0, 7), 25, 70),
        "mouse_clicks": int(np.clip(round(40 - fatigue * 22 + rng.normal(0, 8)), 3, 32)),
        "study_time": study_time,
    }
    sample["load_score"] = compute_load_score(sample, 2, rng)
    sample["cognitive_load"] = 2
    return sample


def generate_dataset(sample_count=SAMPLE_COUNT, seed=RANDOM_SEED):
    """Return a balanced DataFrame of correlated synthetic load samples."""
    rng = np.random.default_rng(seed)
    generators = [generate_low_sample, generate_medium_sample, generate_high_sample]
    labels = np.arange(sample_count) % len(generators)
    rng.shuffle(labels)

    samples = [generators[label](rng) for label in labels]
    return pd.DataFrame(samples, columns=FEATURE_COLUMNS + ["cognitive_load"])


def main():
    """Generate and save the dataset when this script is run directly."""
    dataset = generate_dataset()
    dataset.to_csv("dataset.csv", index=False)
    print(f"Saved {len(dataset)} samples to dataset.csv")


if __name__ == "__main__":
    main()
