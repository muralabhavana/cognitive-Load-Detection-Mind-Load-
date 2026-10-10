/* ==========================================================
   chart.js
   Backend-driven, EMA-smoothed 120-second cognitive load timeline.
   ========================================================== */

class StudyChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas || typeof Chart === "undefined") return;

        this.ctx = this.canvas.getContext("2d");
        this.maxPoints = 120;
        this.lastValidScore = null;
        this.startedAt = Date.now();
        this.fetchInProgress = false;
        this.timer = null;

        const fillGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        fillGradient.addColorStop(0, "rgba(34, 197, 94, 0.30)");
        fillGradient.addColorStop(0.7, "rgba(34, 197, 94, 0.07)");
        fillGradient.addColorStop(1, "rgba(34, 197, 94, 0)");

        this.chart = new Chart(this.ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Cognitive Load",
                    data: [],
                    borderColor: "#22c55e",
                    backgroundColor: fillGradient,
                    fill: true,
                    borderWidth: 3,
                    tension: 0.42,
                    cubicInterpolationMode: "monotone",
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    pointHitRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 300,
                    easing: "linear"
                },
                interaction: {
                    intersect: false,
                    mode: "index"
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        displayColors: false,
                        backgroundColor: "rgba(13, 17, 23, 0.94)",
                        borderColor: "rgba(34, 197, 94, 0.45)",
                        borderWidth: 1,
                        titleColor: "#ffffff",
                        bodyColor: "#bbf7d0",
                        callbacks: {
                            label: (context) => `Load: ${Math.round(context.parsed.y)}%`
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Elapsed Study Time",
                            color: "#9ca3af",
                            font: { size: 12, weight: "500" }
                        },
                        ticks: {
                            color: "#9ca3af",
                            maxTicksLimit: 7,
                            maxRotation: 0
                        },
                        grid: {
                            color: "rgba(255, 255, 255, 0.055)",
                            drawBorder: false
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: "Cognitive Load (%)",
                            color: "#9ca3af",
                            font: { size: 12, weight: "500" }
                        },
                        ticks: {
                            stepSize: 20,
                            color: "#9ca3af",
                            callback: (value) => `${value}%`
                        },
                        grid: {
                            color: "rgba(255, 255, 255, 0.075)",
                            drawBorder: false
                        }
                    }
                }
            },
            plugins: [this.createGlowPlugin()]
        });

        this.fetchCurrentScore();
        this.timer = window.setInterval(() => this.fetchCurrentScore(), 1000);
    }

    createGlowPlugin() {
        return {
            id: "mindloadLineGlow",
            beforeDatasetDraw: (chart, args) => {
                if (args.index !== 0 || !chart.data.datasets[0].data.length) return;

                chart.ctx.save();
                chart.ctx.shadowColor = "rgba(34, 197, 94, 0.70)";
                chart.ctx.shadowBlur = 12;
            },
            afterDatasetDraw: (chart, args) => {
                if (args.index === 0 && chart.data.datasets[0].data.length) {
                    chart.ctx.restore();
                }
            }
        };
    }

    normaliseScore(value) {
        if (value === null || value === undefined || value === "") return null;

        const score = Number(value);
        if (!Number.isFinite(score)) return null;

        return Math.max(0, Math.min(100, score));
    }

    async fetchCurrentScore() {
        if (this.fetchInProgress || !this.chart) return;
        this.fetchInProgress = true;

        try {
            const response = await fetch('/metrics');
            if (!response.ok) throw new Error("Unable to fetch cognitive load");

            const data = await response.json();
            const score = this.normaliseScore(data?.load_score);

            if (score !== null) {
                this.lastValidScore = score;
                this.appendScore(score);
                return;
            }

            if (this.lastValidScore !== null) {
                this.appendScore(this.lastValidScore);
                return;
            }

            console.warn("Timeline update skipped: no valid load_score available.");
        } catch (error) {
            if (this.lastValidScore !== null) {
                this.appendScore(this.lastValidScore);
                return;
            }
            console.warn("Timeline update skipped: cognitive load is unavailable.");
        } finally {
            this.fetchInProgress = false;
        }
    }

    appendScore(score) {
        const elapsedSeconds = Math.floor((Date.now() - this.startedAt) / 1000);
        const labels = this.chart.data.labels;
        const points = this.chart.data.datasets[0].data;

        labels.push(this.formatElapsedTime(elapsedSeconds));
        points.push(score);

        if (labels.length > this.maxPoints) {
            labels.shift();
            points.shift();
        }

        this.chart.update();
    }

    formatElapsedTime(seconds) {
        const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const remaining = String(seconds % 60).padStart(2, "0");
        return `${hours}:${minutes}:${remaining}`;
    }

    /*
       dashboard.js still calls addData(). The timeline deliberately fetches
       its own backend score, so calculated or NaN values cannot pollute it.
    */
    addData() {}

    clear() {
        if (!this.chart) return;

        this.chart.data.labels.length = 0;
        this.chart.data.datasets[0].data.length = 0;
        this.lastValidScore = null;
        this.startedAt = Date.now();
        this.chart.update();
    }

    destroy() {
        if (this.timer) window.clearInterval(this.timer);
        if (this.chart) this.chart.destroy();
    }
}

function initChart(canvasId) {
    return new StudyChart(canvasId);
}
