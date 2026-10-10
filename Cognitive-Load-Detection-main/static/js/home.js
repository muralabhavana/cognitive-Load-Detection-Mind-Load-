// ==========================================
// MindLoad - Home Page Script
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // Typing Animation
    // ==========================================

    const words = [
        "AI-Powered",
        "Real-Time",
        "Smart",
        "Intelligent"
    ];

    const dynamic = document.getElementById("dynamic");

    if (dynamic) {

        let wordIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        let typingSpeed = 120;

        function type() {

            const currentWord = words[wordIndex];

            if (!isDeleting) {

                dynamic.textContent = currentWord.substring(0, charIndex);
                charIndex++;

                if (charIndex > currentWord.length) {

                    isDeleting = true;
                    typingSpeed = 1500;

                } else {

                    typingSpeed = 120;

                }

            } else {

                dynamic.textContent = currentWord.substring(0, charIndex);
                charIndex--;

                if (charIndex < 0) {

                    isDeleting = false;
                    wordIndex = (wordIndex + 1) % words.length;
                    typingSpeed = 400;

                } else {

                    typingSpeed = 60;

                }

            }

            setTimeout(type, typingSpeed);

        }

        type();

    }

    // ==========================================
    // Fade In
    // ==========================================

    document.body.style.opacity = "0";

    setTimeout(() => {

        document.body.style.transition = "opacity 0.8s ease";
        document.body.style.opacity = "1";

    }, 100);

    // ==========================================
    // Start Button Animation
    // ==========================================

    const startButton = document.querySelector(".start-btn");

    if (startButton) {

        startButton.addEventListener("click", function (e) {

            e.preventDefault();

            startButton.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Initializing...';

            startButton.style.pointerEvents = "none";

            setTimeout(() => {

                window.location.href = "/dashboard";

            }, 1200);

        });

    }

});