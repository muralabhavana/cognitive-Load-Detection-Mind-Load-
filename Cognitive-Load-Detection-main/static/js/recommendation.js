/* ==========================================================
   recommendation.js
   Smart Recommendation Engine
   ========================================================== */

class RecommendationManager {

    constructor() {

        this.container =
            document.getElementById("recommendationContainer");

        this.lastLevel = "";

    }

    //-------------------------------------------------
    // Main Function
    //-------------------------------------------------

    show(load, highLoadSeconds = 0) {

        let recommendation = {};

        if (load <= 30) {

            recommendation = {

                level: "LOW",

                color: "#22c55e",

                icon: "🟢",

                title: "Continue studying.",

                message:
                    "Good concentration. Keep going at your current pace."

            };

        }

        else if (load <= 60) {

            recommendation = {

                level: "MEDIUM",

                color: "#f59e0b",

                icon: "🟡",

                title: "Stretch and hydrate.",

                message:
                    "Stretch. Drink water. Adjust posture."

            };

        }

        else {

            recommendation = highLoadSeconds > 60 ? {

                level: "HIGH_SUSTAINED",

                color: "#ef4444",

                icon: "&#9888;",

                title: "Sustained High Cognitive Load",

                message:
                    "End the study session and take a recovery break."

            } : {

                level: "HIGH",

                color: "#ef4444",

                icon: "🔴",

                title: "Take a 5-10 minute break.",

                message:
                    "Close your eyes briefly. Drink water. Walk for 2 minutes."

            };

        }

        if (recommendation.level !== this.lastLevel) {

            this.lastLevel = recommendation.level;

            this.render(recommendation);

        }

    }

    //-------------------------------------------------
    // Render Card
    //-------------------------------------------------

    render(data) {

        if (!this.container)
            return;

        this.container.innerHTML = `

        <div class="recommendation-card"
             style="border-left:6px solid ${data.color};">

            <h3 style="color:${data.color};margin-bottom:10px;">

                ${data.icon} ${data.title}

            </h3>

            <p>

                ${data.message}

            </p>

        </div>

        `;

    }

}

const recommendationManager =
    new RecommendationManager();

function showRecommendation(load, highLoadSeconds) {

    recommendationManager.show(load, highLoadSeconds);

}
