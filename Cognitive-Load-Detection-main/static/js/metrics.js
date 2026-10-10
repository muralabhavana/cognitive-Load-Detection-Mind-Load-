/* ==========================================================
   metrics.js
   Fetches Flask metrics and renders safe dashboard values.
   ========================================================== */

class MetricsManager {
    constructor() {
        this.metrics = {};
        this.interval = 500;
        this.timer = null;
        this.fetchInProgress = false;
        this.sessionStart = Date.now();
        this.currentStatus = null;
        this.pendingStatus = null;
        this.statusHoldCount = 0;
        this.statusStabilityThreshold = 2;

        this.renderMissingValues();
    }

    async fetchMetrics() {
        if (this.fetchInProgress) return;
        this.fetchInProgress = true;

        try {
            const response = await fetch('/metrics');

            if (!response.ok) {
                throw new Error(`Metrics request failed (${response.status})`);
            }

            const data = await response.json();
            this.metrics = data && typeof data === "object" ? data : {};
            this.updateDashboard();
        } catch (error) {
            // Preserve the last valid readings. On first load, use the requested placeholder.
            if (!Object.keys(this.metrics).length) this.renderMissingValues();
            console.warn("Unable to retrieve dashboard metrics.", error);
        } finally {
            this.fetchInProgress = false;
        }
    }

    validNumber(value) {
        if (value === null || value === undefined || value === "") return null;

        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    formatNumber(value, digits = 0) {
        const number = this.validNumber(value);
        return number === null ? "--" : number.toFixed(digits);
    }

    formatCount(value) {
        const number = this.validNumber(value);
        return number === null ? "--" : String(Math.round(number));
    }

    formatWithUnit(value, unit, digits = 0) {
        const number = this.validNumber(value);
        return number === null ? "--" : `${number.toFixed(digits)} ${unit}`;
    }

    formatText(value) {
        if (value === null || value === undefined || value === "") return "--";

        const text = String(value).trim();
        return text && text !== "undefined" && text !== "NaN" ? text : "--";
    }

    formatStudyTime(value) {
        const backendSeconds = this.validNumber(value);
        if (backendSeconds === null) return "--";

        const seconds = Math.max(0, Math.floor(backendSeconds));

        const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const remainingSeconds = String(seconds % 60).padStart(2, "0");
        return `${hours}:${minutes}:${remainingSeconds}`;
    }

    updateDashboard() {
        this.set("earValue", this.formatNumber(this.metrics.ear, 2));
        this.set("marValue", this.formatNumber(this.metrics.mar, 2));
        this.set("blinkCount", this.formatCount(this.metrics.blink_count));
        this.set("yawnCount", this.formatCount(this.metrics.yawn_count));
        this.set("headMovement", this.formatText(this.metrics.head_movement));

        this.set("typingSpeed", this.formatWithUnit(this.metrics.typing_speed, "WPM", 1));
        this.set("mouseSpeed", this.formatWithUnit(this.metrics.mouse_speed, "px/s", 1));
        this.set("keyboardIdle", this.formatWithUnit(this.metrics.keyboard_idle, "s", 1));
        this.set("mouseIdle", this.formatWithUnit(this.metrics.mouse_idle, "s", 1));
        this.set("mouseClicks", this.formatCount(this.metrics.mouse_clicks));
        this.set("studyTime", this.formatStudyTime(this.metrics.study_time));

        // Feed a real backend cognitive-load field to modules that use it.
        const cognitiveLoad = this.validNumber(this.metrics.load_score);

        if (typeof gauge !== "undefined" && gauge) gauge.update(cognitiveLoad, this.formatText(this.metrics.load_label));

        if (typeof showRecommendation === "function" && cognitiveLoad !== null) {
            showRecommendation(cognitiveLoad, this.validNumber(this.metrics.high_load_seconds) || 0);
        }

        this.updateStatus(cognitiveLoad);
    }

    renderMissingValues() {
        ["earValue", "marValue", "blinkCount", "yawnCount", "headMovement",
            "typingSpeed", "mouseSpeed", "keyboardIdle", "mouseIdle", "mouseClicks"]
            .forEach((id) => this.set(id, "--"));

        this.set("studyTime", "--");
    }

    set(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    updateStatus(score) {
        const status = document.getElementById("status");
        if (!status || score === null) return;

        const level = score <= 30 ? "LOW" : score <= 60 ? "MEDIUM" : "HIGH";
        const badgeText = level === "LOW"
            ? "🟢 LOW LOAD"
            : level === "MEDIUM"
                ? "🟡 MEDIUM LOAD"
                : "🔴 HIGH LOAD";
        const levelClass = level.toLowerCase();

        if (this.currentStatus === level) {
            return;
        }

        if (this.pendingStatus !== level) {
            this.pendingStatus = level;
            this.statusHoldCount = 1;
            return;
        }

        this.statusHoldCount += 1;
        if (this.statusHoldCount < this.statusStabilityThreshold) {
            return;
        }

        this.currentStatus = level;
        this.pendingStatus = null;
        this.statusHoldCount = 0;

        status.textContent = badgeText;
        status.classList.remove("low", "medium", "high", "warning", "danger");
        status.classList.add(levelClass);
    }

    start(interval = 500) {
        this.stop();
        this.interval = interval;
        this.fetchMetrics();
        this.timer = window.setInterval(() => this.fetchMetrics(), this.interval);
    }

    stop() {
        if (this.timer) window.clearInterval(this.timer);
        this.timer = null;
    }
}

const metricsManager = new MetricsManager();

window.addEventListener("DOMContentLoaded", () => {
    metricsManager.start(500);
});
