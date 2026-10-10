/* ==========================================================
   timer.js
   Session Timer Module
   ========================================================== */

class SessionTimer {

    constructor(displayId) {

        this.display =
            document.getElementById(displayId);

        this.startTime = null;

        this.interval = null;

        this.running = false;

    }

    //--------------------------------------------------
    // Start Timer
    //--------------------------------------------------

    start() {

        if (this.running)
            return;

        this.running = true;

        this.startTime = Date.now();

        this.interval = setInterval(() => {

            this.update();

        }, 1000);

    }

    //--------------------------------------------------
    // Stop Timer
    //--------------------------------------------------

    stop() {

        this.running = false;

        clearInterval(this.interval);

    }

    //--------------------------------------------------
    // Reset Timer
    //--------------------------------------------------

    reset() {

        this.stop();

        if (this.display)
            this.display.innerHTML = "00:00:00";

    }

    //--------------------------------------------------
    // Update Time
    //--------------------------------------------------

    update() {

        const elapsed =
            Date.now() - this.startTime;

        const hours =
            Math.floor(elapsed / 3600000);

        const minutes =
            Math.floor(
                (elapsed % 3600000) / 60000
            );

        const seconds =
            Math.floor(
                (elapsed % 60000) / 1000
            );

        const text =
            this.pad(hours) + ":" +
            this.pad(minutes) + ":" +
            this.pad(seconds);

        if (this.display)
            this.display.innerHTML = text;

    }

    //--------------------------------------------------
    // Get Total Seconds
    //--------------------------------------------------

    getSeconds() {

        if (!this.running)
            return 0;

        return Math.floor(
            (Date.now() - this.startTime) / 1000
        );

    }

    //--------------------------------------------------
    // Get Total Minutes
    //--------------------------------------------------

    getMinutes() {

        if (!this.running)
            return 0;

        return Math.floor(
            (Date.now() - this.startTime) / 60000
        );

    }

    //--------------------------------------------------
    // Get Formatted Time
    //--------------------------------------------------

    getTime() {

        return this.display
            ? this.display.innerHTML
            : "00:00:00";

    }

    //--------------------------------------------------
    // Helper
    //--------------------------------------------------

    pad(value) {

        return value.toString().padStart(2, "0");

    }

}

//------------------------------------------------------
// Global Timer
//------------------------------------------------------

const sessionTimer =
    new SessionTimer("sessionTimer");

//------------------------------------------------------
// Helper Functions
//------------------------------------------------------

function startTimer() {

    sessionTimer.start();

}

function stopTimer() {

    sessionTimer.stop();

}

function resetTimer() {

    sessionTimer.reset();

}

function getSessionSeconds() {

    return sessionTimer.getSeconds();

}

function getSessionMinutes() {

    return sessionTimer.getMinutes();

}