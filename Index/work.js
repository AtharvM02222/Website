
        // Retrieve the last played time from localStorage
        window.onload = function() {
            const audio = document.getElementById('bg-music');
            const lastTime = localStorage.getItem('lastPlayedTime');
            if (lastTime) {
                audio.currentTime = lastTime; // Start from where it left off
            }
            audio.play(); // Play the song
        };

        // Save the current time of the song before the user navigates away
        window.onbeforeunload = function() {
            const audio = document.getElementById('bg-music');
            localStorage.setItem('lastPlayedTime', audio.currentTime);
        };



// Select the game card element
const gameCard = document.querySelector('.game-card');

// Add a hover event listener
gameCard.addEventListener('mouseenter', () => {
    console.log("Hovered over the game card!");
});

gameCard.addEventListener('mouseleave', () => {
    console.log("Stopped hovering over the game card!");
});
