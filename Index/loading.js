
document.addEventListener("DOMContentLoaded", function () {
    let progressBar = document.querySelector('.progress-bar');
    let prompt = document.getElementById('prompt');
    let initializing = document.getElementById('initializing');

    // Simulate loading progress
    let width = 0;
    let progress = setInterval(function () {
        if (width >= 100) {
            clearInterval(progress);
            initializing.style.display = "block";
            prompt.style.display = "block";

            // Wait for user to press Enter key
            document.addEventListener("keypress", function (e) {
                if (e.key === 'Enter') {
                    window.location.href = 'main.html';
                }
            });
        } else {
            width++;
            progressBar.style.width = width + '%';
        }
    }, 50);
});
