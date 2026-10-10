/* ==========================================================
   dashboard.js
   Session lifecycle controller.
   ========================================================== */

let sessionStarted = false;
let gauge = null;
let studyChart = null;
let completedSummary = null;
let sessionSummaryChart = null;

window.addEventListener("DOMContentLoaded", () => {
    initialiseMonitoring();

    const endButton = document.getElementById("endBtn");
    if (endButton) endButton.addEventListener("click", endSession);

    const downloadButton = document.getElementById("downloadReportBtn");
    if (downloadButton) downloadButton.addEventListener("click", downloadSessionReport);

    const startButton = document.getElementById("startNewSessionBtn");
    if (startButton) startButton.addEventListener("click", startNewSession);

    const closeButton = document.getElementById("closeSummaryBtn");
    if (closeButton) closeButton.addEventListener("click", closeSessionSummary);

    const summaryDialog = document.getElementById("sessionSummaryDialog");
    if (summaryDialog) {
        summaryDialog.addEventListener("cancel", (event) => event.preventDefault());
    }
});

function initialiseMonitoring() {
    if (typeof initGauge === "function") gauge = initGauge("gaugeCanvas");
    if (typeof initChart === "function") studyChart = initChart("studyChart");
    startDashboard();
}

function startDashboard() {
    if (sessionStarted) return;
    sessionStarted = true;
    if (typeof startTimer === "function") startTimer();
}

function stopDashboard() {
    sessionStarted = false;
    if (typeof stopTimer === "function") stopTimer();
    if (typeof metricsManager !== "undefined") metricsManager.stop();
    if (studyChart) studyChart.destroy();
    if (gauge) gauge.destroy();

    const videoFeed = document.getElementById("videoFeed");
    if (videoFeed) videoFeed.removeAttribute("src");
}

async function endSession() {
    const endButton = document.getElementById("endBtn");
    if (!sessionStarted || !endButton) return;

    endButton.disabled = true;
    try {
        const response = await fetch("/end_session", { method: "POST" });
        if (!response.ok) throw new Error("Unable to end the session.");

        completedSummary = await response.json();
        stopDashboard();
        showSessionSummary(completedSummary);
    } catch (error) {
        console.error(error);
        endButton.disabled = false;
    }
}

function showSessionSummary(summary) {
    const dialog = document.getElementById("sessionSummaryDialog");
    const content = document.getElementById("sessionSummaryContent");
    if (!dialog || !content) return;

    content.innerHTML = [
        ["Session Duration", formatDuration(summary.duration)],
        ["Average Cognitive Load", `${formatNumber(summary.average_load)}%`],
        ["Maximum Load", `${formatNumber(summary.maximum_load)}%`],
        ["Minimum Load", `${formatNumber(summary.minimum_load)}%`],
        ["Total Blinks", formatNumber(summary.blink_count, 0)],
        ["Total Yawns", formatNumber(summary.yawn_count, 0)],
        ["Average Typing Speed", `${formatNumber(summary.average_typing_speed)} WPM`],
        ["Average Mouse Speed", `${formatNumber(summary.average_mouse_speed)} px/s`],
        ["Mouse Clicks", formatNumber(summary.mouse_clicks, 0)],
        ["Estimated Focus Percentage", `${formatNumber(summary.focus_percentage)}%`]
    ].map(([label, value]) => `<p><strong>${label}</strong>: ${value}</p>`).join("");

    renderSessionSummaryChart(summary.session_chart);
    if (!dialog.open) dialog.showModal();
}

function renderSessionSummaryChart(values) {
    const canvas = document.getElementById("sessionSummaryChart");
    if (!canvas || typeof Chart === "undefined") return;
    if (sessionSummaryChart) sessionSummaryChart.destroy();

    const scores = Array.isArray(values) ? values : [];
    sessionSummaryChart = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels: scores.map((_, index) => index + 1),
            datasets: [{
                data: scores, borderColor: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.12)",
                fill: true, tension: 0.42, borderWidth: 2, pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 450 },
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { min: 0, max: 100, display: false } }
        }
    });
}

function formatNumber(value, digits = 1) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toFixed(digits) : "--";
}

function formatDuration(value) {
    const seconds = Number(value);
    if (!Number.isFinite(seconds)) return "--";
    const total = Math.max(0, Math.floor(seconds));
    return [
        String(Math.floor(total / 3600)).padStart(2, "0"),
        String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
        String(total % 60).padStart(2, "0")
    ].join(":");
}

async function downloadSessionReport() {
    if (!completedSummary) return;

    try {
        const response = await fetch("/download_session_csv");
        if (!response.ok) throw new Error("Unable to generate CSV report.");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mindload_session.csv";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
    }
}

function closeSessionSummary() {
    const dialog = document.getElementById("sessionSummaryDialog");
    if (dialog?.open) dialog.close();
}

async function startNewSession() {
    try {
        const response = await fetch("/start_session", { method: "POST" });
        if (!response.ok) throw new Error("Unable to start a new session.");

        const dialog = document.getElementById("sessionSummaryDialog");
        if (dialog?.open) dialog.close();
        if (sessionSummaryChart) {
            sessionSummaryChart.destroy();
            sessionSummaryChart = null;
        }
        completedSummary = null;

        if (typeof resetTimer === "function") resetTimer();
        if (typeof metricsManager !== "undefined") metricsManager.start(500);
        initialiseMonitoring();

        const videoFeed = document.getElementById("videoFeed");
        if (videoFeed) videoFeed.src = `/video?session=${Date.now()}`;

        const endButton = document.getElementById("endBtn");
        if (endButton) endButton.disabled = false;
    } catch (error) {
        console.error(error);
    }
}
