/* ==========================================================
   gauge.js
   Defensive, animated cognitive-load speedometer.
   Reads load_score (0–100) from Flask's /metrics endpoint.
   ========================================================== */

class CognitiveGauge {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.valueElement = document.getElementById("loadValue");
        this.labelElement = document.getElementById("loadLabel");

        if (!this.canvas) return;

        this.ctx = this.canvas.getContext("2d");
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cx = this.width / 2;
        this.cy = this.height - 22;
        this.radius = Math.min(140, this.width / 2 - 24);

        this.displayValue = 0;
        this.targetValue = 0;
        this.targetLabel = null;
        this.hasValidScore = false;
        this.animationFrame = null;
        this.lastAnimationTime = 0;
        this.fetchInProgress = false;

        this.showWaitingState();
        this.refreshFromFlask();
        this.refreshTimer = window.setInterval(() => this.refreshFromFlask(), 1000);
    }

    /* Accept only real numeric values. Undefined and NaN never reach canvas text. */
    normaliseScore(score) {
        if (score === null || score === undefined || score === "") return null;

        const numericScore = Number(score);
        if (!Number.isFinite(numericScore)) return null;

        return Math.max(0, Math.min(100, numericScore));
    }

    /* Allows existing dashboard scripts to keep calling gauge.update(score). */
    update(score, label = null) {
        const safeScore = this.normaliseScore(score);

        if (safeScore === null) {
            if (!this.hasValidScore) this.showWaitingState();
            return;
        }

        this.hasValidScore = true;
        this.targetValue = safeScore;
        this.targetLabel = label;
        this.animateTo(safeScore, label);
    }

    async refreshFromFlask() {
        if (this.fetchInProgress) return;
        this.fetchInProgress = true;

        try {
            const response = await fetch("/metrics", {
                headers: { Accept: "application/json" },
                cache: "no-store"
            });

            if (!response.ok) throw new Error("Unable to retrieve cognitive load");

            const data = await response.json();
            // load_score is the preferred Flask field; cognitive_load supports older payloads.
            this.update(data?.load_score, data?.load_label);
        } catch (error) {
            // Keep the last known valid reading visible if the connection briefly drops.
            if (!this.hasValidScore) this.showWaitingState();
        } finally {
            this.fetchInProgress = false;
        }
    }

    animateTo(nextValue, label) {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        this.animationStart = performance.now();
        this.animationFrom = this.displayValue;
        this.animationTo = nextValue;
        this.animationDuration = 650;
        this.targetLabel = label;
        this.lastAnimationTime = 0;

        const animate = (now) => {
            if (!this.lastAnimationTime) this.lastAnimationTime = now;
            const elapsed = now - this.animationStart;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            if (now - this.lastAnimationTime >= 33) {
                this.displayValue = this.animationFrom + (this.animationTo - this.animationFrom) * easedProgress;
                this.drawSpeedometer(this.displayValue);
                this.renderReadout(this.displayValue, this.targetLabel);
                this.lastAnimationTime = now;
            }

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
                this.displayValue = nextValue;
                this.drawSpeedometer(this.displayValue);
                this.renderReadout(this.displayValue, this.targetLabel);
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    getLevel(score) {
        if (score <= 30) return { label: "LOW", color: "#22c55e" };
        if (score <= 60) return { label: "MEDIUM", color: "#f6a623" };
        return { label: "HIGH", color: "#ef4444" };
    }

    renderReadout(score, label) {
        const roundedScore = Math.round(score);
        const calculatedLevel = this.getLevel(roundedScore);
        const level = ["LOW", "MEDIUM", "HIGH"].includes(label)
            ? { label, color: calculatedLevel.color }
            : calculatedLevel;

        if (this.valueElement) {
            this.valueElement.style.visibility = "visible";
            this.valueElement.textContent = `${roundedScore}%`;
        }

        if (this.labelElement) {
            this.labelElement.textContent = level.label;
            this.labelElement.classList.remove("low", "medium", "high");
            this.labelElement.classList.add(level.label.toLowerCase());
        }
    }

    showWaitingState() {
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);

        if (this.valueElement) {
            this.valueElement.style.visibility = "hidden";
            this.valueElement.textContent = "0%";
        }

        if (this.labelElement) {
            this.labelElement.textContent = "";
            this.labelElement.classList.remove("low", "medium", "high");
        }

        this.drawSpeedometer(null);
    }

    drawSpeedometer(score) {
        const ctx = this.ctx;
        const startAngle = Math.PI;
        const endAngle = Math.PI * 2;
        const isWaiting = !Number.isFinite(score);

        ctx.clearRect(0, 0, this.width, this.height);
        ctx.lineCap = "round";

        // Subtle base ring.
        ctx.beginPath();
        ctx.lineWidth = 18;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
        ctx.arc(this.cx, this.cy, this.radius, startAngle, endAngle);
        ctx.stroke();

        // Fine ticks communicate the full 0–100 range.
        for (let tick = 0; tick <= 10; tick += 1) {
            const angle = startAngle + (tick / 10) * Math.PI;
            const outerRadius = this.radius + 10;
            const innerRadius = this.radius - (tick % 5 === 0 ? 17 : 12);

            ctx.beginPath();
            ctx.lineWidth = tick % 5 === 0 ? 2.4 : 1.5;
            ctx.strokeStyle = tick % 5 === 0
                ? "rgba(255, 255, 255, 0.48)"
                : "rgba(255, 255, 255, 0.28)";
            ctx.moveTo(
                this.cx + Math.cos(angle) * outerRadius,
                this.cy + Math.sin(angle) * outerRadius
            );
            ctx.lineTo(
                this.cx + Math.cos(angle) * innerRadius,
                this.cy + Math.sin(angle) * innerRadius
            );
            ctx.stroke();
        }

        if (isWaiting) {
            ctx.fillStyle = "#9ca3af";
            ctx.font = '600 16px "Poppins", Arial, sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("Waiting for data...", this.cx, this.cy - 54);
            this.drawHub("#6b7280");
            return;
        }

        const safeScore = this.normaliseScore(score);
        const level = this.getLevel(safeScore);
        const currentAngle = startAngle + (safeScore / 100) * Math.PI;

        // The coloured arc grows along with the animated score.
        if (safeScore > 0) {
            const gradient = ctx.createLinearGradient(0, 0, this.width, 0);
            gradient.addColorStop(0, level.color);
            gradient.addColorStop(1, this.lighten(level.color));

            ctx.beginPath();
            ctx.lineWidth = 18;
            ctx.strokeStyle = gradient;
            ctx.shadowColor = level.color;
            ctx.shadowBlur = 13;
            ctx.arc(this.cx, this.cy, this.radius, startAngle, currentAngle);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Needle rotates using exactly the same animated angle as the arc.
        const needleLength = this.radius - 31;
        const needleX = this.cx + Math.cos(currentAngle) * needleLength;
        const needleY = this.cy + Math.sin(currentAngle) * needleLength;

        ctx.beginPath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#f8fafc";
        ctx.shadowColor = "rgba(255, 255, 255, 0.35)";
        ctx.shadowBlur = 8;
        ctx.moveTo(this.cx, this.cy);
        ctx.lineTo(needleX, needleY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        this.drawHub(level.color);
    }

    drawHub(color) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.fillStyle = "#0d1117";
        ctx.arc(this.cx, this.cy, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(this.cx, this.cy, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    lighten(hex) {
        const value = parseInt(hex.slice(1), 16);
        const red = Math.min(255, (value >> 16) + 34);
        const green = Math.min(255, ((value >> 8) & 255) + 34);
        const blue = Math.min(255, (value & 255) + 34);
        return `rgb(${red}, ${green}, ${blue})`;
    }

    destroy() {
        if (this.refreshTimer) window.clearInterval(this.refreshTimer);
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.refreshTimer = null;
        this.animationFrame = null;
    }
}

function initGauge(canvasId) {
    return new CognitiveGauge(canvasId);
}
